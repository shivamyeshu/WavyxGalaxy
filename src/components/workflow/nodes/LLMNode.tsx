"use client";

import React, {useCallback, useState, useEffect, useRef} from "react";
import {Handle, Position, NodeProps, useReactFlow, useUpdateNodeInternals} from "@xyflow/react";
import {Bot, Plus, Loader2, MoreHorizontal, Settings2, Copy, Check, Trash2, X} from "lucide-react";
import {cn} from "@/lib/utils";
import type {LLMNodeData, LLMNodeType, TextNodeData, ImageNodeData} from "@/lib/types";
import {useWorkflowStore} from "@/store/workflowStore";
import {useAuth} from "@clerk/nextjs";

export default function LLMNode({id, data, isConnectable, selected}: NodeProps<LLMNodeType>) {
	const {userId} = useAuth();
	// Use individual selectors to avoid infinite loop
	const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
	const deleteNode = useWorkflowStore((state) => state.deleteNode);

	const {getNodes, getEdges, setEdges} = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals(); // Add this hook

	const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Get imageHandleCount from node data (persisted), default to 1 if not set
	const imageHandleCount = data.imageHandleCount ?? 1;

	// Update node internals when handle count changes
	useEffect(() => {
		updateNodeInternals(id);
	}, [id, imageHandleCount, updateNodeInternals]);

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const onModelChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			updateNodeData(id, {model: e.target.value as LLMNodeData["model"]});
		},
		[id, updateNodeData]
	);

	const handleCopy = useCallback(async () => {
		if (data.outputs && data.outputs.length > 0) {
			const textToCopy = data.outputs[data.outputs.length - 1].content;
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}, [data.outputs]);

	const handleAddImageInput = useCallback(() => {
		if (imageHandleCount >= 8) return; // Limit to 8 max
		updateNodeData(id, {imageHandleCount: imageHandleCount + 1});
	}, [id, imageHandleCount, updateNodeData]);

	const handleRemoveImageInput = useCallback(
		(index: number) => {
			if (imageHandleCount <= 1) return;

			// Remove edges connected to handles that will no longer exist
			setEdges((edges) =>
				edges.filter((edge) => {
					// Keep edges that aren't connected to this node's image handles
					if (edge.target !== id) return true;
					if (!edge.targetHandle?.startsWith("image")) return true;

					// Remove edges connected to handles >= the new count
					const handleIndex = parseInt(edge.targetHandle.split("-")[1]);
					return handleIndex < imageHandleCount - 1;
				})
			);

			// Decrement the count
			updateNodeData(id, {imageHandleCount: imageHandleCount - 1});
		},
		[imageHandleCount, id, updateNodeData, setEdges]
	);

	const handleRun = useCallback(async () => {
		// Auth check
		if (!userId) {
			updateNodeData(id, {status: "error", errorMessage: "You must be signed in to run the model."});
			return;
		}

		updateNodeData(id, {status: "loading", errorMessage: undefined});
		console.log("--- RUN STARTED ---");

		try {
			const allNodes = getNodes();
			const allEdges = getEdges();
			const incomingEdges = allEdges.filter((edge) => edge.target === id);

			console.log(`Found ${incomingEdges.length} connections to this node`);

			let systemPromptBase = ""; // From text nodes connected to system-prompt
			let userPromptBase = ""; // From text nodes connected to prompt
			let incomingContext = ""; // From upstream LLM nodes
			const imageUrls: string[] = [];

			// Collect inputs based on handle IDs
			for (const edge of incomingEdges) {
				const sourceNode = allNodes.find((n) => n.id === edge.source);
				if (!sourceNode) continue;

				console.log(`Connected node type: ${sourceNode.type}, target handle: ${edge.targetHandle}`);

				// Handle Text Nodes (direct text input)
				if (sourceNode.type === "textNode") {
					const text = (sourceNode.data as TextNodeData).text;
					if (edge.targetHandle === "system-prompt") {
						systemPromptBase = text || "";
					} else if (edge.targetHandle === "prompt") {
						userPromptBase = text || "";
					}
				}

				// Handle LLM Nodes (chaining) - Accumulate context from upstream outputs
				if (sourceNode.type === "llmNode") {
					const outputs = (sourceNode.data as LLMNodeData).outputs;
					if (outputs && outputs.length > 0) {
						const lastOutput = outputs[outputs.length - 1].content || "";
						const nodeLabel = (sourceNode.data as LLMNodeData).label || "Previous Step";

						if (edge.targetHandle === "system-prompt") {
							// Add to context with label for clarity
							incomingContext += `\n\n--- CONTEXT FROM: ${nodeLabel} ---\n${lastOutput}`;
						} else if (edge.targetHandle === "prompt") {
							// If connected to prompt handle, use as user prompt
							userPromptBase = lastOutput;
						}
					}
				}

				// Handle Image Nodes (connected to any image handle)
				if (sourceNode.type === "imageNode" && edge.targetHandle?.startsWith("image")) {
					const imageData = sourceNode.data as ImageNodeData;

					// Check both file.url (manual upload) and image (demo/preloaded)
					const imageUrl = imageData.file?.url || imageData.image;

					if (imageUrl && typeof imageUrl === "string") {
						console.log("Found image:", imageData.file?.name || "image");

						// Check if it's already base64 or needs conversion
						if (imageUrl.startsWith("data:")) {
							// Already base64
							imageUrls.push(imageUrl);
						} else if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) {
							// Public URL - needs conversion
							console.log("Converting URL to base64:", imageUrl);
							try {
								const base64 = await urlToBase64(imageUrl);
								imageUrls.push(base64);
							} catch (error) {
								console.error("Failed to convert image:", error);
								throw new Error(`Failed to load image: ${imageUrl}`);
							}
						} else {
							imageUrls.push(imageUrl);
						}
					}
				}

				// Handle Crop Image Nodes (connected to any image handle)
				if (sourceNode.type === "cropImageNode" && edge.targetHandle?.startsWith("image")) {
					const cropImageData = sourceNode.data as any;

					// Use cropped image if available, otherwise fall back to original
					const imageUrl = cropImageData.croppedImage || cropImageData.originalImage;

					if (imageUrl && typeof imageUrl === "string") {
						console.log("Found cropped image");

						// Check if it's already base64 or needs conversion
						if (imageUrl.startsWith("data:")) {
							// Already base64
							imageUrls.push(imageUrl);
						} else if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) {
							// Public URL - needs conversion
							console.log("Converting cropped image URL to base64:", imageUrl);
							try {
								const base64 = await urlToBase64(imageUrl);
								imageUrls.push(base64);
							} catch (error) {
								console.error("Failed to convert cropped image:", error);
								throw new Error(`Failed to load cropped image: ${imageUrl}`);
							}
						} else {
							imageUrls.push(imageUrl);
						}
					}
				}
			}

			// Construct final prompts
			// Combine system prompt base with incoming context from upstream nodes
			let finalSystemPrompt = systemPromptBase;
			if (incomingContext) {
				finalSystemPrompt += incomingContext;
			}

			// Use user prompt or default trigger message
			const finalUserPrompt = userPromptBase || "Process this request based on the system instructions and context.";

			console.log("Final Inputs:", {
				systemPrompt: finalSystemPrompt.substring(0, 100) + "...",
				userPrompt: finalUserPrompt.substring(0, 100) + "...",
				imageCount: imageUrls.length,
			});

			// Validation - require at least some input
			if (!finalSystemPrompt.trim() && !finalUserPrompt.trim() && imageUrls.length === 0) {
				throw new Error("Input required: Connect a prompt or image");
			}

			// Call API route with validated data
			console.log("Using model:", data.model);

			const response = await fetch("/api/llm/execute", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: data.model,
					prompt: finalUserPrompt,
					systemPrompt: finalSystemPrompt || undefined,
					imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
					temperature: data.temperature || 0.7,
					userId: userId,
				}),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				// Provide user-friendly error messages based on status code
				let errorMessage = result.error || "Failed to generate content";

				if (response.status === 503) {
					errorMessage = "Model is busy. Retrying automatically...";
				} else if (response.status === 429) {
					errorMessage = "Rate limit reached. Please wait a moment.";
				}

				throw new Error(errorMessage);
			}

			updateNodeData(id, {
				status: "success",
				outputs: [
					{
						id: crypto.randomUUID(),
						type: "text",
						content: result.text || "No response.",
						timestamp: Date.now(),
					},
				],
			});
		} catch (error: unknown) {
			console.error("Run Failed:", error);
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			updateNodeData(id, {status: "error", errorMessage});
		}
	}, [id, updateNodeData, getNodes, getEdges, data.model, data.temperature]);

	return (
		<div
			data-node-id={id}
			className={cn(
				"rounded-xl border bg-[#1a1a1a] w-[320px] max-w-[400px] shadow-2xl transition-all duration-200 flex flex-col",
				selected ? "border-[#dfff4f] ring-1 ring-[#dfff4f]/50" : "border-white/10 hover:border-white/30",
				data.status === "error" && "border-red-500 ring-1 ring-red-500/50"
			)}
			style={{
				minHeight: `${Math.max(360, 200 + Math.min(imageHandleCount, 5) * 35)}px`,
				maxHeight: '580px'
			}}>
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#111] rounded-t-xl">
				<div className="flex items-center gap-2">
					<span className="text-xs font-semibold text-white">{data.model || "gemini-2.5-flash"}</span>
				</div>

				{/* Menu Button with Dropdown */}
				<div className="relative" ref={menuRef}>
					<button
						onClick={(e) => {
							e.stopPropagation();
							setShowMenu(!showMenu);
						}}
						className={cn("p-1 rounded transition-colors", showMenu ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/50")}>
						<MoreHorizontal size={14} />
					</button>

					{/* Dropdown Menu */}
					{showMenu && (
						<div className="absolute right-0 top-6 w-32 bg-[#222] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
							<button
								onClick={(e) => {
									e.stopPropagation();
									deleteNode(id);
								}}
								className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors font-medium">
								<Trash2 size={10} />
								Delete Node
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Body */}
			<div className="p-6 space-y-3">
				{/* Model Selection */}
				<div className="space-y-1.5">
					<label className="text-[10px] text-white/50 uppercase font-semibold flex items-center gap-1.5">
						<Settings2 size={10} /> Model Configuration
					</label>
					<select
						value={data.model}
						onChange={onModelChange}
						className="w-full bg-[#0a0a0a] text-xs text-white rounded-lg border border-white/10 p-2 focus:outline-none focus:border-[#dfff4f]/50 cursor-pointer">
						<option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Fast)</option>
						<option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Powerful)</option>
						<option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
					</select>
				</div>

				{/* Output Display Area */}
				<div className="bg-[#2a2a2a] rounded-lg border border-white/10 flex flex-col">
					{/* Header with Copy Button */}
					{data.status === "success" && data.outputs && data.outputs.length > 0 && (
						<div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
							<span className="text-[10px] text-white/40 uppercase font-semibold">Output</span>
							<button
								onClick={handleCopy}
								className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/60 hover:text-white/90 hover:bg-white/5 rounded transition-colors">
								{copied ? (
									<>
										<Check size={11} />
										Copied!
									</>
								) : (
									<>
										<Copy size={11} />
										Copy
									</>
								)}
							</button>
						</div>
					)}

					{/* Content Area with Fixed Height */}
					<div className="p-3 overflow-y-auto custom-scrollbar" style={{height: "180px", maxHeight: "180px"}}>
						{data.status === "loading" ? (
							<div className="flex items-center justify-center h-full">
								<Loader2 size={20} className="animate-spin text-white/30" />
							</div>
						) : data.status === "success" && data.outputs && data.outputs.length > 0 ? (
							<div className="w-full text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
								{data.outputs[data.outputs.length - 1].content}
							</div>
						) : (
							<div className="flex items-center justify-center h-full">
								<span className="text-xs text-white/30">The generated text will appear here</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Footer: Add image + Run button */}
			<div className="px-6 mb-6 pb-3 flex items-center justify-between gap-2">
				<button
					onClick={handleAddImageInput}
					disabled={imageHandleCount >= 10}
					className={cn(
						"flex items-center gap-1.5 text-[11px] transition-colors font-medium",
						imageHandleCount >= 10 
							? "text-white/20 cursor-not-allowed opacity-50" 
							: "text-white/50 hover:text-white/80"
					)}>
					<Plus size={12} />
					Add another image input {imageHandleCount >= 10 && `(Max 10)`}
				</button>

				<button
					onClick={handleRun}
					disabled={data.status === "loading"}				data-run-button
				data-node-id={id}					className={cn(
						"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all",
						data.status === "loading" ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-white/90 text-black hover:bg-white active:scale-95"
					)}>
					{data.status === "loading" ? (
						<>
							<Loader2 size={12} className="animate-spin" />
						</>
					) : (
						<>
							<Bot size={12} />
							Run Model
						</>
					)}
				</button>
			</div>

			{/* System Prompt Handle */}
			<div className="absolute left-0" style={{top: "80px"}}>
				<Handle
					type="target"
					position={Position.Left}
					id="system-prompt"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("system-prompt")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-emerald-400"
				/>
				{hoveredHandle === "system-prompt" && (
					<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						System Prompt
					</div>
				)}
			</div>

			{/* Prompt Handle */}
			<div className="absolute left-0" style={{top: "115px"}}>
				<Handle
					type="target"
					position={Position.Left}
					id="prompt"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("prompt")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-pink-400"
				/>
				{hoveredHandle === "prompt" && (
					<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-pink-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						Prompt
					</div>
				)}
			</div>

			{/* Dynamic Image Handles */}
			{Array.from({length: imageHandleCount}).map((_, index) => {
				const topPosition = 150 + index * 35; // Start at 150px, increment by 35px for better spacing
				return (
					<div key={`image-${index}`} className="absolute left-0 flex items-center" style={{top: `${topPosition}px`}}>
						<Handle
							type="target"
							position={Position.Left}
							id={`image-${index}`}
							isConnectable={isConnectable}
							onMouseEnter={() => setHoveredHandle(`image-${index}`)}
							onMouseLeave={() => setHoveredHandle(null)}
							className="!w-2.5 !h-2.5 !bg-[#1a1a1a] !border-2 !border-purple-400"
						/>
						{hoveredHandle === `image-${index}` && (
							<div className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/90 text-purple-400 text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none flex items-center gap-2">
								Image {index + 1}
								{imageHandleCount > 1 && (
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveImageInput(index);
										}}
										className="hover:text-red-400 transition-colors">
										<X size={10} />
									</button>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* 🚀 NEW: Output Source Handle (Right Side) */}
			<div className="absolute right-0 top-1/2 -translate-y-1/2">
				<Handle
					type="source"
					position={Position.Right}
					id="response"
					isConnectable={isConnectable}
					onMouseEnter={() => setHoveredHandle("response")}
					onMouseLeave={() => setHoveredHandle(null)}
					className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-[#dfff4f] hover:!bg-[#dfff4f] transition-colors"
				/>
				{hoveredHandle === "response" && (
					<div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/90 text-[#dfff4f] text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
						Response Output
					</div>
				)}
			</div>
		</div>
	);
}

// Helper: Convert image URL to base64
async function urlToBase64(url: string): Promise<string> {
	try {
		const response = await fetch(url);
		const blob = await response.blob();
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error("Failed to convert URL to base64:", error);
		throw error;
	}
}
