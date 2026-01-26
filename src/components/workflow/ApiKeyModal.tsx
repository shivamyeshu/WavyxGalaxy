"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, Loader2, Check, AlertCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApiKeyResponse {
  success: boolean;
  hasApiKey?: boolean;
  maskedKey?: string;
  message?: string;
  error?: string;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maskedKey, setMaskedKey] = useState("");
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch existing API key info when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
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
    }
  }, [isOpen]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    setSaving(true);

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
        toast.success("API key saved successfully!");
        setMaskedKey(data.maskedKey || "");
        setHasExistingKey(true);
        setApiKey("");
        setTimeout(() => onClose(), 1500);
      } else {
        toast.error(data.error || "Failed to save API key");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm("Are you sure you want to delete your API key?")) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/user/api-key", {
        method: "DELETE",
      });

      const data: ApiKeyResponse = await response.json();

      if (data.success) {
        toast.success("API key deleted successfully!");
        setMaskedKey("");
        setHasExistingKey(false);
        setApiKey("");
      } else {
        toast.error(data.error || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">API Key Settings</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-yellow-100" />
          </div>
        ) : (
          <>
            {/* Current Key Status */}
            {hasExistingKey && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 flex items-start gap-3">
                <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-400">API Key Active</p>
                  <p className="text-xs text-green-300/80 break-all">{maskedKey}</p>
                </div>
              </div>
            )}

            {/* API Key Input */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-white/80 block mb-2">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-... (leave empty to use default)"
                  className="w-full bg-[#222] border border-white/10 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-yellow-100 placeholder-white/40 pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Your API key is stored securely and never shared.
              </p>
              
              {/* Google AI Studio Link */}
              <a
                href="https://aistudio.google.com/app/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2"
              >
                <ExternalLink size={12} />
                Get API Key from Google AI Studio
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveApiKey}
                disabled={saving || !apiKey.trim()}
                className="flex-1 bg-yellow-100 text-black text-xs font-bold py-2 rounded-lg hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                SAVE
              </button>

              {hasExistingKey && (
                <button
                  onClick={handleDeleteApiKey}
                  disabled={saving}
                  className="flex-1 bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 border border-red-500/30"
                >
                  DELETE
                </button>
              )}

              <button
                onClick={onClose}
                className="flex-1 bg-[#222] border border-white/10 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/10 transition-all"
              >
                CLOSE
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
