"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Home, Eye, EyeOff, Loader2, Check, AlertCircle, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ApiKeyResponse {
    success: boolean;
    hasApiKey?: boolean;
    maskedKey?: string;
    message?: string;
    error?: string;
}

export default function SettingsPage() {
    const { user } = useUser();
    const router = useRouter();
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [maskedKey, setMaskedKey] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [hasExistingKey, setHasExistingKey] = useState(false);

    // Fetch existing API key info on mount
    useEffect(() => {
        const fetchApiKeyInfo = async () => {
            try {
                const response = await fetch("/api/user/api-key");
                const data: ApiKeyResponse = await response.json();

                if (data.success && data.hasApiKey && data.maskedKey) {
                    setMaskedKey(data.maskedKey);
                    setHasExistingKey(true);
                }
            } catch (error) {
                console.error("Error fetching API key info:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApiKeyInfo();
    }, []);

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            setStatus("error");
            setMessage("Please enter a valid API key");
            return;
        }

        setSaving(true);
        setStatus("idle");

        try {
            const response = await fetch("/api/user/api-key", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ geminiApiKey: apiKey.trim() }),
            });

            const data: ApiKeyResponse = await response.json();

            if (data.success) {
                setStatus("success");
                setMessage("API key saved successfully!");
                setMaskedKey(data.maskedKey || "");
                setHasExistingKey(true);
                setApiKey("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to save API key");
            }
        } catch (error) {
            console.error("Error saving API key:", error);
            setStatus("error");
            setMessage("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteApiKey = async () => {
        if (!confirm("Are you sure you want to delete your API key? You'll use the default key instead.")) {
            return;
        }

        setSaving(true);
        setStatus("idle");

        try {
            const response = await fetch("/api/user/api-key", {
                method: "DELETE",
            });

            const data: ApiKeyResponse = await response.json();

            if (data.success) {
                setStatus("success");
                setMessage("API key deleted successfully!");
                setMaskedKey("");
                setHasExistingKey(false);
                setApiKey("");
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to delete API key");
            }
        } catch (error) {
            console.error("Error deleting API key:", error);
            setStatus("error");
            setMessage("An error occurred while deleting");
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-100 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="h-14 border-b border-white/5 flex items-center justify-between px-8">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/workflows"
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
                        <Home size={16} />
                        <span>Home</span>
                    </Link>
                    <div className="h-4 w-px bg-white/20" />
                    <h1 className="text-sm font-semibold text-white/80">Settings</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-12">
                    {/* Account Section */}
                    <div className="mb-12">
                        <h2 className="text-lg font-semibold text-white mb-6">Account</h2>
                        <div className="bg-white/5 border border-white/10 rounded-lg p-8">
                            {/* Avatar and User Info */}
                            <div className="flex items-start gap-6 pb-6">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {user.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt={user.firstName || "User"}
                                            className="w-20 h-20 rounded-lg object-cover border border-white/10 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-lg bg-gradient-to-tr from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-2xl border border-white/10 shadow-lg">
                                            {user.firstName?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {user.firstName} {user.lastName}
                                    </h3>
                                    <p className="text-sm text-white/60 mb-3">{user.primaryEmailAddress?.emailAddress}</p>
                                    <p className="text-xs text-white/50">
                                        {user.createdAt ? `Created ${new Date(user.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })} at ${new Date(user.createdAt).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            hour12: true 
                                        })}` : "Account creation date unavailable"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* API Settings Section */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-white mb-2">Gemini API Key</h2>
                            <p className="text-sm text-white/50">Use your personal API key for LLM operations. This gives you access to your own quota.</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="animate-spin w-6 h-6 border-2 border-yellow-100 border-t-transparent rounded-full" />
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                                {/* Current Status */}
                                {hasExistingKey && maskedKey && (
                                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                                        <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-yellow-100 uppercase tracking-wide mb-1">Configured</p>
                                            <p className="text-sm text-yellow-200/80">Using personal key: {maskedKey}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Status Messages */}
                                {status === "success" && (
                                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-green-200">{message}</p>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-200">{message}</p>
                                    </div>
                                )}

                                {/* Input Section */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-white/70 uppercase tracking-wide mb-3">
                                            API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showApiKey ? "text" : "password"}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder={
                                                    hasExistingKey
                                                        ? "Paste new key to update..."
                                                        : "Paste your Gemini API key..."
                                                }
                                                className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 pr-10 text-sm text-white placeholder-white/30 focus:border-yellow-100 focus:outline-none transition-colors"
                                                disabled={saving}
                                            />
                                            <button
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors disabled:opacity-50"
                                                disabled={saving}>
                                                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-white/40 mt-2">
                                            Get your key from{" "}
                                            <a
                                                href="https://aistudio.google.com/apikey"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-100 hover:text-yellow-200 underline">
                                                Google AI Studio
                                            </a>
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleSaveApiKey}
                                            disabled={saving || !apiKey.trim()}
                                            className={cn(
                                                "flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm",
                                                saving || !apiKey.trim()
                                                    ? "bg-yellow-100/20 text-white/50 cursor-not-allowed border border-yellow-100/20"
                                                    : "bg-yellow-100 text-black hover:bg-yellow-200 border border-yellow-100 active:scale-95"
                                            )}>
                                            {saving ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save API Key"
                                            )}
                                        </button>

                                        {hasExistingKey && (
                                            <button
                                                onClick={handleDeleteApiKey}
                                                disabled={saving}
                                                className={cn(
                                                    "py-2.5 px-4 rounded-lg font-medium transition-all text-sm",
                                                    saving
                                                        ? "bg-red-500/20 text-white/50 cursor-not-allowed border border-red-500/20"
                                                        : "bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 active:scale-95"
                                                )}>
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        <span className="font-semibold text-white">💡 Pro Tip:</span> Using your personal API key ensures you have dedicated quota for your workflows while keeping our shared quota available for other users.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
