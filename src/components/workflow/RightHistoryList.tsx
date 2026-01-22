"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock3,
	Timer,
	Trash2,
	XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

type RunStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | string;

type NodeExecution = {
	id: string;
	nodeId: string;
	nodeType: string;
	nodeLabel?: string | null;
	status: string;
	inputData?: unknown;
	outputData?: unknown;
	error?: string | null;
	startedAt: string | Date;
	finishedAt?: string | Date | null;
	duration?: number | null;
};

type WorkflowRun = {
	id: string;
	status: RunStatus;
	triggerType?: string | null;
	scope?: string | null;
	startedAt: string | Date;
	finishedAt?: string | Date | null;
	nodeExecutions: NodeExecution[];
};

const statusStyle: Record<string, { label: string; className: string }> = {
	COMPLETED: { label: "Success", className: "bg-green-500/10 text-green-300 border-green-500/30" },
	FAILED: { label: "Failed", className: "bg-red-500/10 text-red-200 border-red-500/30" },
	RUNNING: { label: "Running", className: "bg-yellow-500/10 text-yellow-200 border-yellow-500/30" },
	PENDING: { label: "Pending", className: "bg-blue-500/10 text-blue-200 border-blue-500/30" },
};

function StatusBadge({ status }: { status: RunStatus }) {
	const cfg = statusStyle[status] ?? { label: status, className: "bg-white/5 text-white/70 border-white/20" };
	return <span className={cn("px-2 py-0.5 text-[10px] rounded-full border font-semibold", cfg.className)}>{cfg.label}</span>;
}

function nodeStatusIcon(status: string) {
	if (status === "COMPLETED" || status === "SUCCESS") {
		return <CheckCircle2 className="h-4 w-4 text-green-400" />;
	}
	if (status === "FAILED") {
		return <XCircle className="h-4 w-4 text-red-400" />;
	}
	if (status === "RUNNING") {
		return <Clock3 className="h-4 w-4 text-yellow-300" />;
	}
	return <AlertTriangle className="h-4 w-4 text-white/50" />;
}

