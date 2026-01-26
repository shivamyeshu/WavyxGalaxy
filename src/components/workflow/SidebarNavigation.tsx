"use client";

import React from "react";
import Link from "next/link";
import {Folder, Plus, Users, AppWindow, MessageCircle, Loader2, Settings} from "lucide-react";
import {cn} from "@/lib/utils";
import UserMenu from "./UserMenu";

interface SidebarNavigationProps {
	isCollapsed?: boolean;
	onCreateNew?: () => void;
	creating?: boolean;
}

const SidebarNavigation = ({isCollapsed, onCreateNew, creating = false}: SidebarNavigationProps) => {
	return (
		<>
			{/* User / Workspace */}
			<div className="p-4 border-b border-white/10">
				<UserMenu isCollapsed={isCollapsed} />
			</div>

			{/* Create New Button */}
			{!isCollapsed && (
				<div className="px-4 pt-4">
					<button
						onClick={onCreateNew}
						disabled={creating}
						className="w-full flex items-center justify-center gap-2 bg-yellow-100 text-black px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
						{creating ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Creating...
							</>
						) : (
							<>
								<Plus size={16} />
								Create New File
							</>
						)}
					</button>
				</div>
			)}

			{/* Navigation */}
			<nav className="flex-1 flex flex-col gap-1 p-4">
				{!isCollapsed ? (
					<>
						<Link href="/workflows" className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-white font-medium text-sm">
							<div className="flex items-center gap-3">
								<Folder size={16} />
								My Files
							</div>
							<Plus size={14} className="text-white/50 hover:text-white" />
						</Link>
						<Link
							href="/apps"
							className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white text-sm transition-colors">
							<AppWindow size={16} />
							Apps
						</Link>
						<button
							disabled
							className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/20 cursor-not-allowed text-sm">
							<Users size={16} />
							Shared with me
						</button>
						<Link
							href="/settings"
							className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white text-sm transition-colors mt-2 border-t border-white/10 pt-4">
							<Settings size={16} />
							API Settings
						</Link>
					</>
				) : (
					<>
						<Link href="/workflows" className="flex justify-center p-2 rounded-lg bg-white/5 text-white">
							<Folder size={18} />
						</Link>
						<Link href="/apps" className="flex justify-center p-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
							<AppWindow size={18} />
						</Link>
						<button
							disabled
							className="flex justify-center p-2 rounded-lg text-white/20 cursor-not-allowed">
							<Users size={18} />
						</button>
						<Link
							href="/settings"
							className="flex justify-center p-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors border-t border-white/10 mt-2 pt-2">
							<Settings size={18} />
						</Link>
					</>
				)}
			</nav>

			{/* LinkedIn Link */}
			<div className="p-4 border-t border-white/10">
				{!isCollapsed ? (
					<Link
						href="https://www.linkedin.com/in/shivam-yeshu"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white text-sm transition-colors">
						<MessageCircle size={16} />
						LinkedIn
					</Link>
				) : (
					<Link
						href="https://www.linkedin.com/in/shivam-yeshu"
						target="_blank"
						rel="noopener noreferrer"
						className="flex justify-center p-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors">
						<MessageCircle size={18} />
					</Link>
				)}
			</div>
		</>
	);
};

export default SidebarNavigation;
