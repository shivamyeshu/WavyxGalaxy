"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Crop, Loader2, AlertCircle, MoreHorizontal, Trash2, Download, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

type CropImageData = {
  label?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  originalImage?: string;
  croppedImage?: string;
  status?: "idle" | "loading" | "success" | "error";
  errorMessage?: string;
};

export default function CropImageNode({ id, data, isConnectable, selected }: NodeProps & { data: CropImageData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);

  const isManagedByStore = nodes.some((n) => n.id === id);

  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cropX = data.cropX ?? 0;
  const cropY = data.cropY ?? 0;
  const cropWidth = data.cropWidth ?? 100;
  const cropHeight = data.cropHeight ?? 100;

  const originalImage = data.originalImage;
  const croppedImage = data.croppedImage;

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load image helper
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }, []);

  // Perform crop via Trigger.dev (using single-node-executor)
  const performCrop = useCallback(async () => {
    if (!originalImage) return;

    setIsLoading(true);
    updateNodeData(id, { status: "loading" });

    try {
      const workflowId = useWorkflowStore.getState().workflowId;
      if (!workflowId) {
        throw new Error("Please save workflow first");
      }

      console.log("🖼️  [CropImage] Starting crop via Trigger.dev");

      // Trigger via single-node-executor (same as LLM node)
      const response = await fetch(`/api/workflows/nodes/${id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId,
          nodeData: {
            type: "cropImageNode",
            originalImage,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
          },
          edges: useWorkflowStore.getState().edges,
          allNodes: useWorkflowStore.getState().nodes.map(n => ({
            id: n.id,
            type: n.type,
            data: n.data,
            position: n.position,
          })),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to trigger execution");
      }

      const { runId } = result;
      console.log(`✅ [CropImage] Triggered! RunId: ${runId}`);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 30;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusResponse = await fetch(`/api/workflows/nodes/${id}/run?runId=${runId}`);
          const statusResult = await statusResponse.json();

          if (!statusResult.success) throw new Error("Failed to get status");

          const run = statusResult.run;
          if (run.status === "COMPLETED" && run.nodeExecutions.length > 0) {
            clearInterval(pollInterval);
            const execution = run.nodeExecutions[0];

            if (execution.status === "SUCCESS" && execution.outputData?.croppedImageUrl) {
              updateNodeData(id, {
                croppedImage: execution.outputData.croppedImageUrl,
                status: "success",
              });
              setIsLoading(false);
              console.log(`✅ [CropImage] Completed successfully`);
            } else {
              throw new Error(execution.error || "Crop failed");
            }
          } else if (run.status === "FAILED") {
            clearInterval(pollInterval);
            throw new Error("Execution failed");
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            throw new Error("Execution timeout");
          }
        } catch (error) {
          clearInterval(pollInterval);
          throw error;
        }
      }, 1000);
    } catch (error) {
      console.error("Crop error:", error);
      updateNodeData(id, {
        status: "error",
        errorMessage: error instanceof Error ? error.message : "Failed to crop image via Trigger.dev",
      });
      setIsLoading(false);
    }
  }, [originalImage, cropX, cropY, cropWidth, cropHeight, id, updateNodeData]);

  // Detect incoming image from connected node
  useEffect(() => {
    // In the read-only shared workflow viewer, nodes are passed via props and are not
    // registered inside the zustand store. Avoid calling updateNodeData in that case
    // to prevent an infinite update loop.
    if (!isManagedByStore) return;

    const incomingEdge = edges.find((e) => e.target === id && e.targetHandle === "image-input");

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
      if (sourceNode) {
        const sourceData = sourceNode.data as Record<string, unknown>;
        const fileData = sourceData?.file as { url?: string } | undefined;
        const newImage = (fileData?.url || sourceData?.image || sourceData?.croppedImage || sourceData?.output) as string | undefined;

        if (newImage && typeof newImage === "string" && newImage !== originalImage) {
          // console.log("[CropNode] New image detected:", newImage.substring(0, 50) + "...");
          updateNodeData(id, {
            originalImage: newImage,
            croppedImage: undefined,
            status: "idle",
          });
        }
      }
    } else if (originalImage) {
      // Clear the cached image when connection is removed to avoid stale previews
      updateNodeData(id, {
        originalImage: undefined,
        croppedImage: undefined,
        status: "idle",
      });
    }
  }, [edges, nodes, id, updateNodeData, originalImage, isManagedByStore]);

  const handleParameterChange = useCallback(
    (field: "cropX" | "cropY" | "cropWidth" | "cropHeight", value: number) => {
      const clamped = Math.max(0, Math.min(100, value));
      updateNodeData(id, { [field]: clamped });
    },
    [id, updateNodeData]
  );

  const hasImage = !!originalImage;
  const canCrop = hasImage && !isLoading;

  const handleDownload = useCallback(async () => {
    if (!croppedImage) return;

    try {
      const res = await fetch(croppedImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cropped-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[CropImageNode] Download failed:", err);
    }
  }, [croppedImage]);

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1a1a1a] w-[320px] shadow-xl transition-all duration-200",
        selected ? "border-[#dfff4f] ring-1 ring-[#dfff4f]/50" : "border-white/10 hover:border-white/30",
        data.status === "error" && "border-red-500 ring-1 ring-red-500/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#111] rounded-t-xl">
        <div className="flex items-center gap-2">
          <Crop size={14} className="text-white/50" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Crop Image</span>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn("p-1 rounded transition-colors", showMenu ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/50")}
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-6 w-32 bg-[#222] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(id);
                }}
                className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
              >
                <Trash2 size={10} />
                Delete Node
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        <canvas ref={canvasRef} className="hidden" />

        {/* Parameters */}
        <div>
          <h4 className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-3">Crop Percentages</h4>
          <div className="grid grid-cols-2 gap-3">
            {["cropX", "cropY", "cropWidth", "cropHeight"].map((field) => (
              <div key={field}>
                <label className="text-[9px] text-white/50 mb-1 block capitalize">{field.replace("crop", "")} (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={data[field as keyof CropImageData] ?? (field.includes("Width") || field.includes("Height") ? 100 : 0)}
                  onChange={(e) => handleParameterChange(field as "cropX" | "cropY" | "cropWidth" | "cropHeight", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0a0a0a] text-white text-xs rounded-lg border border-white/10 px-2 py-1.5 focus:outline-none focus:border-[#dfff4f]/50"
                  disabled={!hasImage}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action / Status */}
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <Loader2 size={16} className="animate-spin text-white/30 mr-2" />
              <span className="text-xs text-white/50">Cropping...</span>
            </div>
          ) : data.status === "error" ? (
            <div className="flex items-center justify-center w-full py-3 bg-red-500/10 rounded-lg border border-red-500/50">
              <AlertCircle size={16} className="text-red-400 mr-2" />
              <span className="text-xs text-red-400">{data.errorMessage || "Failed to crop"}</span>
            </div>
          ) : !hasImage ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <span className="text-xs text-white/50 uppercase tracking-wide">Waiting for image...</span>
            </div>
          ) : (
            <button
              onClick={performCrop}
              disabled={!canCrop}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-medium text-sm",
                canCrop ? "bg-[#dfff4f] text-black hover:bg-[#cfff3f]" : "bg-[#0a0a0a] text-white/50 cursor-not-allowed border border-white/10"
              )}
            >
              <Crop size={14} />
              Crop Image
            </button>
          )}
        </div>

        {/* Preview - Auto show after crop */}
        {croppedImage && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              <span>Cropped Result</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview((prev) => !prev)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
                  aria-label={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span className="hidden sm:inline">{showPreview ? "Hide" : "Show"}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#dfff4f] text-black hover:bg-[#cfff3f] transition-colors"
                  aria-label="Download cropped image"
                >
                  <Download size={12} />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </div>
            </div>

            {showPreview ? (
              <div className="relative group rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden max-h-[300px]">
                <img
                  src={croppedImage}
                  alt="Cropped result"
                  className="w-full h-full max-h-[300px] object-contain rounded-lg"
                  onError={() => {
                    console.error("[CropImageNode] Image load error:", croppedImage);
                  }}
                  onLoad={() => {
                    // console.log("[CropImageNode] Cropped image loaded successfully");
                  }}
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-[10px] text-white/80 rounded">
                  {cropWidth}% × {cropHeight}% at ({cropX}%, {cropY}%)
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full py-6 text-xs text-white/50 border border-white/10 rounded-lg bg-[#0a0a0a]">
                Preview hidden
              </div>
            )}
          </div>
        )}
      </div>

      {/* Handles */}
      <div className="absolute -left-1.5 top-1/4 -translate-y-1/2 z-50">
        <Handle
          type="target"
          position={Position.Left}
          id="image-input"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-green-400 hover:!bg-green-400 transition-colors"
        />
      </div>

      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-50">
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-[#dfff4f] hover:!bg-[#dfff4f] transition-colors"
        />
      </div>
    </div>
  );
}