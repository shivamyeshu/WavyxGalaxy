"use client";

import React, { useCallback, useRef, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { VideoIcon, Upload, X, Loader2, AlertCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/workflowStore";

type VideoNodeData = {
  label?: string;
  videoUrl?: string; // CDN URL
  videoId?: string; // Database ID
  file?: { name: string; type: string; size: number; duration?: number };
  status?: "idle" | "loading" | "success" | "error";
  errorMessage?: string;
};

export default function VideoNode({ id, data, isConnectable, selected }: NodeProps & { data: VideoNodeData }) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);
  const deleteNode = useWorkflowStore((state) => state.deleteNode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // File upload handler
  const onFileChange = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      const file = evt.target.files?.[0];
      if (!file) return;

      // Strict validation: Only allow video files, reject images and audio
      const allowedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-ms-wmv',
        'video/mpeg',
        'video/x-matroska',
        'video/3gpp',
      ];
      
      const allowedExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.mpeg', '.mpg', '.mkv', '.3gp'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!file.type.startsWith('video/') || !allowedVideoTypes.includes(file.type)) {
        updateNodeData(id, {
          status: "error",
          errorMessage: "Only video files are allowed (MP4, WebM, MOV, AVI, etc.)",
        });
        return;
      }
      
      if (!allowedExtensions.includes(fileExtension)) {
        updateNodeData(id, {
          status: "error",
          errorMessage: `File type not supported. Allowed: ${allowedExtensions.join(', ')}`,
        });
        return;
      }

      try {
        updateNodeData(id, { status: "loading" });

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/video/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        console.log("[VideoNode] Uploaded video to CDN:", result.video.cdnUrl);

        updateNodeData(id, {
          videoUrl: result.video.cdnUrl,
          videoId: result.video.id,
          file: {
            name: result.video.originalName,
            type: file.type,
            size: result.video.size,
            duration: result.video.duration,
          },
          status: "success",
        });
      } catch (err: unknown) {
        console.error("Video upload error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to upload video";
        updateNodeData(id, {
          status: "error",
          errorMessage,
        });
      }
    },
    [id, updateNodeData]
  );

  // Clear video
  const clearVideo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      updateNodeData(id, {
        videoUrl: undefined,
        videoId: undefined,
        file: undefined,
        status: "idle",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [id, updateNodeData]
  );

  const videoUrl = data.videoUrl;

  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1a1a1a] w-[300px] shadow-xl transition-all duration-200",
        selected ? "border-[#dfff4f] ring-1 ring-[#dfff4f]/50" : "border-white/10 hover:border-white/30",
        data.status === "error" && "border-red-500 ring-1 ring-red-500/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#111] rounded-t-xl">
        <div className="flex items-center gap-2">
          <VideoIcon size={14} className="text-white/50" />
          <span className="text-xs font-semibold text-white/70">{data.label || "Video Input"}</span>
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
                className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors font-medium"
              >
                <Trash2 size={10} />
                Delete Node
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/mpeg"
          onChange={onFileChange}
          className="hidden"
          id={`video-upload-${id}`}
        />

        {videoUrl ? (
          <div className="relative group">
            <video
              src={videoUrl}
              controls
              className="w-full h-40 object-cover rounded-lg border border-white/10 bg-black"
            />

            <button
              onClick={clearVideo}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-500/80 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>

            <div className="mt-2 space-y-1">
              <div className="text-[10px] text-white/40 truncate">
                {data.file?.name || "uploaded-video.mp4"}
              </div>
              {data.file?.duration && (
                <div className="text-[9px] text-white/30">
                  Duration: {Math.round(data.file.duration)}s
                </div>
              )}
            </div>
          </div>
        ) : (
          <label
            htmlFor={`video-upload-${id}`}
            className={cn(
              "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all",
              data.status === "loading" ? "border-white/20 bg-white/5" : "border-white/10 hover:border-white/30 hover:bg-white/5"
            )}
          >
            {data.status === "loading" ? (
              <>
                <Loader2 size={24} className="animate-spin text-white/30 mb-2" />
                <span className="text-xs text-white/50">Uploading to CDN...</span>
              </>
            ) : data.status === "error" ? (
              <>
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <span className="text-xs text-red-400">{data.errorMessage}</span>
              </>
            ) : (
              <>
                <Upload size={24} className="text-white/30 mb-2" />
                <span className="text-xs text-white/50">Click to upload video</span>
              </>
            )}
          </label>
        )}
      </div>

      {/* Output Handle */}
      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-50">
        <Handle
          type="source"
          position={Position.Right}
          id="video-output"
          isConnectable={isConnectable}
          className="!w-3 !h-3 !bg-[#1a1a1a] !border-2 !border-blue-400 hover:!bg-blue-400 transition-colors"
        />
      </div>
    </div>
  );
}

