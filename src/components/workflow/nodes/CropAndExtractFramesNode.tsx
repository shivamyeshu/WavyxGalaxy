"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Crop, Loader2, AlertCircle, MoreHorizontal, Trash2, Video, Image as ImageIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

type CropAndExtractFramesData = {
  label?: string;
  videoUrl?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  framesPerSecond?: number; // Frames to extract per second
  extractedFrames?: string[]; // Array of frame image URLs
  status?: "idle" | "loading" | "success" | "error";
  errorMessage?: string;
};

export default function CropAndExtractFramesNode({ id, data, isConnectable, selected }: NodeProps & { data: CropAndExtractFramesData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);

  const [showMenu, setShowMenu] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const cropX = data.cropX ?? 0;
  const cropY = data.cropY ?? 0;
  const cropWidth = data.cropWidth ?? 100;
  const cropHeight = data.cropHeight ?? 100;
  const framesPerSecond = data.framesPerSecond ?? 1;

  const videoUrl = data.videoUrl;
  const extractedFrames = data.extractedFrames || [];

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
    const incomingEdge = edges.find((e) => e.target === id && e.targetHandle === "video-input");

    if (incomingEdge) {
      const sourceNode = nodes.find((n) => n.id === incomingEdge.source);
      if (sourceNode) {
        const sourceData = sourceNode.data as Record<string, unknown>;
        // Check multiple possible properties where video URL might be stored
        const newVideoUrl = (sourceData?.videoUrl || sourceData?.cdnUrl || sourceData?.output) as string | undefined;

        if (newVideoUrl && typeof newVideoUrl === "string" && newVideoUrl !== videoUrl) {
          console.log("[CropAndExtractFramesNode] New video detected:", newVideoUrl.substring(0, 50) + "...");
          updateNodeData(id, {
            videoUrl: newVideoUrl,
            extractedFrames: undefined, // Reset previous frames
            status: "idle",
          });
        } else if (!newVideoUrl && videoUrl) {
          // If connection exists but no video URL yet, keep waiting (don't clear)
          console.log("[CropAndExtractFramesNode] Video connection exists but no URL found yet");
        }
      }
    } else {
      // Only clear if there's no connection AND we had a video URL
      if (videoUrl) {
        console.log("[CropAndExtractFramesNode] Video connection removed");
        updateNodeData(id, {
          videoUrl: undefined,
          extractedFrames: undefined,
          status: "idle",
        });
      }
    }
  }, [edges, nodes, id, updateNodeData, videoUrl]); // Watch edges and nodes from store for automatic updates

  // Extract frames via API (which will use trigger.dev)
  const extractFrames = useCallback(async () => {
    if (!videoUrl) return;

    updateNodeData(id, { status: "loading" });

    try {
      const response = await fetch('/api/video/extract-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          cropX,
          cropY,
          cropWidth,
          cropHeight,
          framesPerSecond,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Frame extraction failed');
      }

      const result = await response.json();

      updateNodeData(id, {
        extractedFrames: result.frames,
        status: "success",
      });
    } catch (error: any) {
      console.error("Frame extraction error:", error);
      updateNodeData(id, {
        status: "error",
        errorMessage: error.message || "Failed to extract frames",
      });
    }
  }, [videoUrl, cropX, cropY, cropWidth, cropHeight, framesPerSecond, id, updateNodeData]);

  const handleParameterChange = useCallback(
    (field: "cropX" | "cropY" | "cropWidth" | "cropHeight" | "framesPerSecond", value: number) => {
      const clamped = field === "framesPerSecond" 
        ? Math.max(0.1, Math.min(10, value))
        : Math.max(0, Math.min(100, value));
      updateNodeData(id, { [field]: clamped });
    },
    [id, updateNodeData]
  );

  const hasVideo = !!videoUrl;
  const canExtract = hasVideo && !data.status?.includes("loading");

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1a1a1a] min-w-[320px] shadow-xl transition-all duration-200",
        selected ? "border-[#dfff4f] ring-1 ring-[#dfff4f]/50" : "border-white/10 hover:border-white/30",
        data.status === "error" && "border-red-500 ring-1 ring-red-500/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#111] rounded-t-xl">
        <div className="flex items-center gap-2">
          <Crop size={14} className="text-white/50" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">Crop & Extract Frames</span>
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
                  value={data[field as keyof CropAndExtractFramesData] as number ?? (field.includes("Width") || field.includes("Height") ? 100 : 0)}
                  onChange={(e) => handleParameterChange(field as "cropX" | "cropY" | "cropWidth" | "cropHeight" | "framesPerSecond", parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0a0a0a] text-white text-xs rounded-lg border border-white/10 px-2 py-1.5 focus:outline-none focus:border-[#dfff4f]/50"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Frames Per Second */}
        <div>
          <label className="text-[9px] text-white/50 mb-1 block">Frames Per Second</label>
          <input
            type="number"
            min="0.1"
            max="10"
            step="0.1"
            value={framesPerSecond}
            onChange={(e) => handleParameterChange("framesPerSecond", parseFloat(e.target.value) || 1)}
            className="w-full bg-[#0a0a0a] text-white text-xs rounded-lg border border-white/10 px-2 py-1.5 focus:outline-none focus:border-[#dfff4f]/50"
          />
        </div>

        {/* Action / Status */}
        <div className="mt-4">
          {data.status === "loading" ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <Loader2 size={16} className="animate-spin text-white/30 mr-2" />
              <span className="text-xs text-white/50">Extracting frames via Trigger.dev...</span>
            </div>
          ) : data.status === "error" ? (
            <div className="flex items-center justify-center w-full py-3 bg-red-500/10 rounded-lg border border-red-500/50">
              <AlertCircle size={16} className="text-red-400 mr-2" />
              <span className="text-xs text-red-400">{data.errorMessage || "Failed to extract frames"}</span>
            </div>
          ) : !hasVideo ? (
            <div className="flex items-center justify-center w-full py-3 bg-[#0a0a0a] rounded-lg border border-white/10">
              <Video size={16} className="text-white/30 mr-2" />
              <span className="text-xs text-white/50 uppercase tracking-wide">Waiting for video...</span>
            </div>
          ) : (
            <button
              onClick={extractFrames}
              disabled={!canExtract}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all font-medium text-sm",
                canExtract ? "bg-[#dfff4f] text-black hover:bg-[#cfff3f]" : "bg-[#0a0a0a] text-white/50 cursor-not-allowed border border-white/10"
              )}
            >
              <Play size={14} />
              Extract Frames
            </button>
          )}
        </div>

        {/* Extracted Frames Preview */}
        {extractedFrames.length > 0 && (
          <div className="space-y-2 mt-4">
            <button
              onClick={() => setShowFrames(!showFrames)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#0a0a0a] hover:bg-[#111] border border-white/10 hover:border-[#dfff4f]/50 rounded-lg transition-all"
            >
              <ImageIcon size={14} className="text-white/70" />
              <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                {showFrames ? "Hide" : "View"} Extracted Frames ({extractedFrames.length})
              </span>
            </button>

            {showFrames && (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {extractedFrames.map((frameUrl, index) => (
                  <div key={index} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={frameUrl}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-white/10 bg-[#0a0a0a]"
                    />
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[8px] text-white/80 rounded">
                      #{index + 1}
                    </div>
                  </div>
                ))}
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
          id="video-input"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-blue-400 hover:!bg-blue-400 transition-colors"
        />
      </div>

      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-50">
        <Handle
          type="source"
          position={Position.Right}
          id="frames-output"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-[#dfff4f] hover:!bg-[#dfff4f] transition-colors"
        />
      </div>
    </div>
  );
}

