"use client";

import React, { useEffect, useState } from "react";
import { Copy, Home, Link2, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/workflow/Sidebar";
import SidebarNavigation from "@/components/workflow/SidebarNavigation";
import { getPublishedWorkflowsAction, deletePublishedWorkflowAction } from "@/app/actions/workflowActions";
import type { PublishedWorkflowSummary } from "@/lib/types";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function MyPublishesPage() {
    const { user } = useUser();
    const [items, setItems] = useState<PublishedWorkflowSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copyId, setCopyId] = useState<string | null>(null);

    const fetchPublishes = async () => {
        setLoading(true);
        const res = await getPublishedWorkflowsAction();
        if (res.success) {
            setItems(res.items);
        } else if (res.error) {
            toast.error(res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPublishes();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this published link for everyone?")) return;
        setDeletingId(id);
        const res = await deletePublishedWorkflowAction(id);
        if (res.success) {
            toast.success("Publish deleted");
            fetchPublishes();
        } else if (res.error) {
            toast.error(res.error);
        }
        setDeletingId(null);
    };

    const handleCopy = async (item: PublishedWorkflowSummary) => {
        setCopyId(item.id);
        try {
            await navigator.clipboard.writeText(item.shareUrl);
            toast.success("Link copied");
        } catch (error) {
            console.error(error);
            toast.error("Unable to copy link");
        }
        setCopyId(null);
    };

    const displayName = () => {
        if (!user) return "Your";
        if (user.fullName) return `${user.fullName}'s`;
        if (user.firstName) return `${user.firstName}'s`;
        return "Your";
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white">
            <Sidebar>
                <SidebarNavigation />
            </Sidebar>

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                            <Home size={16} />
                            <span>Home</span>
                        </Link>
                        <div className="h-4 w-px bg-white/20" />
                        <h1 className="text-sm font-semibold text-white/80">{displayName()} publishes</h1>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-lg font-semibold">Published workflows</p>
                            <p className="text-white/50 text-sm">Links you shared globally. You can revoke them anytime.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-16">
                            <Loader2 className="animate-spin text-white/40" size={32} />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-white/60">
                            No published workflows yet. Open a workflow and click Publish to share a read-only link.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => (
                                <div key={item.id} className="border border-white/10 rounded-xl p-4 bg-[#111] flex flex-col gap-3">
                                    <div>
                                        <p className="text-sm font-semibold">{item.name}</p>
                                        <p className="text-xs text-white/40">Shared ID: {item.shareId}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 rounded-lg px-3 py-2 break-all">
                                        <Link2 size={12} />
                                        <span>{item.shareUrl}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleCopy(item)}
                                            disabled={copyId === item.id}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors disabled:opacity-50">
                                            {copyId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                                            Copy link
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingId === item.id}
                                            className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm text-red-100 flex items-center gap-2 transition-colors disabled:opacity-50">
                                            {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                            Delete
                                        </button>
                                    </div>
                                    <div className="text-[11px] text-white/40">Updated {new Date(item.updated_at).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
