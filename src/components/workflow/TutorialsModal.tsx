"use client";

import React, { useState } from "react";
import { X, BookOpen, Clock } from "lucide-react";

interface Tutorial {
  id: number;
  title: string;
  shortTitle?: string;
  description: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  steps: string[];
}

const TUTORIALS: Tutorial[] = [
  {
    id: 1,
    title: "Getting Started with Workflows",
    description: "Learn the basics of creating and managing workflows from scratch.",
    duration: "5 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "Click 'Create New File' to start a new workflow",
      "Drag and drop nodes from the sidebar onto the canvas",
      "Connect nodes by dragging from output to input ports",
      "Configure each node by clicking on it",
      "Export your workflow using Share and Export options"
    ]
  },
  {
    id: 2,
    title: "Working with Text Nodes",
    description: "Master text processing and input nodes for your workflows.",
    duration: "3 min read",
    difficulty: "Beginner",
    category: "Nodes",
    steps: [
      "Add a Text node from the sidebar",
      "Enter or paste text content in the node",
      "Connect the output to other nodes for processing",
      "Use the text node as input for LLM or other processors",
      "Clear or modify text easily with inline editing"
    ]
  },
  {
    id: 3,
    title: "Image Processing with LLM",
    description: "Process images and extract information using AI-powered LLM nodes.",
    duration: "8 min read",
    difficulty: "Intermediate",
    category: "AI",
    steps: [
      "Add an Image node and upload your image file",
      "Connect it to an LLM node for analysis",
      "Write a prompt for image analysis in the LLM node",
      "Execute the workflow to process the image",
      "View results in the execution history panel"
    ]
  },
  {
    id: 4,
    title: "Video Processing and Frame Extraction",
    description: "Extract frames from videos and analyze them with AI.",
    duration: "10 min read",
    difficulty: "Intermediate",
    category: "Media",
    steps: [
      "Upload a video file using the Video node",
      "Use Extract Frames node to capture specific frames",
      "Set frame intervals and count parameters",
      "Connect frames to Image or LLM nodes for analysis",
      "Process multiple frames in batch operations"
    ]
  },
  {
    id: 5,
    title: "Advanced Workflow Design",
    description: "Create complex workflows with multiple processing steps.",
    duration: "12 min read",
    difficulty: "Advanced",
    category: "Advanced",
    steps: [
      "Start with a data input node (text, image, or document)",
      "Add the first LLM node for initial processing",
      "Chain output to a second LLM node for refinement",
      "Use different prompts for each processing stage",
      "Monitor results at each step in the history panel",
      "Optimize workflow performance with edge pruning"
    ]
  },
  {
    id: 6,
    title: "Workflow Execution and History",
    shortTitle: "Run & History",
    description: "Execute workflows and review execution history.",
    duration: "6 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "Complete your workflow design",
      "Click the execute button to run the workflow",
      "Monitor real-time execution with visual feedback",
      "Check the History panel for results and logs",
      "Review node-by-node execution details"
    ]
  },
  {
    id: 7,
    title: "How to Export Workflows",
    description: "Learn how to export and share your completed workflows.",
    duration: "3 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "Complete your workflow design",
      "Click the Share button in the toolbar header",
      "Click on Export option in the share menu",
      "Choose your export format and settings",
      "Download or copy your workflow file"
    ]
  },
  {
    id: 8,
    title: "What is Workflow History",
    shortTitle: "Workflow History",
    description: "Understand workflow history and how to use it for debugging.",
    duration: "6 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "Execute a workflow to generate history entries",
      "Open the History panel on the right sidebar",
      "View all past executions with timestamps",
      "Click on any execution to see detailed results",
      "Review input and output data for each node in the execution",
      "Use history to debug and troubleshoot workflow issues"
    ]
  },
  {
    id: 9,
    title: "How to Setup and Delete Your API Key",
    shortTitle: "API Keys: Add & Remove",
    description: "Manage your API keys for LLM and other services.",
    duration: "6 min read",
    difficulty: "Beginner",
    category: "Settings",
    steps: [
      "Click the Key icon in the workflow header toolbar",
      "Enter your API key in the API Key Modal",
      "Verify your API key is valid by testing a simple LLM node",
      "Your API key is saved in your user profile",
      "To delete your API key, open the API Key Modal again",
      "Clear the API key field and confirm the deletion"
    ]
  },
  {
    id: 10,
    title: "How to Rename a Workflow",
    description: "Change your workflow name easily.",
    duration: "2 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "Open your workflow in the editor",
      "Click on the workflow name in the header",
      "The name field becomes editable",
      "Type your new workflow name",
      "Press Enter or click elsewhere to save",
      "Your workflow will auto-save with the new name"
    ]
  },
  {
    id: 11,
    title: "How to Run Workflows",
    description: "Execute workflows and run individual nodes.",
    duration: "5 min read",
    difficulty: "Beginner",
    category: "Fundamentals",
    steps: [
      "To run entire workflow: Click the Play button in the header",
      "Workflow executes from start to end automatically",
      "To run individual node: Right-click on any node",
      "Select 'Run Node' from the context menu",
      "Only that node executes with its current inputs",
      "Check the History panel to view results"
    ]
  },
  {
    id: 12,
    title: "How to Copy Text from LLM",
    description: "Copy LLM output text easily.",
    duration: "2 min read",
    difficulty: "Beginner",
    category: "Nodes",
    steps: [
      "Execute your LLM node to get output",
      "Click on the LLM node to view results",
      "Find the output text in the node display",
      "Click the Copy button next to the output text",
      "Or select the text and use Ctrl+C",
      "Paste the text anywhere using Ctrl+V"
    ]
  },
  {
    id: 13,
    title: "How to Publish Workflows",
    description: "Share your workflows publicly with shareable links.",
    duration: "7 min read",
    difficulty: "Beginner",
    category: "Sharing",
    steps: [
      "Complete and save your workflow",
      "Click the PUBLISH button (megaphone icon) in the header",
      "Sign in if you haven't already",
      "First time: Success modal appears with shareable link",
      "Already published: Choose 'Update Existing' or 'Publish as New'",
      "Link is automatically copied to clipboard",
      "Share the link via email, social media, or messaging",
      "Anyone can view your workflow without login"
    ]
  },
  {
    id: 14,
    title: "Managing Published Workflows",
    description: "View, copy, and delete your published workflows.",
    duration: "5 min read",
    difficulty: "Beginner",
    category: "Sharing",
    steps: [
      "Click 'My publishes' in the left sidebar",
      "See all your published workflows with timestamps",
      "Click Copy button to get the shareable link",
      "Click Delete button (trash icon) to remove a publish",
      "Deleted links stop working immediately",
      "Manage multiple versions of your workflows"
    ]
  },
  {
    id: 15,
    title: "How to Use Shared Workflows",
    description: "Access and duplicate workflows shared by others.",
    duration: "5 min read",
    difficulty: "Beginner",
    category: "Sharing",
    steps: [
      "Click on a shared workflow link (no login required)",
      "Explore nodes and connections in read-only mode",
      "Use zoom controls (bottom-left) and minimap (bottom-right)",
      "Click 'Use this workflow' button to create your copy",
      "Sign in if prompted",
      "A duplicate is created in your workspace",
      "Edit and customize the workflow as your own"
    ]
  }
];

