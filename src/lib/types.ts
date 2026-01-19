import { Node, Edge } from "@xyflow/react";

// =========================================
// 1. LANDING PAGE TYPES (Marketing)
// =========================================

export interface HeroNodeData extends Record<string, unknown> {
   type?: string;
  label?: string;
  image?: string;
  video?: string;
  text?: string;
  width?: string;
  height?: string;
  gradientClass?: string;
}

// The specific Node type for the Hero section
export type HeroNode = Node<HeroNodeData>;


// =========================================
// 2. EDITOR APP TYPES (The Actual Tool)
// =========================================

// Common properties shared by ALL nodes in the editor
export interface BaseNodeData extends Record<string, unknown> {
    label?: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    errorMessage?: string;

    // UI State
    isLocked?: boolean;      // Prevent dragging/editing
    isRenaming?: boolean;    // Toggle input field for header
}

// -- Text Input Node --
export interface TextNodeData extends BaseNodeData {
    text: string;
    isExpandable?: boolean;
}

// -- Image Upload Node --
export interface ImageNodeData extends BaseNodeData {
    file?: {
        name: string;
        type: string;
        url: string;           // Blob URL or S3 link
    };
    inputType: 'upload' | 'url';
}

// -- Crop Image Node --
export interface CropImageNodeData extends BaseNodeData {
    originalImage?: string;    // Original image URL/base64
    croppedImage?: string;     // Cropped image URL/base64
    cropX?: number;            // X position percentage (0-100)
    cropY?: number;            // Y position percentage (0-100)
    cropWidth?: number;        // Width percentage (1-100)
    cropHeight?: number;        // Height percentage (1-100)
}

// -- Video Upload Node --
export interface VideoNodeData extends BaseNodeData {
    videoUrl?: string;         // CDN URL
    videoId?: string;          // Database ID
    file?: {
        name: string;
        type: string;
        size: number;
        duration?: number;     // Video duration in seconds
    };
}

// -- Crop and Extract Frames Node --
export interface CropAndExtractFramesNodeData extends BaseNodeData {
    videoUrl?: string;         // Input video URL
    cropX?: number;            // X position percentage (0-100)
    cropY?: number;            // Y position percentage (0-100)
    cropWidth?: number;        // Width percentage (1-100)
    cropHeight?: number;       // Height percentage (1-100)
    framesPerSecond?: number;  // Frames to extract per second (0.1-10)
    extractedFrames?: string[]; // Array of extracted frame image URLs
}

// -- LLM / Generation Node --
export interface LLMNodeData extends BaseNodeData {
    // Configuration
    model: 'gemini-2.5-flash';
    temperature: number;
    systemInstruction?: string;
    maxTokens?: number;

    // Dynamic Input Handles
    imageHandleCount: number; // Track number of image input handles

    // History / Results
    outputs: Array<{
        id: string;
        type: 'text' | 'image';
        content: string;       // The text response or Image URL
        timestamp: number;
        meta?: {
            creditsCost?: number;
            seed?: number;
        };
    }>;

    // View State
    activeOutputId?: string; // Currently displayed generation
    viewMode: 'single' | 'list';
}


// 1. Define the Full Node Types (This fixes the NodeProps error)
export type TextNodeType = Node<TextNodeData, 'textNode'>;
export type ImageNodeType = Node<ImageNodeData, 'imageNode'>;
export type CropImageNodeType = Node<CropImageNodeData, 'cropImageNode'>;
export type VideoNodeType = Node<VideoNodeData, 'videoNode'>;
export type CropAndExtractFramesNodeType = Node<CropAndExtractFramesNodeData, 'cropAndExtractFramesNode'>;
export type LLMNodeType = Node<LLMNodeData, 'llmNode'>;
// Union type for the Editor
export type AppNodeData = TextNodeData | ImageNodeData | CropImageNodeData | VideoNodeData | CropAndExtractFramesNodeData | LLMNodeData;
export type AppNode = Node<AppNodeData>;





export type SaveWorkflowParams = {
    id?: string | null;
    name: string;
    nodes: AppNode[];
    edges: Edge[];
};

// TypeScript interface for Workflow
export interface Workflow {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface CanvasControlsProps {
    isHandMode: boolean;
    toggleMode: (isHand: boolean) => void;
}

export interface LoadWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface SidebarProps {
	children: React.ReactNode;
	defaultCollapsed?: boolean;
}
