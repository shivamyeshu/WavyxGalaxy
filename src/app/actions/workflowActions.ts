"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { tasks } from "@trigger.dev/sdk/v3";
import { randomUUID } from "crypto";
import type { SaveWorkflowParams, PublishedWorkflowSummary } from "@/lib/types";

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

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

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
            // console.log(`Updating Workflow ID: ${id}`);

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

            // Check if workflow with same name exists
            let finalName = name;
            const existingWorkflows = await prisma.workflow.findMany({
                where: {
                    userId,
                    name: {
                        startsWith: name,
                    },
                },
                select: { name: true },
            });

            if (existingWorkflows.length > 0) {
                // Find the highest number suffix
                let maxNum = 0;
                const baseNameRegex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?: \\((\\d+)\\))?$`);
                
                existingWorkflows.forEach(wf => {
                    const match = wf.name.match(baseNameRegex);
                    if (match) {
                        const num = match[1] ? parseInt(match[1]) : 0;
                        if (num > maxNum) maxNum = num;
                    }
                });

                // Append next number in brackets
                finalName = `${name} (${maxNum + 1})`;
            }

            const workflow = await prisma.workflow.create({
                data: {
                    name: finalName,
                    data: workflowData as any, //The FIX: Cast to any to satisfy Prisma's strict JSON type
                    userId,
                },
            });

            revalidatePath("/workflows");
            return { success: true, id: workflow.id.toString(), name: finalName };
        }
    } catch (error) {
        console.error("Database Error:", error);
        return { success: false, error: "Failed to save workflow." };
    }
}

// ------------------------------------------------------------------
// PUBLISH ACTION
// ------------------------------------------------------------------
export async function publishWorkflowAction({ id, name, nodes, edges, forceNew }: SaveWorkflowParams & { forceNew?: boolean }) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        await ensureUserExists(userId);

        const workflowData = { nodes, edges };

        let workflowId: number | null = null;

        if (id) {
            const numericId = typeof id === "string" ? parseInt(id, 10) : id;
            if (!numericId) return { success: false, error: "Invalid Workflow ID" };

            const existing = await prisma.workflow.findFirst({ where: { id: numericId, userId } });
            if (!existing) return { success: false, error: "Workflow not found" };

            await prisma.workflow.update({
                where: { id: numericId },
                data: { name, data: workflowData as any },
            });
            workflowId = numericId;
        } else {
            const created = await prisma.workflow.create({
                data: {
                    name,
                    data: workflowData as any,
                    userId,
                },
            });
            workflowId = created.id;
        }

        const existingPublished = await prisma.publishedWorkflow.findFirst({
            where: { workflowId, userId },
        });

        let published;
        
        if (!forceNew && existingPublished) {
            // Update existing published workflow
            published = await prisma.publishedWorkflow.update({
                where: { shareId: existingPublished.shareId },
                data: {
                    data: workflowData as any,
                    name,
                    workflowId,
                },
            });
        } else {
            // Create new published workflow
            const newShareId = randomUUID();
            published = await prisma.publishedWorkflow.create({
                data: {
                    id: randomUUID(),
                    workflowId,
                    userId,
                    name,
                    data: workflowData as any,
                    shareId: newShareId,
                },
            });
        }

        const shareUrl = `${getBaseUrl()}/share/${published.shareId}`;
        revalidatePath("/my-publishes");
        revalidatePath("/workflows");
        return { success: true, shareId: published.shareId, workflowId: workflowId.toString(), url: shareUrl, isUpdate: !forceNew && !!existingPublished };
    } catch (error) {
        console.error("Publish Error:", error);
        return { success: false, error: "Failed to publish workflow." };
    }
}

// ------------------------------------------------------------------
// CHECK IF WORKFLOW IS PUBLISHED
// ------------------------------------------------------------------
export async function checkWorkflowPublishedAction(workflowId: string | number) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const numericId = typeof workflowId === "string" ? parseInt(workflowId, 10) : workflowId;
        if (!numericId) return { success: false, error: "Invalid Workflow ID" };

        const published = await prisma.publishedWorkflow.findFirst({
            where: { workflowId: numericId, userId },
        });

        if (published) {
            const shareUrl = `${getBaseUrl()}/share/${published.shareId}`;
            return { success: true, isPublished: true, shareUrl, publishedAt: published.createdAt.toISOString() };
        }

        return { success: true, isPublished: false };
    } catch (error) {
        console.error("Check Published Error:", error);
        return { success: false, error: "Failed to check publish status." };
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
// GET PUBLISHED LIST
// ------------------------------------------------------------------
export async function getPublishedWorkflowsAction() {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized", items: [] as PublishedWorkflowSummary[] };

        const published = await prisma.publishedWorkflow.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        const items: PublishedWorkflowSummary[] = published.map((p) => ({
            id: p.id,
            workflowId: p.workflowId,
            name: p.name,
            shareId: p.shareId,
            shareUrl: `${getBaseUrl()}/share/${p.shareId}`,
            created_at: p.createdAt.toISOString(),
            updated_at: p.updatedAt.toISOString(),
        }));

        return { success: true, items };
    } catch (error) {
        console.error("Fetch Published Error:", error);
        return { success: false, error: "Failed to fetch publishes.", items: [] as PublishedWorkflowSummary[] };
    }
}

// ------------------------------------------------------------------
// DELETE PUBLISHED
// ------------------------------------------------------------------
export async function deletePublishedWorkflowAction(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        const published = await prisma.publishedWorkflow.findUnique({ where: { id } });
        if (!published || published.userId !== userId) {
            return { success: false, error: "Not allowed" };
        }

        await prisma.publishedWorkflow.delete({ where: { id } });

        revalidatePath("/my-publishes");
        return { success: true };
    } catch (error) {
        console.error("Delete Published Error:", error);
        return { success: false, error: "Failed to delete published workflow." };
    }
}

// ------------------------------------------------------------------
// DUPLICATE PUBLISHED
// ------------------------------------------------------------------
export async function duplicatePublishedWorkflowAction(shareId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: "Unauthorized" };

        await ensureUserExists(userId);

        const published = await prisma.publishedWorkflow.findUnique({ where: { shareId } });
        if (!published) return { success: false, error: "Shared workflow not found" };

        const newWorkflow = await prisma.workflow.create({
            data: {
                name: `${published.name} (Copy)`,
                data: published.data as any,
                userId,
            },
        });

        revalidatePath("/workflows");
        return { success: true, id: newWorkflow.id.toString() };
    } catch (error) {
        console.error("Duplicate Published Error:", error);
        return { success: false, error: "Failed to duplicate shared workflow." };
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