interface TutorialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialsModal({ isOpen, onClose }: TutorialsModalProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
    TUTORIALS[0] || null
  );

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#111] border-b border-white/10 px-8 py-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Tutorials</h2>
            <p className="text-xs text-white/50 mt-0.5">Learn how to build and manage your workflows</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left - Tutorials List */}
          <div className="w-64 border-r border-white/10 bg-[#0f0f0f] flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-1">
                {TUTORIALS.map((tutorial) => (
                  <button
                    key={tutorial.id}
                    onClick={() => setSelectedTutorial(tutorial)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedTutorial?.id === tutorial.id
                        ? "bg-[#dfff4f]/15 border border-[#dfff4f]/30"
                        : "border border-white/5 hover:border-white/10 hover:bg-white/5"
                    }`}
                    title={tutorial.title}
                  >
                    <h4 className="text-sm font-medium text-white truncate">
                      {tutorial.shortTitle ?? tutorial.title}
                    </h4>
                    <p className="text-xs text-white/40 mt-1">{tutorial.duration}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Footer */}
            <div className="p-4 border-t border-white/10 bg-[#111] flex-shrink-0">
              <p className="text-xs text-white/50 font-semibold mb-2">Professional</p>
              <a 
                href="https://linkedin.com/in/shivam-yeshu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-[#dfff4f] hover:text-[#dfff4f]/80 transition-colors">
                Connect & Learn More
              </a>
            </div>
          </div>

          {/* Right - Tutorial Details */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1a1a]">
            {selectedTutorial ? (
              <div className="p-8">
                {/* Title and Metadata */}
                <div className="mb-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-semibold text-white">{selectedTutorial.title}</h1>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 border border-white/10">
                        {selectedTutorial.difficulty}
                      </span>
                      <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 border border-white/10">
                        {selectedTutorial.category}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4">{selectedTutorial.description}</p>
                  
                  <p className="text-xs text-white/50">Duration: {selectedTutorial.duration}</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-8" />

                {/* Steps */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Steps</h3>
                  <div className="space-y-3">
                    {selectedTutorial.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-lg bg-[#dfff4f]/20 border border-[#dfff4f]/40 flex items-center justify-center">
                            <span className="text-[#dfff4f] font-semibold text-xs">{index + 1}</span>
                          </div>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Close Button */}
                <div className="mt-8">
                  <button
                    onClick={onClose}
                    className="w-full px-4 py-2.5 border border-white/10 text-white/70 hover:text-white hover:border-white/20 rounded-lg text-sm font-medium transition-all">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-white/40 text-sm">Select a tutorial</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
