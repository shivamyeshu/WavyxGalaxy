import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workflowId: string }> }
) {
    console.log("\n🌐 [API POST] ===== Workflow Run Request =====");
    try {
        console.log("🔐 [API POST] Checking authentication...");
        const { userId } = await auth();
        if (!userId) {
            console.log("❌ [API POST] Unauthorized - No user ID");
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }
        console.log(`✅ [API POST] Authenticated user: ${userId}`);

        const { workflowId } = await params;
        console.log(`📋 [API POST] Workflow ID from params: ${workflowId}`);
        const workflowIdInt = parseInt(workflowId);
        console.log(`🔢 [API POST] Parsed workflow ID: ${workflowIdInt}`);

        if (isNaN(workflowIdInt)) {
            return NextResponse.json(
                { success: false, error: "Invalid workflow ID" },
                { status: 400 }
            );
        }

        console.log(`🔍 [API POST] Looking up workflow ${workflowIdInt} for user ${userId}...`);
        // Verify workflow exists and belongs to user
        const workflow = await prisma.workflow.findUnique({
            where: {
                id: workflowIdInt,
                userId: userId,
            },
        });
        
        console.log(`📊 [API POST] Workflow found:`, { id: workflow?.id, name: workflow?.name });

        if (!workflow) {
            console.log(`❌ [API POST] Workflow not found or unauthorized`);
            return NextResponse.json(
                { success: false, error: "Workflow not found" },
                { status: 404 }
            );
        }

        // Validate workflow has executable nodes
        interface WorkflowGraph {
            nodes?: Array<{ id: string; type: string; data?: unknown }>;
            edges?: Array<{ id: string; source: string; target: string }>;
        }
        const workflowData = workflow.data as WorkflowGraph;
        const nodes = workflowData?.nodes || [];
        
        const executableNodes = nodes.filter((node) => 
            node.type === "llmNode" || 
            node.type === "cropImageNode" || 
            node.type === "extractFrameNode"
        );

        if (executableNodes.length === 0) {
            return NextResponse.json(
                { success: false, error: "No executable nodes found in workflow" },
                { status: 400 }
            );
        }

        console.log(`💾 [API POST] Creating WorkflowRun record...`);
        // Create a WorkflowRun record
        const run = await prisma.workflowRun.create({
            data: {
                workflowId: workflowIdInt,
                status: "PENDING",
                triggerType: "MANUAL",
            },
        });
        console.log(`✅ [API POST] WorkflowRun created with ID: ${run.id}`);

        console.log(`🚀 [API POST] Triggering Trigger.dev orchestrator...`);
        
        let triggerHandleId: string | undefined;
        
        try {
            // Trigger the Trigger.dev orchestrator
            const handle = await tasks.trigger("workflow-orchestrator", {
                runId: run.id,
            });
            triggerHandleId = handle.id;
            console.log(`✅ [API POST] Orchestrator triggered with handle: ${triggerHandleId}`);
        } catch (triggerError) {
            console.error(`❌ [API POST] Trigger.dev failed:`, triggerError);
            console.log(`⚠️ [API POST] Falling back to direct execution...`);
            
            // Fallback: Execute directly if Trigger.dev is not available
            // This allows testing without Trigger.dev running
            import("@/trigger/orchestrator").then(async (module) => {
                try {
                    await module.orchestrator.run({ runId: run.id });
                    console.log(`✅ [API POST] Direct execution completed`);
                } catch (execError) {
                    console.error(`❌ [API POST] Direct execution failed:`, execError);
                }
            });
        }
        
        console.log(`✅ [API POST] ===== Request Complete =====\n`);

        return NextResponse.json({
            success: true,
            runId: run.id,
            triggerHandle: triggerHandleId,
            message: `Workflow execution started with ${executableNodes.length} node(s)`,
        });
    } catch (error) {
        console.error("Run Workflow Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to start workflow execution" },
            { status: 500 }
        );
    }
}

// GET endpoint to check run status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workflowId: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { workflowId } = await params;
        const workflowIdInt = parseInt(workflowId);

        // Get latest run for this workflow
        const latestRun = await prisma.workflowRun.findFirst({
            where: {
                workflowId: workflowIdInt,
                workflow: {
                    userId: userId,
                },
            },
            include: {
                nodeExecutions: {
                    orderBy: {
                        startedAt: "asc",
                    },
                },
            },
            orderBy: {
                startedAt: "desc",
            },
        });

        if (!latestRun) {
            return NextResponse.json({
                success: true,
                run: null,
            });
        }

        return NextResponse.json({
            success: true,
            run: latestRun,
        });
    } catch (error) {
        console.error("Get Run Status Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to get run status" },
            { status: 500 }
        );
    }
}
