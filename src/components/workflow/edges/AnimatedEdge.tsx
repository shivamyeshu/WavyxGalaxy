"use client";

import React from "react";
import { BaseEdge, EdgeProps, getBezierPath, EdgeLabelRenderer, useReactFlow } from "@xyflow/react";
import { X } from "lucide-react";

export default function AnimatedEdge({id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, selected}: EdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});
	
	const { setEdges } = useReactFlow();

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		setEdges((edges) => edges.filter((edge) => edge.id !== id));
	};

	return (
		<>
			{/* 1. Define the Gradient specific to this edge ID */}
			<defs>
				<linearGradient id={`gradient-${id}`} gradientUnits="userSpaceOnUse" x1={sourceX} y1={sourceY} x2={targetX} y2={targetY}>
					<stop offset="0%" stopColor="#ec4899" /> {/* Pink-500 (Source) */}
					<stop offset="100%" stopColor="#dfff4f" /> {/* Lime/Green (Target) - Matches your theme */}
				</linearGradient>
			</defs>

			{/* 2. Invisible thick path for easier clicking/hovering */}
			<path 
				d={edgePath} 
				strokeWidth={20} 
				stroke="transparent" 
				fill="none" 
				className="react-flow__edge-interaction" 
			/>

			{/* 3. The Visible Gradient Path */}
			<path
				id={id}
				style={{
					...style,
					stroke: `url(#gradient-${id})`,
					strokeWidth: selected ? 4 : 3,
					strokeDasharray: 10,
					animation: "dashdraw 0.5s linear infinite",
				}}
				className="react-flow__edge-path"
				d={edgePath}
				markerEnd={markerEnd}
			/>

			{/* 4. Delete button - only show when selected */}
			{selected && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							pointerEvents: 'all',
						}}
						className="nodrag nopan"
						onMouseDown={(e) => e.stopPropagation()}
					>
						<button
							onClick={handleDelete}
							className="p-1.5 bg-black/70 hover:bg-red-500/80 text-white rounded-full transition-colors shadow-lg"
							title="Delete edge"
						>
							<X size={14} />
						</button>
					</div>
				</EdgeLabelRenderer>
			)}

			{/* 4. Define the animation for the dashes */}
			<style>
				{`
          @keyframes dashdraw {
            from { stroke-dashoffset: 20; }
            to { stroke-dashoffset: 0; }
          }
        `}
			</style>
		</>
	);
}
