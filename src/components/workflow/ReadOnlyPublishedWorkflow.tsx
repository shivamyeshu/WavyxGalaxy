"use client";

import React, { useMemo, useState } from "react";
import { MarkerType } from "@xyflow/react";
import {
    Background,
    BackgroundVariant,
    Controls,
    Edge,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { duplicatePublishedWorkflowAction } from "@/app/actions/workflowActions";
import type { AppNode } from "@/lib/types";
import { Copy, ExternalLink, Loader2, Lock, Mail, Sparkles, Wand2 } from "lucide-react";
import toast from "react-hot-toast";

// Import actual node components
import TextNode from "@/components/workflow/nodes/TextNode";
import ImageNode from "@/components/workflow/nodes/ImageNode";
import CropImageNode from "@/components/workflow/nodes/CropImageNode";
import VideoNode from "@/components/workflow/nodes/VideoNode";
import ExtractFrameNode from "@/components/workflow/nodes/ExtractFrameNode";
import LLMNode from "@/components/workflow/nodes/LLMNode";
import AnimatedEdge from "@/components/workflow/edges/AnimatedEdge";

interface Props {
    name: string;
    nodes: AppNode[];
    edges: Edge[];
    shareId: string;
    shareUrl: string;
    ownerLabel?: string;
    publishedDate?: string;
}

// Use the actual node types from the editor
const nodeTypes = {
    textNode: TextNode,
    imageNode: ImageNode,
    cropImageNode: CropImageNode,
    videoNode: VideoNode,
    extractFrameNode: ExtractFrameNode,
    llmNode: LLMNode,
};

const edgeTypes = {
    animatedEdge: AnimatedEdge,
};

function Flow({ nodes, edges }: { nodes: AppNode[]; edges: Edge[] }) {
    // Use animated edges with proper type
    const styledEdges = useMemo(
        () =>
            (edges || []).map((edge) => ({
                ...edge,
                type: 'animatedEdge',
                animated: true,
            })),
        [edges]
    );

    return (
        <ReactFlow
            nodes={nodes || []}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll
            panOnScroll
            colorMode="dark"
            fitView
            proOptions={{ hideAttribution: true }}
        >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
            <Controls 
                className="!bg-[#1a1a1a] !border-yellow-100/30"
                showInteractive={false}
            />
            <MiniMap
                className="bg-[#111] border border-yellow-100/30 !bottom-4 !right-4"
                maskColor="rgba(0,0,0, 0.8)"
                nodeColor={() => "#fef3c7"}
            />
        </ReactFlow>
    );
}

export default function ReadOnlyPublishedWorkflow({ name, nodes, edges, shareId, shareUrl, ownerLabel, publishedDate }: Props) {
    const router = useRouter();
    const [isCopying, setIsCopying] = useState(false);
    const [isCloning, setIsCloning] = useState(false);

    const onCopyLink = async () => {
        setIsCopying(true);
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success("Link copied");
        } catch (error) {
            console.error(error);
            toast.error("Unable to copy link");
        }
        setIsCopying(false);
    };

    const onDuplicate = async () => {
        setIsCloning(true);
        const res = await duplicatePublishedWorkflowAction(shareId);
        if (res.success && res.id) {
            toast.success("Workflow copied to your workspace");
            router.push(`/workflows/${res.id}`);
        } else if (res.error === "Unauthorized") {
            // If not authenticated, redirect to sign-up
            router.push(`/sign-up?redirect_url=/share/${shareId}`);
        } else if (res.error) {
            toast.error(res.error);
        } else {
            toast.error("Could not duplicate workflow");
        }
        setIsCloning(false);
    };

    const memoNodes = useMemo(() => nodes || [], [nodes]);
    const memoEdges = useMemo(() => edges || [], [edges]);

    return (
        <div className="min-h-screen bg-[#080808] text-white relative">
            {/* Contact Dev - Small corner badge */}
            <a
                href="https://www.linkedin.com/in/shivam-yeshu"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 backdrop-blur border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-lg">
                <Mail size={12} />
                <span>Dev</span>
            </a>

            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-6 flex-wrap">
                        <div className="h-14 w-14 rounded-xl bg-yellow-100/15 border-2 border-yellow-100/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Sparkles size={24} className="text-yellow-100" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs text-yellow-100/70 uppercase tracking-wider font-bold">SHARED WORKFLOW</p>
                            </div>
                            <h1 className="text-4xl font-black text-white mb-3 leading-tight">{name}</h1>
                            <div className="flex items-center gap-3 flex-wrap">
                                {ownerLabel && (
                                    <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 font-medium">
                                        by {ownerLabel}
                                    </span>
                                )}
                                {publishedDate && (
                                    <span className="text-xs px-3 py-1.5 rounded-full bg-yellow-100/10 border border-yellow-100/30 text-yellow-100/90 flex items-center gap-1.5 font-medium">
                                        <Sparkles size={10} />
                                        {publishedDate}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            onClick={onCopyLink}
                            disabled={isCopying}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all disabled:opacity-60 hover:scale-105 active:scale-95">
                            {isCopying ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                            Copy Link
                        </button>
                        <button
                            onClick={onDuplicate}
                            disabled={isCloning}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-100 hover:bg-white text-black text-sm font-bold transition-all disabled:opacity-60 shadow-lg hover:scale-105 active:scale-95">
                            {isCloning ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                            Use this workflow
                        </button>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                            <ExternalLink size={14} />
                            <span className="max-w-xs truncate">{shareUrl}</span>
                        </a>
                    </div>
                </div>

                <div className="h-[70vh] border-2 border-yellow-100/20 rounded-2xl overflow-hidden bg-[#0f0f0f] shadow-2xl">
                    <ReactFlowProvider>
                        <Flow nodes={memoNodes} edges={memoEdges} />
                    </ReactFlowProvider>
                </div>

                <div className="flex items-start gap-4 px-4 py-3 rounded-lg bg-blue-950/30 border border-blue-500/20">
                    <Lock size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm text-white/80">
                        <p className="font-semibold text-blue-300 mb-1">How to use this workflow:</p>
                        <p className="text-white/70">Click "<strong>Use this workflow</strong>" above to create an editable copy in your workspace. You'll be able to modify nodes, add new ones, and run it with your own inputs.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
