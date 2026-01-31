"use client";

import React, {useState, useCallback, useEffect, useRef} from "react";
import Link from "next/link";
import {Home, Save, Loader2, Share2, FolderOpen, Layers, Play, Key, Clock, Megaphone} from "lucide-react";
import {useWorkflowStore} from "@/store/workflowStore";
import {publishWorkflowAction, saveWorkflowAction, checkWorkflowPublishedAction} from "@/app/actions/workflowActions";
import LoadWorkflowModal from "./LoadWorkflowModal";
import ApiKeyModal from "./ApiKeyModal";
import PublishSuccessModal from "./PublishSuccessModal";
import toast from "react-hot-toast";
import {useAuth} from "@clerk/nextjs";
import type {LLMNodeData, TextNodeData, ImageNodeData} from "@/lib/types";

export default function Header() {
	
	const {nodes, edges, workflowId, workflowName, setWorkflowId, setWorkflowName, updateNodeData} = useWorkflowStore();
	const [isSaving, setIsSaving] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isLoadOpen, setIsLoadOpen] = useState(false);
	const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
	const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
	const [publishedUrl, setPublishedUrl] = useState("");
	const [existingPublishUrl, setExistingPublishUrl] = useState<string | null>(null);
	const [showPublishChoice, setShowPublishChoice] = useState(false);
	const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving">("idle");
	const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const {userId} = useAuth();

	const [isEditingName, setIsEditingName] = useState(false);

	// --- AUTO-SAVE LOGIC ---
	useEffect(() => {
		// Clear existing timeout
		if (autoSaveTimeoutRef.current) {
			clearTimeout(autoSaveTimeoutRef.current);
		}

		// Don't auto-save if canvas is empty
		if (nodes.length === 0) return;

		// Set new timeout - auto-save after 3 seconds of inactivity
		autoSaveTimeoutRef.current = setTimeout(async () => {
			setAutoSaveStatus("saving");

			try {
				const result = await saveWorkflowAction({
					id: workflowId,
					name: workflowName,
					nodes,
					edges,
				});

				if (result.success && result.id) {
					setWorkflowId(result.id);
					setAutoSaveStatus("idle");
					// Don't show toast for auto-save - too noisy
				}
			} catch (error) {
				console.error("Auto-save failed:", error);
				setAutoSaveStatus("idle");
			}
		}, 3000); // 3 second debounce

		return () => {
			if (autoSaveTimeoutRef.current) {
				clearTimeout(autoSaveTimeoutRef.current);
			}
		};
	}, [nodes, edges, workflowName, workflowId, setWorkflowId]);
	const handleSave = async () => {
		if (nodes.length === 0) {
			toast.error("Canvas is empty!");
			return;
		}

		setIsSaving(true);

		try {
			const result = await saveWorkflowAction({
				id: workflowId,
				name: workflowName,
				nodes,
				edges,
			});

			if (result.success && result.id) {
				setWorkflowId(result.id);
				toast.success("Workflow saved successfully!");
			} else if (result.success) {
				toast.success("Saved, but no ID returned.");
			} else {
				toast.error(`Error: ${result.error}`);
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const handlePublish = useCallback(async () => {
		if (nodes.length === 0) {
			toast.error("Canvas is empty!");
			return;
		}

		if (!userId) {
			toast.error("Sign in to publish your workflow");
			return;
		}

		setIsPublishing(true);
		try {
			// First save the workflow
			const saveResult = await saveWorkflowAction({
				id: workflowId,
				name: workflowName,
				nodes,
				edges,
			});

			const persistedId = saveResult.success && saveResult.id ? saveResult.id : workflowId;
			if (!persistedId) {
				toast.error("Save the workflow before publishing.");
				return;
			}
			setWorkflowId(persistedId);

			// Check if already published
			const checkResult = await checkWorkflowPublishedAction(persistedId);
			if (checkResult.success && checkResult.isPublished && checkResult.shareUrl) {
				// Already published - show choice
				setExistingPublishUrl(checkResult.shareUrl);
				setShowPublishChoice(true);
				setIsPublishing(false);
				return;
			}

			// Not published yet - publish directly
			await performPublish(persistedId, false);
		} catch (error) {
			console.error(error);
			toast.error("Failed to publish workflow");
			setIsPublishing(false);
		}
	}, [nodes, edges, workflowId, workflowName, userId, setWorkflowId]);

	const performPublish = async (workflowIdToPublish: string, forceNew: boolean) => {
		setIsPublishing(true);
		setShowPublishChoice(false);
		try {
			const publishResult = await publishWorkflowAction({
				id: workflowIdToPublish,
				name: workflowName,
				nodes,
				edges,
				forceNew,
			});

			if (publishResult.success && publishResult.url) {
				setPublishedUrl(publishResult.url);
				setIsPublishModalOpen(true);
				// Try to copy but don't show error if it fails
				try {
					await navigator.clipboard.writeText(publishResult.url);
				} catch {
					// Silent fail - user can copy from modal
				}
			} else if (publishResult.error) {
				toast.error(publishResult.error);
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to publish workflow");
		} finally {
			setIsPublishing(false);
		}
	};

	// --- HANDLE SHARE (Export as JSON) ---
	const handleShare = useCallback(() => {
		if (nodes.length === 0) {
			toast.error("Nothing to share! The canvas is empty.");
			return;
		}

		// 1. Create the JSON object
		const workflowData = {
			name: workflowName,
			nodes: nodes,
			edges: edges,
			version: "1.0.0",
			exportedAt: new Date().toISOString(),
		};

		// 2. Convert to string
		const jsonString = JSON.stringify(workflowData, null, 2); // Pretty print with 2 spaces

		// 3. Create a Blob (a file-like object)
		const blob = new Blob([jsonString], {type: "application/json"});

		// 4. Create a temporary download link
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;

		// 5. Set filename (e.g., "My_First_Weavy.json")
		const filename = workflowName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "workflow";
		link.download = `${filename}.json`;

		// 6. Trigger download and cleanup
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [nodes, edges, workflowName]);

	// --- HANDLE RUN WORKFLOW (Trigger Server-Side Orchestrator) ---
	const handleRunWorkflow = useCallback(async () => {
		if (nodes.length === 0) {
			toast.error("Canvas is empty!");
			return;
		}

		// Check auth
		if (!userId) {
			toast.error("You must be signed in to run workflows!");
			return;
		}

		// Check if workflow has executable nodes
		const executableNodes = nodes.filter(
			node => node.type === "llmNode" || 
					node.type === "cropImageNode" || 
					node.type === "extractFrameNode"
		);
		
		if (executableNodes.length === 0) {
			toast.error("No executable nodes found in workflow!");
			return;
		}

		// Save workflow first (if not already saved)
		if (!workflowId) {
			toast.loading("Saving workflow before execution...", { id: "workflow-save-pre-run" });
			try {
				const saveResult = await saveWorkflowAction({
					id: workflowId,
					name: workflowName,
					nodes,
					edges,
				});

				if (saveResult.success && saveResult.id) {
					setWorkflowId(saveResult.id);
					toast.success("Workflow saved!", { id: "workflow-save-pre-run" });
				} else {
					toast.error("Failed to save workflow. Cannot execute.", { id: "workflow-save-pre-run" });
					return;
				}
			} catch (error) {
				toast.error("Failed to save workflow. Cannot execute.", { id: "workflow-save-pre-run" });
				return;
			}
		}

		const currentWorkflowId = workflowId;
		if (!currentWorkflowId) {
			toast.error("Workflow must be saved before execution");
			return;
		}

		setIsRunning(true);
		toast.loading(`Triggering server-side execution for ${executableNodes.length} node(s)...`, { id: "workflow-run" });

		try {
			// Trigger server-side orchestrator via API
			const response = await fetch(`/api/workflows/${currentWorkflowId}/run`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				throw new Error(result.error || "Failed to start workflow execution");
			}

			toast.success(`Workflow execution started! Run ID: ${result.runId}`, { id: "workflow-run" });

			// Poll for execution status
			pollExecutionStatus(currentWorkflowId, result.runId);

		} catch (error) {
			console.error("Workflow run error:", error);
			const errorMessage = error instanceof Error ? error.message : "Failed to run workflow";
			toast.error(errorMessage, { id: "workflow-run" });
			setIsRunning(false);
		}
	}, [nodes, edges, userId, workflowId, workflowName, setWorkflowId]);

	// Poll execution status and update node states
	const pollExecutionStatus = useCallback(async (wfId: string, runId: string) => {
		console.log(`🔄 [POLL] Starting status polling for workflow ${wfId}, run ${runId}`);
		const maxAttempts = 60; // Poll for up to 60 seconds
		let attempts = 0;

		const pollInterval = setInterval(async () => {
			attempts++;
			console.log(`📡 [POLL] Attempt ${attempts}/${maxAttempts}`);

			try {
				const response = await fetch(`/api/workflows/${wfId}/run`);
				console.log(`📥 [POLL] Response status: ${response.status}`);
				const result = await response.json();
				console.log(`📊 [POLL] Result:`, { success: result.success, runStatus: result.run?.status, executions: result.run?.nodeExecutions?.length });

				if (!result.success || !result.run) {
					throw new Error("Failed to get execution status");
				}

				const run = result.run;

				// Update node statuses based on executions
				if (run.nodeExecutions && run.nodeExecutions.length > 0) {
					console.log(`🔄 [POLL] Processing ${run.nodeExecutions.length} node executions`);
					run.nodeExecutions.forEach((execution: any) => {
						console.log(`📝 [POLL] Node ${execution.nodeId}: ${execution.status}`, execution);
						
						if (execution.status === "SUCCESS" && execution.outputData) {
							console.log(`✅ [POLL] Updating node ${execution.nodeId} with success data:`, execution.outputData);
							
							// Extract text from various possible locations
							const outputText = execution.outputData.text || 
											 execution.outputData.result?.text ||
											 (execution.outputData.success && execution.outputData.output);
							
							console.log(`📄 [POLL] Extracted text (${outputText?.length || 0} chars):`, outputText?.substring(0, 100));
							
							// Prepare update data
							const updateData: any = {
								status: "success",
								outputs: outputText ? [{
									id: crypto.randomUUID(),
									type: "text",
									content: outputText,
									timestamp: Date.now(),
								}] : undefined,
							};
							
							// Add cropped image if present
							if (execution.outputData.croppedImageUrl) {
								console.log(`🖼️ [POLL] Cropped image URL: ${execution.outputData.croppedImageUrl}`);
								updateData.croppedImage = execution.outputData.croppedImageUrl;
								updateData.status = "success";
							}
							
							// Add extracted frames if present
							if (execution.outputData.frames && Array.isArray(execution.outputData.frames)) {
								console.log(`🎬 [POLL] Extracted ${execution.outputData.frames.length} frames`);
								// ExtractFrameNode expects 'extractedFrame' (single frame URL)
								// For now, use the first frame if available
								if (execution.outputData.frames.length > 0) {
									updateData.extractedFrame = execution.outputData.frames[0];
									updateData.status = "success";
								}
							}
							
							updateNodeData(execution.nodeId, updateData);
						} else if (execution.status === "FAILED") {
							console.log(`❌ [POLL] Updating node ${execution.nodeId} with error`);
							updateNodeData(execution.nodeId, {
								status: "error",
								errorMessage: execution.error || "Execution failed",
							});
						} else if (execution.status === "RUNNING") {
							console.log(`⏳ [POLL] Node ${execution.nodeId} is running`);
							updateNodeData(execution.nodeId, {
								status: "loading",
							});
						}
					});
				} else {
					console.log(`⚠️ [POLL] No node executions found in response!`);
				}

				// Check if workflow is complete
				if (run.status === "COMPLETED") {
					console.log(`✅ [POLL] Workflow COMPLETED`);
					clearInterval(pollInterval);
					setIsRunning(false);
					
					const successCount = run.nodeExecutions.filter((e: any) => e.status === "SUCCESS").length;
					const failedCount = run.nodeExecutions.filter((e: any) => e.status === "FAILED").length;
					console.log(`📊 [POLL] Results - Success: ${successCount}, Failed: ${failedCount}`);
					
					if (failedCount === 0) {
						toast.success(`All ${successCount} nodes executed successfully!`, { id: "workflow-run" });
					} else {
						toast.error(`${successCount} succeeded, ${failedCount} failed`, { id: "workflow-run" });
					}
				} else if (run.status === "FAILED") {
					clearInterval(pollInterval);
					setIsRunning(false);
					toast.error("Workflow execution failed", { id: "workflow-run" });
				}

				// Stop polling after max attempts
				if (attempts >= maxAttempts) {
					clearInterval(pollInterval);
					setIsRunning(false);
					toast.error("Execution timeout - check run history", { id: "workflow-run" });
				}

			} catch (error) {
				console.error("Poll error:", error);
				clearInterval(pollInterval);
				setIsRunning(false);
				toast.error("Failed to monitor execution", { id: "workflow-run" });
			}
		}, 1000); // Poll every second
	}, [updateNodeData]);

	return (
		<>
			<header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#111]">
				{/* --- LEFT SIDE (Logo + Name Input + Auto-Save Status) --- */}
				<div className="flex items-center gap-3">
					<Layers size={20} className="text-yellow-100" />

					{/* Editable Workflow Name */}
					{isEditingName ? (
						<input
							type="text"
							value={workflowName}
							onChange={(e) => setWorkflowName(e.target.value)}
							onBlur={() => setIsEditingName(false)}
							onKeyDown={(e) => {
								if (e.key === "Enter") setIsEditingName(false);
								if (e.key === "Escape") {
									setIsEditingName(false);
								}
							}}
							autoFocus
							className="bg-[#222] text-sm font-bold text-white px-2 py-1 rounded border border-yellow-100 focus:outline-none"
						/>
					) : (
						<h1
							onClick={() => setIsEditingName(true)}
							className="text-sm font-bold text-white tracking-wider cursor-text hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-2">
							{workflowName}
							{workflowId && <span className="opacity-50 font-normal text-xs">#{workflowId}</span>}
						</h1>
					)}

					{/* Auto-Save Status */}
					{autoSaveStatus === "saving" && (
						<div className="flex items-center gap-1 text-xs text-yellow-100/70 ml-4">
							<Clock size={14} className="animate-spin" />
							<span>Auto-saving...</span>
						</div>
					)}
				</div>

				{/* --- RIGHT SIDE (Buttons) --- */}
				<div className="flex gap-2">
					<Link
						href="/workflows"
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all group"
					>
						<Home size={14} className="group-hover:text-blue-400 transition-colors" />
						HOME
					</Link>

					<button
						onClick={() => setIsApiKeyOpen(true)}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all group">
						<Key size={14} className="group-hover:text-blue-400 transition-colors" />
						API KEY
					</button>

					{/* Open Button */}
					<button
						onClick={() => setIsLoadOpen(true)}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all">
						<FolderOpen size={14} />
						OPEN
					</button>

					{/* Share Button */}
					<button
						onClick={handleShare}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/10 transition-all group">
						<Share2 size={14} className="group-hover:text-yellow-100 transition-colors" />
						SHARE
					</button>

					{/* Publish Button */}
					<button
						onClick={handlePublish}
						disabled={isPublishing}
						className="flex items-center gap-2 px-3 py-2 bg-[#222] border border-yellow-100/30 text-yellow-100 text-xs font-bold rounded-lg hover:bg-yellow-100 hover:text-black transition-all disabled:opacity-50">
						{isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
						{isPublishing ? "PUBLISHING" : "PUBLISH"}
					</button>

					{/* Run Workflow Button */}
					<button
						onClick={handleRunWorkflow}
						disabled={isRunning}
						className="flex items-center gap-2 px-4 py-2 bg-green-300/20 text-white text-xs font-bold rounded-lg hover:bg-green-400/20 transition-all disabled:opacity-50 hover:scale-105 active:scale-95">
						{isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
						{isRunning ? "RUNNING..." : "RUN WORKFLOW"}
					</button>

					{/* Save Button */}
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-black text-xs font-bold rounded-lg hover:bg-white transition-all disabled:opacity-50 hover:scale-105 active:scale-95">
						{isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
						{isSaving ? "SAVING..." : "SAVE"}
					</button>
				</div>
			</header>

			<LoadWorkflowModal isOpen={isLoadOpen} onClose={() => setIsLoadOpen(false)} />
			<ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} />
			
			{/* Publish Choice Modal - Update or Create New */}
			{showPublishChoice && existingPublishUrl && (
				<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">
					<div className="relative w-full max-w-lg mx-4 bg-[#1a1a1a] border-2 border-yellow-100/30 rounded-2xl shadow-2xl p-6">
						<h3 className="text-xl font-bold text-white mb-2">Already Published</h3>
						<p className="text-sm text-white/70 mb-6">This workflow is already published. What would you like to do?</p>
						
						<div className="space-y-3">
							<button
								onClick={() => performPublish(workflowId!, false)}
								disabled={isPublishing}
								className="w-full px-5 py-3 rounded-lg bg-yellow-100 hover:bg-white text-black font-semibold transition-all text-left disabled:opacity-60">
								<div className="font-bold mb-1">Update Existing</div>
								<div className="text-xs text-black/70">Keep the same link, update the workflow content</div>
							</button>
							
							<button
								onClick={() => performPublish(workflowId!, true)}
								disabled={isPublishing}
								className="w-full px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all text-left disabled:opacity-60">
								<div className="font-bold mb-1">Publish as New</div>
								<div className="text-xs text-white/60">Create a new shareable link</div>
							</button>

							<button
								onClick={() => {
									setShowPublishChoice(false);
									setIsPublishing(false);
								}}
								className="w-full px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all">
								Cancel
							</button>
						</div>

						<div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
							<p className="text-xs text-blue-300 font-medium mb-1">Current published link:</p>
							<p className="text-xs text-white/60 font-mono break-all">{existingPublishUrl}</p>
						</div>
					</div>
				</div>
			)}
			
			<PublishSuccessModal 
				isOpen={isPublishModalOpen} 
				onClose={() => setIsPublishModalOpen(false)} 
				shareUrl={publishedUrl}
				workflowName={workflowName}
			/>
		</>
	);
}