function formatDate(ts: string | Date) {
	const date = typeof ts === "string" ? new Date(ts) : ts;
	return date.toLocaleString("en-US", {
		month: "short",
		day: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDuration(ms?: number | null) {
	if (ms == null || Number.isNaN(ms)) return "N/A";
	if (ms < 1000) return `${ms} ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.round((ms % 60_000) / 1000);
	return `${minutes}m ${seconds}s`;
}

function runDuration(run: WorkflowRun) {
	const start = new Date(run.startedAt).getTime();
	const end = run.finishedAt ? new Date(run.finishedAt).getTime() : Date.now();
	return end - start;
}

function deriveScope(run: WorkflowRun) {
	if (run.scope) return run.scope;
	if (run.nodeExecutions.length === 1) return "Single node";
	if (run.status !== "COMPLETED") return "Partial run";
	return "Full workflow";
}

function previewJson(value: unknown, max = 100) {
	if (value == null) return "";
	try {
		const str = typeof value === "string" ? value : JSON.stringify(value);
		return str.length > max ? `${str.slice(0, max)}...` : str;
	} catch {
		return "(unserializable)";
	}
}

function truncateWords(text: string | unknown, maxWords = 50) {
	if (!text) return "";
	const str = typeof text === "string" ? text : JSON.stringify(text);
	const words = str.split(/\s+/);
	if (words.length > maxWords) {
		return words.slice(0, maxWords).join(" ") + "...";
	}
	return str;
}

export default function RightHistoryList() {
	const workflowId = useWorkflowStore((state) => state.workflowId);

	const [runs, setRuns] = useState<WorkflowRun[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
	const [detailsExpanded, setDetailsExpanded] = useState(true);
	const isWorkflowPersisted = Boolean(workflowId) && !Number.isNaN(Number(workflowId));
	const [creatingSample, setCreatingSample] = useState(false);
	const [deletingRunId, setDeletingRunId] = useState<string | null>(null);

	useEffect(() => {
		async function loadRuns() {
			if (!isWorkflowPersisted) {
				setRuns([]);
				setSelectedRunId(null);
				setError(null);
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/workflows/${workflowId}/runs`);
				if (!res.ok) {
					throw new Error(`Failed to load runs (${res.status})`);
				}
				const json = await res.json();
				const fetched: WorkflowRun[] = json.runs ?? [];
				setRuns(fetched);
				if (fetched.length > 0) {
					setSelectedRunId(fetched[0].id);
				} else {
					setSelectedRunId(null);
				}
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setLoading(false);
			}
		}

		loadRuns();
	}, [workflowId, isWorkflowPersisted]);

	const selectedRun = useMemo(() => runs.find((r) => r.id === selectedRunId) ?? null, [runs, selectedRunId]);

	async function logSampleRun() {
		if (!isWorkflowPersisted || !workflowId) return;
		setCreatingSample(true);
		setError(null);
		try {
			const canvasNodes = useWorkflowStore.getState().nodes;
			const now = Date.now();
			
			// Build node executions from canvas nodes
			const nodeExecutions = canvasNodes.map((node) => {
				let mockOutput = null;
				
				// Generate realistic output based on node type
				if (node.type === "textNode") {
					mockOutput = { text: node.data?.input || "Sample text output" };
				} else if (node.type === "imageNode") {
					mockOutput = { url: "https://cdn.example.com/generated-image.png" };
				} else if (node.type === "llmNode" || node.data?.label?.includes("Gemini") || node.data?.label?.includes("LLM")) {
					mockOutput = { response: "This is a simulated model response." };
				} else if (node.type === "videoNode") {
					mockOutput = { frames: 30, duration: 10 };
				}
				
				return {
					nodeId: node.id,
					nodeType: node.type,
					nodeLabel: node.data?.label || node.type,
					status: "COMPLETED",
					duration: Math.floor(Math.random() * 800) + 200,
					inputData: node.data?.input || node.data || null,
					outputData: mockOutput,
				};
			});
			
			const res = await fetch(`/api/workflows/${workflowId}/runs`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: "COMPLETED",
					triggerType: "MANUAL",
					startedAt: now,
					finishedAt: now + 1200,
					nodeExecutions,
				}),
			});
			if (!res.ok) {
				throw new Error(`Failed to create sample run (${res.status})`);
			}
			const json = await res.json();
			if (json?.run) {
				setRuns((prev) => [json.run as WorkflowRun, ...prev]);
				setSelectedRunId((json.run as WorkflowRun).id);
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setCreatingSample(false);
		}
	}

	async function deleteRun(runId: string) {
		if (!isWorkflowPersisted || !workflowId) return;
		setDeletingRunId(runId);
		try {
			const res = await fetch(`/api/workflows/${workflowId}/runs?runId=${runId}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				throw new Error(`Failed to delete run (${res.status})`);
			}
			setRuns((prev) => prev.filter((r) => r.id !== runId));
			if (selectedRunId === runId) {
				setSelectedRunId(null);
			}
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setDeletingRunId(null);
		}
	}

	async function clearAllRuns() {
		if (!isWorkflowPersisted || !workflowId) return;
		if (!confirm("Delete all runs for this workflow?")) return;
		setDeletingRunId("all");
		try {
			const res = await fetch(`/api/workflows/${workflowId}/runs`, {
				method: "DELETE",
			});
			if (!res.ok) {
				throw new Error(`Failed to clear runs (${res.status})`);
			}
			setRuns([]);
			setSelectedRunId(null);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setDeletingRunId(null);
		}
	}

	return (
		<aside className="h-full w-full bg-[#0c0c11] border-l border-white/10 text-white flex flex-col">
			<div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
				<div>
					<p className="text-xs uppercase tracking-[0.08em] text-white/50">Workflow History</p>
					<p className="text-sm font-semibold text-white/90">Runs & Node Execution</p>
				</div>
				<div className="text-right text-xs text-white/60">
					<div className="flex items-center gap-1 justify-end">
						<Timer className="h-4 w-4" /> {runs.length}
						{isWorkflowPersisted && (
							<>
								<button
									onClick={logSampleRun}
									disabled={creatingSample}
									className="ml-3 px-2 py-1 text-[10px] rounded bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
								>
									{creatingSample ? "..." : "+ Run"}
								</button>
								{runs.length > 0 && (
									<button
										onClick={clearAllRuns}
										disabled={deletingRunId === "all"}
										className="ml-2 px-2 py-1 text-[10px] rounded bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
									>
										{deletingRunId === "all" ? "..." : "Clear"}
									</button>
								)}
							</>
						)}
					</div>
					<div className="text-[10px] text-white/40">Newest first</div>
				</div>
			</div>

			<div className="flex-1 grid grid-rows-[1fr_auto] overflow-hidden">
				<div className="overflow-y-auto divide-y divide-white/5">
					{!isWorkflowPersisted && (
						<div className="p-4 text-sm text-white/60">
							Save the workflow first to start logging history.
						</div>
					)}
					{isWorkflowPersisted && loading && (
						<div className="p-4 text-sm text-white/60">Loading runs...</div>
					)}
					{isWorkflowPersisted && error && (
						<div className="p-4 text-sm text-red-300">{error}</div>
					)}
					{isWorkflowPersisted && !loading && !error && runs.length === 0 && (
						<div className="p-4 text-sm text-white/50 space-y-2">
						<p>No runs yet. Workflow execution history will appear here.</p>
						<button
							onClick={logSampleRun}
							disabled={creatingSample}
							className="w-full px-3 py-2 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50 transition-colors"
						>
							{creatingSample ? "Creating..." : "Create test run"}
						</button>
					</div>
				)}
				
					{runs.map((run) => {
						const durationLabel = formatDuration(runDuration(run));
						const scopeLabel = deriveScope(run);
						const isSelected = selectedRunId === run.id;
						const isDeleting = deletingRunId === run.id;
						return (
							<div key={run.id} className="relative group">
								<button
									className={cn(
										"w-full text-left p-3 hover:bg-white/5 transition-colors",
										isSelected && "bg-white/5 border-l-2 border-l-green-400",
										isDeleting && "opacity-50 pointer-events-none"
									)}
									onClick={() => setSelectedRunId(run.id)}
									disabled={isDeleting}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm font-semibold text-white/90">{formatDate(run.startedAt)}</div>
										<StatusBadge status={run.status} />
									</div>
									<div className="mt-1 text-xs text-white/60 flex flex-wrap items-center gap-2">
										<span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{durationLabel}</span>
										<span className="px-2 py-0.5 rounded-full bg-white/5 text-white/70 border border-white/10 text-[11px]">{scopeLabel}</span>
										<span className="text-white/50">Nodes: {run.nodeExecutions.length}</span>
									</div>
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										deleteRun(run.id);
									}}
									disabled={isDeleting}
									className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 disabled:opacity-50"
									title="Delete run"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</div>
						);
					})}
				</div>

				<div className="border-t border-white/10 bg-[#0f0f15] flex-1 overflow-y-auto flex flex-col">
					<button
						onClick={() => setDetailsExpanded(!detailsExpanded)}
						className="p-3 flex items-center gap-2 border-b border-white/10 flex-shrink-0 hover:bg-white/5 transition-colors w-full text-left"
					>
						{selectedRun ? (
							<>
								{detailsExpanded ? (
									<ChevronDown className="h-4 w-4 text-white/60" />
								) : (
									<ChevronRight className="h-4 w-4 text-white/60" />
								)}
								<div>
									<p className="text-xs text-white/60">Run Details</p>
									<p className="text-sm font-semibold text-white/90">{formatDate(selectedRun.startedAt)}</p>
								</div>
							</>
						) : (
							<>
								<ChevronRight className="h-4 w-4 text-white/60" />
								<p className="text-sm text-white/60">Select a run to view node history</p>
							</>
						)}
					</button>

					{selectedRun && detailsExpanded && (
						<div className="p-3 space-y-3 flex-1 overflow-y-auto">
							<div className="text-xs uppercase tracking-[0.08em] text-white/40 font-semibold mb-3">Node-Level Executions</div>
							{selectedRun.nodeExecutions.map((node, idx) => {
								const dur = node.duration ?? (node.startedAt && node.finishedAt ? new Date(node.finishedAt).getTime() - new Date(node.startedAt).getTime() : null);
								const inputData = node.inputData;
								const outputData = node.outputData;
								
								return (
									<div key={node.id} className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
										<div className="flex items-start justify-between gap-2 mb-2">
											<div className="flex items-center gap-2">
												<span className="text-xs text-white/40 font-mono">{idx + 1}.</span>
												{nodeStatusIcon(node.status)}
												<div>
													<p className="text-sm font-semibold text-white/90">{node.nodeLabel || node.nodeType}</p>
												</div>
											</div>
											<div className="text-right">
												<span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 border border-white/10 text-white/70">{node.status}</span>
												<p className="text-xs text-white/50 mt-0.5">{formatDuration(dur)}</p>
											</div>
										</div>

										{inputData != null && (
											<div className="mt-2 p-2 rounded bg-black/20 border-l-2 border-l-blue-500/30">
												<p className="text-[11px] font-medium text-blue-300 mb-1">Input</p>
												<p className="text-xs text-white/70 leading-relaxed font-mono break-all">{truncateWords(inputData, 50)}</p>
											</div>
										)}

										{inputData == null && (
											<div className="mt-2 p-2 rounded bg-black/20 border-l-2 border-l-white/10">
												<p className="text-[11px] font-medium text-white/50 mb-1">Input</p>
												<p className="text-xs text-white/40 italic">No input provided</p>
											</div>
										)}

										{outputData != null && (
											<div className="mt-2 p-2 rounded bg-black/20 border-l-2 border-l-green-500/30">
												<p className="text-[11px] font-medium text-green-300 mb-1">Output</p>
												<p className="text-xs text-white/70 leading-relaxed font-mono break-all">{previewJson(outputData, 180)}</p>
											</div>
										)}

										{outputData == null && (
											<div className="mt-2 p-2 rounded bg-black/20 border-l-2 border-l-white/10">
												<p className="text-[11px] font-medium text-white/50 mb-1">Output</p>
												<p className="text-xs text-white/40 italic">No output produced</p>
											</div>
										)}

										{node.error && (
											<div className="mt-2 p-2 rounded bg-black/20 border-l-2 border-l-red-500/30">
												<p className="text-[11px] font-medium text-red-300 mb-1">Error</p>
												<p className="text-xs text-red-200/80 leading-relaxed font-mono break-all">{node.error}</p>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</aside>
	);
}
