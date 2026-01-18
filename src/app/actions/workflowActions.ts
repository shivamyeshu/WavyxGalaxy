"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk/v3";
import type { SaveWorkflowParams } from "@/lib/types";

// Helper to ensure User exists in our DB before acting
async function ensureUserExists(userId: string) {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!dbUser) {
        const clerkUser = await currentUser();
        if (!clerkUser) throw new Error("User not found in Clerk");

        await prisma.user.create({
            data: {
                id: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
            },
        });
    }
}

// ------------------------------------------------------------------
// SAVE ACTION
// ------------------------------------------------------------------
export async function saveWorkflowAction({ id, name, nodes, edges }: SaveWorkflowParams) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        await ensureUserExists(userId);

        // FIX: Prepare JSON data
        // We cast to 'any' because Prisma's InputJsonValue is stricter than 
        // our complex Node types, even though they are valid JSON at runtime.
        const workflowData = { nodes, edges };

        if (id) {
            // UPDATE Existing
            console.log(`Updating Workflow ID: ${id}`);

            const numericId = typeof id === "string" ? parseInt(id) : id;
            if (!numericId) return { success: false, error: "Invalid Workflow ID" };

            const workflow = await prisma.workflow.update({
                where: {
                    id: numericId,
                    userId: userId,
                },
                data: {
                    name,
                    data: workflowData as any, //The FIX: Cast to any to satisfy Prisma's strict JSON type
                },
            });

            revalidatePath("/workflows");
            return { success: true, id: workflow.id.toString() };
        } else {
            // CREATE New
            console.log(`Creating New Workflow for: ${userId}`);

            const workflow = await prisma.workflow.create({
                data: {
                    name,
                    data: workflowData as any, //The FIX: Cast to any to satisfy Prisma's strict JSON type
                    userId,
                },
            });

            revalidatePath("/workflows");
            return { success: true, id: workflow.id.toString() };
        }
    } catch (error) {
        console.error("Database Error:", error);
        return { success: false, error: "Failed to save workflow." };
    }
}

// ------------------------------------------------------------------
// LOAD ACTION
// ------------------------------------------------------------------
export async function loadWorkflowAction(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const workflow = await prisma.workflow.findUnique({
            where: {
                id: parseInt(id),
                userId: userId,
            },
        });

        if (!workflow) return { success: false, error: "Workflow not found" };

        // Define a type for workflow data if not already defined
        type WorkflowData = {
            nodes: unknown[];
            edges: unknown[];
        };

        return {
            success: true,
            data: workflow.data as WorkflowData,
            name: workflow.name,
        };
    } catch (error) {
        console.error("Load Error:", error);
        return { success: false, error: "Failed to load workflow." };
    }
}

// ------------------------------------------------------------------
// GET ALL ACTION
// ------------------------------------------------------------------
export async function getAllWorkflowsAction() {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized", workflows: [] };

        const workflows = await prisma.workflow.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            select: {
                id: true,
                name: true,
                updatedAt: true,
                createdAt: true,
            },
        });

        interface WorkflowSummary {
            id: string;
            name: string;
            created_at: string;
            updated_at: string;
        }

        interface PrismaWorkflow {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        }

        const formattedWorkflows: WorkflowSummary[] = (workflows as PrismaWorkflow[]).map((wf: PrismaWorkflow) => ({
            id: wf.id.toString(),
            name: wf.name,
            created_at: wf.createdAt.toISOString(),
            updated_at: wf.updatedAt.toISOString(),
        }));

        return { success: true, workflows: formattedWorkflows };
    } catch (error) {
        console.error("Fetch Workflows Error:", error);
        return { success: false, error: "Failed to fetch workflows.", workflows: [] };
    }
}

// ------------------------------------------------------------------
// DELETE ACTION
// ------------------------------------------------------------------
export async function deleteWorkflowAction(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        await prisma.workflow.delete({
            where: {
                id: parseInt(id),
                userId: userId,
            },
        });

        revalidatePath("/workflows");
        return { success: true };
    } catch (error) {
        console.error("Delete Error:", error);
        return { success: false, error: "Failed to delete workflow." };
    }
}

// ------------------------------------------------------------------
// RUN ACTION (Trigger.dev)
// ------------------------------------------------------------------
export async function runWorkflowAction(workflowId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const run = await prisma.workflowRun.create({
            data: {
                workflowId: parseInt(workflowId),
                status: "PENDING",
                triggerType: "MANUAL",
            },
        });

        await tasks.trigger("workflow-orchestrator", {
            runId: run.id,
        });

        return { success: true, runId: run.id };
    } catch (error) {
        console.error("Run Workflow Error:", error);
        return { success: false, error: "Failed to run workflow." };
    }
}