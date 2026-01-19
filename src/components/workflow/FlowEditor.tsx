"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  getOutgoers,
  Edge,
  Panel,
  ConnectionLineType,
  Node,
  BackgroundVariant,
} from "@xyflow/react";
import AnimatedEdge from "./edges/AnimatedEdge";
import "@xyflow/react/dist/style.css";

import TextNode from "@/components/workflow/nodes/TextNode";
import ImageNode from "@/components/workflow/nodes/ImageNode";
import CropImageNode from "@/components/workflow/nodes/CropImageNode";
import VideoNode from "@/components/workflow/nodes/VideoNode";
import CropAndExtractFramesNode from "@/components/workflow/nodes/CropAndExtractFramesNode";
import LLMNode from "@/components/workflow/nodes/LLMNode";
import { useWorkflowStore } from "@/store/workflowStore";
import CanvasControls from "./CanvasControls";
import { useStore } from "zustand";
import { AppNode } from "@/lib/types";

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  cropImageNode: CropImageNode,
  videoNode: VideoNode,
  cropAndExtractFramesNode: CropAndExtractFramesNode,
  llmNode: LLMNode,
};

const edgeTypes = {
  animatedEdge: AnimatedEdge,
};

function FlowContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();

  const { undo, redo } = useStore(useWorkflowStore.temporal);

  const [isHandMode, setIsHandMode] = useState(false);

  // FIXED: Type-safe isValidConnection (React Flow v12 compatible)
  const isValidConnection = useCallback(
    ({ source, target, sourceHandle, targetHandle }: Connection | Edge): boolean => {
      // Self-loop
      if (source === target) return false;

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) return false;

      // Safe handles (null/undefined ko null treat karo)
      const sh = sourceHandle ?? null;
      const th = targetHandle ?? null;

      // Image handle
      if (th?.startsWith("image")) {
        return sourceNode.type === "imageNode" || sourceNode.type === "cropImageNode" || sourceNode.type === "cropAndExtractFramesNode";
      }

      // Video handle
      if (th === "video-input" || th?.startsWith("video")) {
        return sourceNode.type === "videoNode";
      }

      // Frames output handle
      if (th === "frames-output") {
        return sourceNode.type === "cropAndExtractFramesNode";
      }

      // Prompt handle
      if (th === "prompt" || th === "system-prompt") {
        return sourceNode.type === "textNode" || sourceNode.type === "llmNode";
      }

      // Generic input
      if (th === "input") {
        return sourceNode.type !== "imageNode" && sourceNode.type !== "cropImageNode";
      }

      // Crop specific
      if (targetNode.type === "cropImageNode" && th === "image-input") {
        return sourceNode.type === "imageNode";
      }

      // Cycle detection
      const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
        if (visited.has(node.id)) return true;
        visited.add(node.id);
        const outgoers = getOutgoers(node, nodes as Node[], edges);
        return outgoers.some((o) => hasCycle(o, visited));
      };

      return !hasCycle(targetNode);
    },
    [nodes, edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNodeId = crypto.randomUUID();
      let newNode: AppNode;

      switch (type) {
        case "textNode":
          newNode = { id: newNodeId, type: "textNode", position, data: { label: "Text Input", text: "", status: "idle" } };
          break;
        case "imageNode":
          newNode = { id: newNodeId, type: "imageNode", position, data: { label: "Image Input", status: "idle", inputType: "upload" } };
          break;
        case "cropImageNode":
          newNode = { id: newNodeId, type: "cropImageNode", position, data: { label: "Crop Image", status: "idle", cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100 } };
          break;
        case "videoNode":
          newNode = { id: newNodeId, type: "videoNode", position, data: { label: "Video Input", status: "idle" } };
          break;
        case "cropAndExtractFramesNode":
          newNode = { id: newNodeId, type: "cropAndExtractFramesNode", position, data: { label: "Crop & Extract Frames", status: "idle", cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100, framesPerSecond: 1 } };
          break;
        default:
          newNode = { id: newNodeId, type: "llmNode", position, data: { label: "Gemini Worker", status: "idle", model: "gemini-1.5-flash", temperature: 0.7, viewMode: "single", outputs: [], imageHandleCount: 1 } };
      }

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        connectionLineStyle={{ stroke: "#fff", strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.Bezier}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        fitView
        panOnDrag={isHandMode}
        selectionOnDrag={!isHandMode}
        panOnScroll={true}
        nodesDraggable={!isHandMode}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />

        <MiniMap
          className="bg-[#1a1a1a] border border-white/10 !bottom-4 !right-4"
          maskColor="rgba(0,0,0, 0.7)"
          nodeColor={() => "#dfff4f"}
        />

        <Panel position="bottom-center" className="mb-8">
          <CanvasControls isHandMode={isHandMode} toggleMode={() => setIsHandMode((prev) => !prev)} />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
}