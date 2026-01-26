import prisma from "@/lib/prisma";
import ReadOnlyPublishedWorkflow from "@/components/workflow/ReadOnlyPublishedWorkflow";
import { notFound } from "next/navigation";
import type { AppNode } from "@/lib/types";
import type { Edge } from "@xyflow/react";

interface Props {
    params: Promise<{ shareId: string }>;
}

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
};

export default async function SharedWorkflowPage({ params }: Props) {
    const { shareId } = await params;

    if (!shareId) {
        return notFound();
    }
    const published = await prisma.publishedWorkflow.findUnique({
        where: { shareId },
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });

    if (!published) {
        return notFound();
    }

    const data = (published.data as { nodes?: AppNode[]; edges?: Edge[] }) || { nodes: [], edges: [] };
    const ownerLabel = published.user.firstName
        ? `${published.user.firstName} ${published.user.lastName ?? ""}`.trim()
        : published.user.email;

    const shareUrl = `${getBaseUrl()}/share/${published.shareId}`;
    
    // Format date and time on server to avoid hydration mismatch
    const publishedDate = published.createdAt.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <ReadOnlyPublishedWorkflow
            name={published.name}
            nodes={data.nodes || []}
            edges={data.edges || []}
            shareId={published.shareId}
            shareUrl={shareUrl}
            ownerLabel={ownerLabel}
            publishedDate={publishedDate}
        />
    );
}
