"use client";

import { Check, Copy, ExternalLink, Sparkles, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    workflowName: string;
}

export default function PublishSuccessModal({ isOpen, onClose, shareUrl, workflowName }: Props) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl mx-4 bg-[#1a1a1a] border-2 border-yellow-100/30 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-100/10 to-yellow-100/5 border-b border-yellow-100/20 px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-yellow-100/15 border border-yellow-100/40 flex items-center justify-center flex-shrink-0">
                                <Sparkles size={24} className="text-yellow-100" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Workflow Published! 🎉</h2>
                                <p className="text-sm text-white/60">Your workflow "{workflowName}" is now live</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/40 hover:text-white transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Share Link */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-white/80 block">Your shareable link:</label>
                        <div className="flex gap-2">
                            <div className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-white/20 rounded-lg text-sm text-white/90 font-mono break-all">
                                {shareUrl}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-3 rounded-lg bg-yellow-100 hover:bg-white text-black font-semibold transition-all flex items-center gap-2 hover:scale-105 active:scale-95">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <ExternalLink size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2 text-sm">
                                <p className="font-semibold text-blue-300">Share this link with anyone</p>
                                <ul className="text-white/70 space-y-1 text-xs">
                                    <li>• Link is publicly accessible - no login required</li>
                                    <li>• Viewers can see your workflow in read-only mode</li>
                                    <li>• They can duplicate it to create their own editable copy</li>
                                    <li>• Manage your published workflows from "My publishes" section</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#111] border-t border-white/10 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all">
                        Close
                    </button>
                    <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-lg bg-yellow-100 hover:bg-white text-black font-semibold transition-all flex items-center gap-2">
                        <ExternalLink size={16} />
                        Open Link
                    </a>
                </div>
            </div>
        </div>
    );
}
