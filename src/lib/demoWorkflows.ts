import { AppNode } from "./types";
import { Edge } from "@xyflow/react";

export const DEMO_WORKFLOWS = [
    {
        id: "Tesla",
        name: "Tesla",
        description: "Multi-modal marketing campaign generator with vision AI analysis and content creation",       
        thumbnail: "/demo/Thumb1.png",
        getGraph: (): { nodes: AppNode[], edges: Edge[] } => {
            const nodes: AppNode[] = [
                // Video & Images
                {
                    id: 'video-1',
                    type: 'videoNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Tesla Showcase Video',
                        status: 'success',
                        videoUrl: 'https://res.cloudinary.com/dvcbfg6tv/video/upload/v1769043410/weavy-videos/user_38QNgtmMpOnuxens4nUJRld2GCj/1769043409833-tesla-mp4.mp4',
                    }
                },
                // Images
                {
                    id: 'img-thumbnail',
                    type: 'imageNode',
                    position: { x: 0, y: 250 },
                    data: {
                        label: 'Hero Thumbnail',
                        status: 'idle',
                        inputType: 'upload',
                        image: '/demo/Thumb1.png'
                    }
                },
                {
                    id: 'img-front',
                    type: 'imageNode',
                    position: { x: 0, y: 500 },
                    data: {
                        label: 'Front View',
                        status: 'idle',
                        inputType: 'upload',
                        image: '/demo/Tesla.png'
                    }
                },
                {
                    id: 'img-back',
                    type: 'imageNode',
                    position: { x: 0, y: 750 },
                    data: {
                        label: 'Back View',
                        status: 'idle',
                        inputType: 'upload',
                        image: '/demo/Tesla-back.png'
                    }
                },
                {
                    id: 'img-left',
                    type: 'imageNode',
                    position: { x: 0, y: 1000 },
                    data: {
                        label: 'Left Side View',
                        status: 'idle',
                        inputType: 'upload',
                        image: '/demo/tesla-left.png'
                    }
                },

                // Crop nodes
                {
                    id: 'crop-detail',
                    type: 'cropImageNode',
                    position: { x: 300, y: 500 },
                    data: {
                        label: 'Crop Front Detail',
                        status: 'idle',
                        cropX: 25,
                        cropY: 25,
                        cropWidth: 50,
                        cropHeight: 50,
                    }
                },
                {
                    id: 'crop-logo',
                    type: 'cropImageNode',
                    position: { x: 300, y: 750 },
                    data: {
                        label: 'Crop Back Badge',
                        status: 'idle',
                        cropX: 40,
                        cropY: 40,
                        cropWidth: 20,
                        cropHeight: 20,
                    }
                },

                // Text Prompts
                {
                    id: 'prompt-vision-analyzer',
                    type: 'textNode',
                    position: { x: 600, y: 300 },
                    data: {
                        label: 'Vision Analysis Prompt',
                        status: 'idle',
                        text: `You are a Senior Automotive Design Analyst and Marketing Expert.

Analyze these Tesla vehicle images (thumbnail, front, back, left side, extracted video frame, cropped details):

TASK:
1. **Design Analysis**: Identify key design elements (body style, color, wheels, lighting, aerodynamics)
2. **Unique Features**: Call out distinctive features visible in the images
3. **Visual Branding**: Note Tesla branding elements and premium touches
4. **Technical Specs (Visual)**: Estimate size category, wheel size, and design language
5. **Target Audience**: Identify the likely buyer demographic based on visual cues
6. **Mood & Emotion**: Describe the emotional impact of the design

Output: Structured technical analysis in bullet points. Be specific and detailed.`
                    }
                },
                {
                    id: 'prompt-product-description',
                    type: 'textNode',
                    position: { x: 1100, y: 0 },
                    data: {
                        label: 'Product Description Prompt',
                        status: 'idle',
                        text: `Write a compelling product description for Tesla's website based on the analysis provided.

REQUIREMENTS:
- Opening hook (1 sentence - powerful and aspirational)
- 3-4 key features with benefits (not just specs)
- Emotional appeal (lifestyle, innovation, sustainability)
- Call-to-action (schedule test drive)
- Tone: Premium, innovative, confident
- Length: 150-200 words

Focus on transformation: "This isn't just a car, it's a statement."`
                    }
                },
                {
                    id: 'prompt-instagram',
                    type: 'textNode',
                    position: { x: 1100, y: 300 },
                    data: {
                        label: 'Instagram Caption Prompt',
                        status: 'idle',
                        text: `Create a viral Instagram caption based on the Tesla analysis.

REQUIREMENTS:
- Hook line (create curiosity or bold statement)
- 2-3 key selling points (wrapped in storytelling)
- Emojis (use strategically, not excessively)
- Call-to-action (tag a friend, visit showroom, etc.)
- Hashtags: 5-7 trending + brand hashtags
- Tone: Aspirational, modern, tech-forward
- Length: 100-130 words

Think: What would make someone screenshot this and share it?`
                    }
                },
                {
                    id: 'prompt-twitter',
                    type: 'textNode',
                    position: { x: 1100, y: 600 },
                    data: {
                        label: 'Twitter/X Thread Prompt',
                        status: 'idle',
                        text: `Write a Twitter/X thread (3-4 tweets) based on the Tesla analysis.

STRUCTURE:
Tweet 1: Hook tweet (viral opener, surprising fact)
Tweet 2: Key feature breakdown (visual + tech)
Tweet 3: Why it matters (innovation angle)
Tweet 4: CTA (link to configure/reserve)

RULES:
- Each tweet under 280 characters
- Use line breaks for readability
- Include relevant emojis
- Hashtags only in last tweet
- Tone: Punchy, quotable, tech-savvy

Make it shareable. Make it memorable.`
                    }
                },
                {
                    id: 'prompt-seo',
                    type: 'textNode',
                    position: { x: 1100, y: 900 },
                    data: {
                        label: 'SEO Meta Description Prompt',
                        status: 'idle',
                        text: `Write an SEO-optimized meta description for Tesla product page.

REQUIREMENTS:
- Length: 155-160 characters (strict)
- Include primary keyword: "Tesla [Model]"
- Include benefit-driven language
- Include call-to-action
- Make it click-worthy (but accurate)
- Avoid keyword stuffing

Example structure: "[Model] - [Key Benefit]. [Unique Feature]. [CTA]."

Think: What would make someone click from Google search results?`
                    }
                },
                {
                    id: 'prompt-email',
                    type: 'textNode',
                    position: { x: 1100, y: 1200 },
                    data: {
                        label: 'Email Campaign Prompt',
                        status: 'idle',
                        text: `Write an email campaign announcement based on the Tesla analysis.

STRUCTURE:
- Subject Line (45-50 characters, create urgency/curiosity)
- Preview Text (85-100 characters)
- Email Body:
  * Opening (personalized, hooks reader)
  * 3 key highlights (each with subheading + 2 sentences)
  * Visual callout ("See it in action" section)
  * CTA button copy (action-oriented)
  * Footer message (urgency/scarcity)

TONE: Personal, exciting, exclusive
LENGTH: 250-300 words

Make the reader feel like they're getting insider access.`
                    }
                },

                // LLM Nodes
                {
                    id: 'llm-vision-analyzer',
                    type: 'llmNode',
                    position: { x: 850, y: 500 },
                    data: {
                        label: 'Multi-Vision AI Analyzer',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        imageHandleCount: 7, // video frame + thumbnail + front + back + left + 2 cropped
                        outputs: [],
                        temperature: 0.3, // Lower for analytical accuracy
                        viewMode: 'single',
                        systemPrompt: ""
                    }
                },
                {
                    id: 'llm-product-description',
                    type: 'llmNode',
                    position: { x: 1350, y: 0 },
                    data: {
                        label: 'Product Description Writer',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.7,
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },
                {
                    id: 'llm-instagram',
                    type: 'llmNode',
                    position: { x: 1350, y: 300 },
                    data: {
                        label: 'Instagram Content Creator',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.8, // Higher for creative social content
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },
                {
                    id: 'llm-twitter',
                    type: 'llmNode',
                    position: { x: 1350, y: 600 },
                    data: {
                        label: 'Twitter Thread Generator',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.8,
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },
                {
                    id: 'llm-seo',
                    type: 'llmNode',
                    position: { x: 1350, y: 900 },
                    data: {
                        label: 'SEO Optimizer',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.4, // Lower for precision
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },
                {
                    id: 'llm-email',
                    type: 'llmNode',
                    position: { x: 1350, y: 1200 },
                    data: {
                        label: 'Email Copywriter',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.7,
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },

                // Summary Node
                {
                    id: 'prompt-master-summary',
                    type: 'textNode',
                    position: { x: 1600, y: 600 },
                    data: {
                        label: 'Campaign Summary Prompt',
                        status: 'idle',
                        text: `Create an executive summary of this complete marketing campaign.

INPUT: You'll receive 5 pieces of content (product description, Instagram caption, Twitter thread, SEO meta, email campaign)

OUTPUT FORMAT:
---
## Campaign Overview
[2 sentences: What this campaign achieves]

## Content Assets Created
1. **Website Copy**: [1 line summary]
2. **Instagram**: [1 line summary]
3. **Twitter/X**: [1 line summary]
4. **SEO**: [1 line summary]
5. **Email**: [1 line summary]

## Key Messaging Themes
- [Theme 1]
- [Theme 2]
- [Theme 3]

## Recommended Launch Strategy
[3-4 sentences on sequencing and timing]
---

Tone: Professional, strategic, executive-level`
                    }
                },
                {
                    id: 'llm-master-summary',
                    type: 'llmNode',
                    position: { x: 1850, y: 600 },
                    data: {
                        label: 'Campaign Strategist',
                        status: 'idle',
                        model: 'gemini-2.5-flash',
                        outputs: [],
                        temperature: 0.5,
                        viewMode: 'single',
                        imageHandleCount: 0,
                        systemPrompt: ""
                    }
                },
            ];

            const edges: Edge[] = [
                // VIDEO → FRAME EXTRACTION → IMAGE NODES
                { 
                    id: 'e-video-extract', 
                    source: 'video-1', 
                    target: 'extract-frame-1', 
                    type: 'animatedEdge', 
                    animated: true 
                },

                // FRAME → IMAGE NODES
                { 
                    id: 'e-front-crop', 
                    source: 'img-front', 
                    target: 'crop-detail', 
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-back-crop', 
                    source: 'img-back', 
                    target: 'crop-logo', 
                    type: 'animatedEdge', 
                    animated: true 
                },

                // Images to Vision Analyzer
                { 
                    id: 'e-thumbnail', 
                    source: 'img-thumbnail', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-0',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-front', 
                    source: 'img-front', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-1',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-back', 
                    source: 'img-back', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-2',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-left', 
                    source: 'img-left', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-3',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-crop-detail', 
                    source: 'crop-detail', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-4',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-crop-logo', 
                    source: 'crop-logo', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'image-5',
                    type: 'animatedEdge', 
                    animated: true 
                },

                // System prompts
                { 
                    id: 'p-vision', 
                    source: 'prompt-vision-analyzer', 
                    target: 'llm-vision-analyzer', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },

                // Vision to downstream LLMs
                { 
                    id: 'e-analysis-product', 
                    source: 'llm-vision-analyzer', 
                    sourceHandle: 'response',
                    target: 'llm-product-description', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-analysis-instagram', 
                    source: 'llm-vision-analyzer', 
                    sourceHandle: 'response',
                    target: 'llm-instagram', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-analysis-twitter', 
                    source: 'llm-vision-analyzer', 
                    sourceHandle: 'response',
                    target: 'llm-twitter', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-analysis-seo', 
                    source: 'llm-vision-analyzer', 
                    sourceHandle: 'response',
                    target: 'llm-seo', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-analysis-email', 
                    source: 'llm-vision-analyzer', 
                    sourceHandle: 'response',
                    target: 'llm-email', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },

                // Content LLM prompts
                { 
                    id: 'p-product', 
                    source: 'prompt-product-description', 
                    target: 'llm-product-description', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },
                { 
                    id: 'p-instagram', 
                    source: 'prompt-instagram', 
                    target: 'llm-instagram', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },
                { 
                    id: 'p-twitter', 
                    source: 'prompt-twitter', 
                    target: 'llm-twitter', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },
                { 
                    id: 'p-seo', 
                    source: 'prompt-seo', 
                    target: 'llm-seo', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },
                { 
                    id: 'p-email', 
                    source: 'prompt-email', 
                    target: 'llm-email', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },

                // Content to summary
                { 
                    id: 'e-product-summary', 
                    source: 'llm-product-description', 
                    sourceHandle: 'response',
                    target: 'llm-master-summary', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-instagram-summary', 
                    source: 'llm-instagram', 
                    sourceHandle: 'response',
                    target: 'llm-master-summary', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-twitter-summary', 
                    source: 'llm-twitter', 
                    sourceHandle: 'response',
                    target: 'llm-master-summary', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-seo-summary', 
                    source: 'llm-seo', 
                    sourceHandle: 'response',
                    target: 'llm-master-summary', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },
                { 
                    id: 'e-email-summary', 
                    source: 'llm-email', 
                    sourceHandle: 'response',
                    target: 'llm-master-summary', 
                    targetHandle: 'prompt',
                    type: 'animatedEdge', 
                    animated: true 
                },

                // Master summary prompt
                { 
                    id: 'p-master', 
                    source: 'prompt-master-summary', 
                    target: 'llm-master-summary', 
                    targetHandle: 'system-prompt',
                    type: 'default' 
                },
            ];

            return { nodes, edges };
        }
    }
];