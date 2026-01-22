import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

type Params = {
	params: Promise<{ workflowId: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { workflowId: workflowIdParam } = await params;
	const workflowId = Number(workflowIdParam);
	if (!Number.isFinite(workflowId)) {
		console.error("GET /runs invalid workflowId", { workflowIdParam });
		return NextResponse.json({ error: "Invalid workflow id" }, { status: 400 });
	}

	try {
		const ownsWorkflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
		if (!ownsWorkflow) {
			return NextResponse.json({ runs: [] });
		}

		const runs = await prisma.workflowRun.findMany({
			where: {
				workflowId,
				workflow: { userId },
			},
			include: {
				nodeExecutions: {
					orderBy: { startedAt: "asc" },
				},
			},
			orderBy: { startedAt: "desc" },
			take: 50,
		});

		return NextResponse.json({ runs });
	} catch (error) {
		console.error("Failed to fetch workflow runs:", error);
		return NextResponse.json({ error: "Failed to fetch workflow runs" }, { status: 500 });
	}
}

type NodeExecutionInput = {
	nodeId: string;
	nodeType: string;
	nodeLabel?: string | null;
	status: string;
	inputData?: unknown;
	outputData?: unknown;
	error?: string | null;
	startedAt?: string | Date;
	finishedAt?: string | Date | null;
	duration?: number | null;
};

type RunInput = {
	status: string;
	triggerType?: string | null;
	startedAt?: string | Date;
	finishedAt?: string | Date | null;
	nodeExecutions: NodeExecutionInput[];
};

export async function POST(req: NextRequest, { params }: Params) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { workflowId: workflowIdParam } = await params;
	const workflowId = Number(workflowIdParam);
	if (!Number.isFinite(workflowId)) {
		return NextResponse.json({ error: "Invalid workflow id" }, { status: 400 });
	}

	let body: RunInput;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	if (!body?.status || !Array.isArray(body.nodeExecutions)) {
		return NextResponse.json({ error: "Missing status or nodeExecutions" }, { status: 400 });
	}

	try {
		// Ensure the workflow belongs to the user
		const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
		if (!workflow) {
			return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
		}

		// Check existing runs count and delete oldest if >= 10
		const existingRuns = await prisma.workflowRun.findMany({
			where: { workflowId },
			orderBy: { startedAt: "asc" },
			select: { id: true },
		});

		if (existingRuns.length >= 10) {
			// Delete oldest runs to keep only 9, so new one makes it 10
			const toDelete = existingRuns.slice(0, existingRuns.length - 9);
			await prisma.workflowRun.deleteMany({
				where: { id: { in: toDelete.map(r => r.id) } },
			});
		}

		const run = await prisma.workflowRun.create({
			data: {
				workflowId,
				status: body.status,
				triggerType: body.triggerType ?? "MANUAL",
				startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
				finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
				nodeExecutions: {
					create: body.nodeExecutions.map((n) => ({
						nodeId: n.nodeId,
						nodeType: n.nodeType,
						nodeLabel: n.nodeLabel ?? null,
						status: n.status,
						inputData: n.inputData ?? undefined,
						outputData: n.outputData ?? undefined,
						error: n.error ?? null,
						startedAt: n.startedAt ? new Date(n.startedAt) : new Date(),
						finishedAt: n.finishedAt ? new Date(n.finishedAt) : null,
						duration: n.duration ?? null,
					})),
				},
			},
			include: {
				nodeExecutions: {
					orderBy: { startedAt: "asc" },
				},
			},
		});

		return NextResponse.json({ run }, { status: 201 });
	} catch (error) {
		console.error("Failed to create workflow run:", error);
		return NextResponse.json({ error: "Failed to create workflow run" }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: Params) {
	const { userId } = await auth();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { workflowId: workflowIdParam } = await params;
	const workflowId = Number(workflowIdParam);
	if (!Number.isFinite(workflowId)) {
		return NextResponse.json({ error: "Invalid workflow id" }, { status: 400 });
	}

	try {
		const { searchParams } = new URL(req.url);
		const runId = searchParams.get("runId");

		// Verify workflow ownership
		const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
		if (!workflow) {
			return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
		}

		if (runId) {
			// Delete single run
			await prisma.workflowRun.delete({
				where: { id: runId, workflowId },
			});
			return NextResponse.json({ message: "Run deleted" });
		} else {
			// Delete all runs for this workflow
			await prisma.workflowRun.deleteMany({
				where: { workflowId },
			});
			return NextResponse.json({ message: "All runs deleted" });
		}
	} catch (error) {
		console.error("Failed to delete workflow run(s):", error);
		return NextResponse.json({ error: "Failed to delete workflow run(s)" }, { status: 500 });
	}
}
