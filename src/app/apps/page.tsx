"use client";

import React, {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Loader2, Plus, Search, Clock, Trash2, Home, AppWindow} from "lucide-react";
import toast from "react-hot-toast";
import {getAllWorkflowsAction, deleteWorkflowAction, saveWorkflowAction} from "@/app/actions/workflowActions";
import Sidebar from "@/components/workflow/Sidebar";
import SidebarNavigation from "@/components/workflow/SidebarNavigation";
import type {Workflow} from "@/lib/types";
import {useUser} from "@clerk/nextjs";

// Workflow Icon Component
const WorkflowIcon = ({size = 24}: {size?: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
);

export default function AppsPage() {
    const router = useRouter();
    const {user} = useUser();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchWorkflows = async () => {
            setLoading(true);
            const res = await getAllWorkflowsAction();
            if (res.success) {
                setWorkflows(res.workflows);
            } else if (res.error) {
                console.error("Error fetching workflows:", res.error);
            }
            setLoading(false);
        };

        fetchWorkflows();
    }, []);

    const handleCreateNew = async () => {
        setCreating(true);

        try {
            const result = await saveWorkflowAction({
                name: "Untitled Workflow",
                nodes: [],
                edges: [],
            });

            if (result.success && result.id) {
                router.push(`/workflows/${result.id}`);
            } else {
                toast.error(`Failed to create workflow: ${result.error}`);
                setCreating(false);
            }
        } catch (error) {
            console.error("Error creating workflow:", error);
            toast.error("Something went wrong while creating the workflow.");
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this app?")) return;

        const res = await deleteWorkflowAction(id);
        if (res.success) {
            setWorkflows(workflows.filter((wf) => wf.id !== id));
            toast.success("App deleted successfully!");
        } else {
            toast.error(`Failed to delete: ${res.error}`);
        }
    };

    const filteredWorkflows = workflows.filter((wf) => wf.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getRelativeTime = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return past.toLocaleDateString();
    };

    const getUserDisplayName = () => {
        if (!user) return "Your";
        if (user.fullName) return `${user.fullName}'s`;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}'s`;
        if (user.firstName) return `${user.firstName}'s`;
        if (user.username) return `${user.username}'s`;
        return "Your";
    };

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-white font-sans">
            {/* --- SIDEBAR --- */}
            <Sidebar>
                <SidebarNavigation onCreateNew={handleCreateNew} creating={creating} />
            </Sidebar>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-white/5 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/"
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                            <Home size={16} />
                            <span>Home</span>
                        </Link>
                        <div className="h-4 w-px bg-white/20" />
                        <div className="flex items-center gap-2">
                            <AppWindow size={16} className="text-white/60" />
                            <h1 className="text-sm font-semibold text-white/80">{getUserDisplayName()} Apps</h1>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        disabled={creating}
                        className="flex items-center gap-2 border border-yellow-100 text-yellow-100 px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-yellow-100 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        {creating ? "Creating..." : "Create New App"}
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {/* --- MY APPS --- */}
                    <section className="overflow-hidden">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-base font-semibold">My Apps</h2>

                            {/* Search Bar */}
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Search apps..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors w-48"
                                />
                            </div>
                        </div>

                        {/* Apps Grid */}
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="animate-spin text-white/30" size={32} />
                            </div>
                        ) : filteredWorkflows.length === 0 ? (
                            <div className="text-center p-12 border border-dashed border-white/10 rounded-xl">
                                <p className="text-white/50">{searchQuery ? "No apps found." : "No apps yet. Create one to get started!"}</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {filteredWorkflows.map((wf) => (
                                    <Link
                                        key={wf.id}
                                        href={`/workflows/${wf.id}`}
                                        className="group rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all w-[200px]">
                                        <div>
                                            {/* Thumbnail Section - Fixed height */}
                                            <div className="h-32 bg-[#1a1a1a] flex items-center justify-center">
                                                {/* App Icon */}
                                                <div className="text-white/20 group-hover:text-white/30 transition-colors">
                                                    <WorkflowIcon size={40} />
                                                </div>
                                            </div>

                                            <div className="flex justify-between mx-4 my-4">
                                                {/* Info Section */}
                                                <div className="">
                                                    <h3 className="font-medium text-xs text-white truncate mb-0.5">{wf.name}</h3>
                                                    <p className="text-[9px] text-white/40 flex items-center gap-1">
                                                        <Clock size={8} />
                                                        Last edited {getRelativeTime(wf.updated_at)}
                                                    </p>
                                                </div>
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => handleDelete(wf.id, e)}
                                                    className="p-1 rounded-md bg-black/50 backdrop-blur-sm hover:bg-red-500/90 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Delete app">
                                                    <Trash2 size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
