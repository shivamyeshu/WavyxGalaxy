"use client";

import React, {useState} from "react";
import {Search, Type, ImageIcon, Bot, Crop, Video, Film, Frame} from "lucide-react";
import {cn} from "@/lib/utils";
import {useUser} from "@clerk/nextjs";

interface SidebarNodeListProps {
	isCollapsed?: boolean;
}

const SidebarNodeList = ({isCollapsed}: SidebarNodeListProps) => {
	const {user, isLoaded} = useUser();
	const [searchQuery, setSearchQuery] = useState("");

	const onDragStart = (event: React.DragEvent, nodeType: string) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};

	const displayName = user?.fullName || user?.firstName || "User";
	const fallbackInitial = displayName?.[0]?.toUpperCase() || "U";
	const avatarUrl = user?.imageUrl;

	// Define all nodes
	const allNodes = [
		{
			type: "textNode",
			name: "Text",
			description: "Input plain text",
			icon: Type,
			bgColor: "bg-blue-500/10",
			textColor: "text-blue-400",
			hoverColor: "group-hover:text-blue-300"
		},
		{
			type: "imageNode",
			name: "Image",
			description: "Upload images",
			icon: ImageIcon,
			bgColor: "bg-purple-500/10",
			textColor: "text-purple-400",
			hoverColor: "group-hover:text-purple-300"
		},
		{
			type: "cropImageNode",
			name: "Crop Image",
			description: "Crop Image",
			icon: Crop,
			bgColor: "bg-orange-500/10",
			textColor: "text-orange-400",
			hoverColor: "group-hover:text-orange-300"
		},
		{
			type: "videoNode",
			name: "Video",
			description: "Video Input",
			icon: Video,
			bgColor: "bg-blue-500/10",
			textColor: "text-blue-400",
			hoverColor: "group-hover:text-blue-300"
		},
		{
			type: "extractFrameNode",
			name: "Extract Frame",
			description: "Extract specific frame by number",
			icon: Frame,
			bgColor: "bg-yellow-500/10",
			textColor: "text-yellow-400",
			hoverColor: "group-hover:text-yellow-300"
		},
		{
			type: "llmNode",
			name: "Run Any LLM",
			description: "Gemini Processing",
			icon: Bot,
			bgColor: "bg-[#FEF3C7]/10",
			textColor: "text-[#FEF3C7]",
			hoverColor: "group-hover:text-white"
		}
	];

	// Filter nodes based on search query
	const filteredNodes = allNodes.filter(node => 
		node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		node.description.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<>
			{/* Header / Search */}
			<div className="p-4 border-b border-white/10">
				{!isCollapsed ? (
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
						<input
							type="text"
							placeholder="Search nodes..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full bg-[#1a1a1a] text-xs text-white rounded-md pl-9 pr-3 py-2 border border-white/5 focus:outline-none focus:border-white/20 placeholder:text-white/20"
						/>
					</div>
				) : (
					<div className="flex justify-center py-2">
						<Search className="text-white/40" size={18} />
					</div>
				)}
			</div>

			{/* Node List (Quick Access) */}
			<div className="flex-1 overflow-y-auto p-4">
				{!isCollapsed && <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">
					{searchQuery ? `Results (${filteredNodes.length})` : "Quick Access"}
				</h3>}

				{filteredNodes.length === 0 ? (
					!isCollapsed && (
						<div className="text-center py-8 text-white/30 text-xs">
							No nodes found matching "{searchQuery}"
						</div>
					)
				) : (
					<div className="space-y-3">
						{filteredNodes.map((node) => {
							const IconComponent = node.icon;
							return (
								<div
									key={node.type}
									className={cn(
										"bg-[#1a1a1a] border border-white/5 hover:border-[#FEF3C7]/50 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-colors group",
										isCollapsed ? "flex justify-center p-2" : "flex items-center gap-3"
									)}
									draggable
									onDragStart={(e) => onDragStart(e, node.type)}>
									<div className={cn("w-8 h-8 rounded flex items-center justify-center", node.bgColor, node.textColor, node.hoverColor)}>
										<IconComponent size={18} />
									</div>
									{!isCollapsed && (
										<div>
											<p className="text-sm font-medium text-white group-hover:text-[#FEF3C7]">{node.name}</p>
											<p className="text-[10px] text-white/40">{node.description}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Bottom Profile/Mock User */}
			<div className="p-4 border-t border-white/10">
				<div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
					{avatarUrl ? (
						<img
							src={avatarUrl}
							alt={displayName}
							className="w-8 h-8 rounded-full object-cover border border-white/10 bg-[#1a1a1a] shrink-0"
						/>
					) : (
						<div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 shrink-0 flex items-center justify-center text-xs font-bold text-white">
							{fallbackInitial}
						</div>
					)}
					{!isCollapsed && (
						<div className="overflow-hidden">
							<p className="text-xs font-bold text-white truncate">{displayName}</p>
							<p className="text-[10px] text-white/40 truncate">{user?.primaryEmailAddress?.emailAddress || ""}</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

export default SidebarNodeList;
