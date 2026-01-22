"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Frame, Loader2, AlertCircle, MoreHorizontal, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";
import toast from "react-hot-toast";

type ExtractFrameData = {
  label?: string;
  videoUrl?: string;
  frameNumber?: number; // Frame number user wants to extract (0-indexed or 1-indexed)
  extractedFrame?: string; // Single frame image URL
  status?: "idle" | "loading" | "success" | "error";
  errorMessage?: string;
};

export default function ExtractFrameNode({ id, data, isConnectable, selected }: NodeProps & { data: ExtractFrameData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const frameNumber = data.frameNumber ?? 0;
  const videoUrl = data.videoUrl;
  const extractedFrame = data.extractedFrame;

  // Debug: Log extracted frame URL
  useEffect(() => {
    if (extractedFrame) {
      console.log("[ExtractFrameNode] Extracted frame URL:", extractedFrame);
    }
  }, [extractedFrame]);

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

  // Detect incoming video from connected node
  useEffect(() => {
    const incomingEdge = edges.find((e) => e.target === id);

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
      if (sourceNode) {
        const sourceData = sourceNode.data as Record<string, unknown>;
        // Check multiple possible video URL fields from different node types
        const newVideoUrl = (sourceData?.videoUrl || sourceData?.cdnUrl || sourceData?.output || sourceData?.video) as string | undefined;

        if (newVideoUrl && typeof newVideoUrl === "string" && newVideoUrl !== videoUrl) {
          console.log("[ExtractFrameNode] New video detected from node:", incomingEdge.source);
          console.log("[ExtractFrameNode] Video URL:", newVideoUrl.substring(0, 50) + "...");
          updateNodeData(id, {
            videoUrl: newVideoUrl,
            extractedFrame: undefined, // Reset previous frame
            status: "idle",
          });
          toast.success("Video connected to Extract Frame node!");
        }
      }
    } else {
      // Only clear if there's no connection AND we had a video URL
      if (videoUrl) {
        console.log("[ExtractFrameNode] Video connection removed");
        updateNodeData(id, {
          videoUrl: undefined,
          extractedFrame: undefined,
          status: "idle",
        });
      }
    }
  }, [edges, nodes, id, updateNodeData, videoUrl]);

  // Extract single frame via API
  const extractFrame = useCallback(async () => {
    if (!videoUrl || frameNumber < 0) {
      toast.error("Video URL or frame number is invalid");
      return;
    }

    console.log("[ExtractFrame] Starting extraction with params:", { videoUrl, frameNumber });
    updateNodeData(id, { status: "loading" });
    const loadingToast = toast.loading("Extracting frame...");

    try {
      console.log("🎬 [ExtractFrame] Sending request with frameNumber:", frameNumber);
      
      const response = await fetch('/api/video/extract-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          frameNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ [ExtractFrame] API error:", error);
        throw new Error(error.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ [ExtractFrame] Frame extraction result:", result);

      if (!result.frameUrl) {
        throw new Error('No frame URL returned from server');
      }

      // Validate that we got a real frame, not just a thumbnail
      // Check if URL contains frame extraction parameters
      if (!result.frameUrl.includes('f_jpg') && !result.frameUrl.includes('so_')) {
        console.warn("⚠️ [ExtractFrame] Warning: URL might be a thumbnail, not extracted frame:", result.frameUrl);
      }

      console.log("[ExtractFrame] Frame URL params:", {
        method: result.method,
        timestamp: result.timestamp,
        frameNumber: result.frameNumber,
        duration: result.duration,
        estimatedFPS: result.estimatedFPS,
        hasFormat: result.frameUrl.includes('f_jpg'),
        hasOffset: result.frameUrl.includes('so_'),
        urlPreview: result.frameUrl.substring(0, 100),
      });

      updateNodeData(id, {
        extractedFrame: result.frameUrl,
        status: "success",
      });
      
      toast.dismiss(loadingToast);
      toast.success(`Frame #${frameNumber} extracted successfully!`);
    } catch (error: unknown) {
      console.error("❌ [ExtractFrame] Extraction error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to extract frame";
      updateNodeData(id, {
        status: "error",
        errorMessage,
      });
      
      toast.dismiss(loadingToast);
      toast.error(errorMessage);
    }
  }, [videoUrl, frameNumber, id, updateNodeData]);

  const handleFrameNumberChange = useCallback(
    (value: number) => {
      const clamped = Math.max(0, value);
      updateNodeData(id, { frameNumber: clamped, extractedFrame: undefined, status: "idle" });
    },
    [id, updateNodeData]
  );

  const hasVideo = !!videoUrl;
  const canExtract = hasVideo && frameNumber >= 0 && !data.status?.includes("loading");

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
          <Frame size={14} className="text-white/50" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Extract Frame</span>
        </div>

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
        {/* Video Status Indicator */}
        {hasVideo && (
          <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Video size={12} className="text-green-400" />
              <span className="text-[10px] text-green-400 font-medium">Video Connected</span>
            </div>
            <div className="text-[9px] text-green-400/60 mt-1 truncate">
              {videoUrl.substring(0, 40)}...
            </div>
          </div>
        )}

        {/* Frame Number Input */}
        <div>
          <label className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-2 block">
            Time (Seconds)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={frameNumber}
            onChange={(e) => handleFrameNumberChange(parseFloat(e.target.value) || 0)}
            className="w-full bg-[#0a0a0a] text-white text-sm rounded-lg border border-white/10 px-3 py-2 focus:outline-none focus:border-[#dfff4f]/50"
            placeholder="Enter time in seconds (e.g., 0, 1, 2...)"
          />
          <p className="text-[9px] text-white/40 mt-1">1 = 1 second, 2 = 2 seconds, etc.</p>
        </div>

        {/* Action / Status */}
        <div className="mt-4">
          {data.status === "loading" ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <Loader2 size={16} className="animate-spin text-white/30 mr-2" />
              <span className="text-xs text-white/50">Extracting frame...</span>
            </div>
          ) : data.status === "error" ? (
            <div className="flex items-center justify-center w-full py-3 bg-red-500/10 rounded-lg border border-red-500/50">
              <AlertCircle size={16} className="text-red-400 mr-2" />
              <span className="text-xs text-red-400">{data.errorMessage || "Failed to extract frame"}</span>
            </div>
          ) : !hasVideo ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <Video size={16} className="text-white/30 mr-2" />
              <span className="text-xs text-white/50 uppercase tracking-wide">Waiting for video...</span>
            </div>
          ) : (
            <button
              onClick={extractFrame}
              disabled={!canExtract}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-medium text-sm",
                canExtract ? "bg-[#dfff4f] text-black hover:bg-[#cfff3f]" : "bg-[#0a0a0a] text-white/50 cursor-not-allowed border border-white/10"
              )}
            >
              <Frame size={14} />
              Extract Frame
            </button>
          )}
        </div>

        {/* Extracted Frame Preview */}
        {extractedFrame && (
          <div className="space-y-2 mt-4">
            <div className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
              Result
            </div>
            <div className="relative rounded-lg border border-white/10 bg-[#0a0a0a] overflow-hidden min-h-[200px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={extractedFrame}
                alt={`Extracted frame ${frameNumber}`}
                className="w-full h-auto max-h-[400px] object-contain rounded-lg"
                onError={() => {
                  console.error("[ExtractFrameNode] Image load error:", extractedFrame);
                  updateNodeData(id, {
                    status: "error",
                    errorMessage: "Failed to load extracted frame image",
                  });
                }}
                onLoad={() => {
                  console.log("[ExtractFrameNode] Image loaded successfully:", extractedFrame);
                }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-[10px] text-white/80 rounded">
                Frame #{frameNumber}
              </div>
            </div>
          </div>
        )}
        
        {/* Show success status even if no preview yet */}
        {data.status === "success" && !extractedFrame && (
          <div className="space-y-2 mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-[10px] text-green-400">
              Frame extracted successfully, but preview is loading...
            </div>
          </div>
        )}
      </div>

      {/* Handles */}
      <div className="absolute -left-1.5 top-1/4 -translate-y-1/2 z-50">
        <Handle
          type="target"
          position={Position.Left}
          id="video-input"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-blue-400 hover:!bg-blue-400 transition-colors"
        />
      </div>

      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-50">
        <Handle
          type="source"
          position={Position.Right}
          id="image-output"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-[#dfff4f] hover:!bg-[#dfff4f] transition-colors"
        />
      </div>
    </div>
  );
}

