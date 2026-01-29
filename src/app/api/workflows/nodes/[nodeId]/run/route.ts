import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";

/**
 * POST /api/workflows/nodes/[nodeId]/run
 * Execute a single node via Trigger.dev (for manual testing)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { nodeId } = await params;
        const body = await req.json();
        const { workflowId, nodeData, edges, allNodes } = body;

        console.log(`[INFO] [SINGLE NODE] User ${userId} running node ${nodeId}`);

        // Create a temporary WorkflowRun for tracking
        const workflowRun = await prisma.workflowRun.create({
            data: {
                workflowId: parseInt(workflowId),
                status: "RUNNING",
                triggerType: "MANUAL",
                startedAt: new Date(),
            },
        });

        console.log(`[INFO] [SINGLE NODE] Created WorkflowRun: ${workflowRun.id}`);

        // Trigger the single-node executor task
        const handle = await tasks.trigger("single-node-executor", {
            runId: workflowRun.id,
            nodeId,
            nodeData,
            edges,
            allNodes,
            userId,  // 🔑 Pass userId for API key lookup
        });

        console.log(`[SUCCESS] [SINGLE NODE] Triggered task: ${handle.id}`);

        return NextResponse.json({
            success: true,
            runId: workflowRun.id,
            taskId: handle.id,
        });

    } catch (error) {
        console.error("[ERROR] [SINGLE NODE] Error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/workflows/nodes/[nodeId]/run?runId=xxx
 * Get execution result for a single node
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ nodeId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { nodeId } = await params;
        const searchParams = req.nextUrl.searchParams;
        const runId = searchParams.get("runId");

        if (!runId) {
            return NextResponse.json({ success: false, error: "runId required" }, { status: 400 });
        }

        // Get the WorkflowRun with NodeExecutions
        const run = await prisma.workflowRun.findFirst({
            where: {
                id: runId,
            },
            include: {
                nodeExecutions: {
                    where: {
                        nodeId: nodeId,
                    },
                    orderBy: {
                        startedAt: "desc",
                    },
                },
            },
        });

        if (!run) {
            return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            run: {
                id: run.id,
                status: run.status,
                nodeExecutions: run.nodeExecutions,
            },
        });

    } catch (error) {
        console.error("[ERROR] [SINGLE NODE GET] Error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
