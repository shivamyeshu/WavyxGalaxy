import { task } from "@trigger.dev/sdk/v3";
import { aiGenerator } from "./workflow-nodes";
import { PrismaClient } from "@prisma/client"; // Standard import works in v5!

const prisma = new PrismaClient(); // Standard init

interface NodeData {
    id: string;
    type: "upload" | "crop-image" | "llm";
    data: any;
}

export const orchestrator = task({
    id: "workflow-orchestrator",
    run: async (payload: { runId: string }) => {
        const run = await prisma.workflowRun.findUnique({
            where: { id: payload.runId },
            include: { workflow: true },
        });

        if (!run) throw new Error(`Run ${payload.runId} not found`);

        const graph = run.workflow.data as any;
        const nodes: NodeData[] = graph.nodes;

        console.log(`🚀 Starting execution for workflow: ${run.workflow.name}`);

        // Iterate and Execute
        for (const node of nodes) {
            if (node.type !== "llm") continue;

            console.log(`Processing LLM Node: ${node.id}`);

            // Create "RUNNING" Record
            const executionRecord = await prisma.nodeExecution.create({
                data: {
                    runId: run.id,
                    nodeId: node.id,
                    nodeType: node.type,
                    status: "RUNNING",
                    startedAt: new Date(),
                    inputData: node.data ?? {},
                },
            });

            try {
                // Execute the AI Task
                const result = await aiGenerator.triggerAndWait({
                    prompt: node.data.prompt || "Explain Quantum Computing",
                });

                // FIX: Cast result to 'any' to satisfy Prisma's strict JSON type
                await prisma.nodeExecution.update({
                    where: { id: executionRecord.id },
                    data: {
                        status: "SUCCESS",
                        finishedAt: new Date(),
                        outputData: (result ?? {}) as any
                    },
                });

            } catch (error) {
                console.error(`Node ${node.id} failed:`, error);
                await prisma.nodeExecution.update({
                    where: { id: executionRecord.id },
                    data: { status: "FAILED", finishedAt: new Date(), error: String(error) },
                });
                throw error;
            }
        }
        return { status: "Workflow Completed", runId: run.id };
    },
});