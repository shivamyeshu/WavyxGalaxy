import { task } from "@trigger.dev/sdk/v3";
import { aiGenerator, cropImageTask, extractVideoFrames } from "./workflow-nodes";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface NodeData {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
}

interface EdgeData {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

interface WorkflowGraph {
    nodes: NodeData[];
    edges: EdgeData[];
}

export const orchestrator = task({
    id: "workflow-orchestrator",
    run: async (payload: { runId: string }) => {
        console.log("🚀 [ORCHESTRATOR] Task started with payload:", payload);
        
        const run = await prisma.workflowRun.findUnique({
            where: { id: payload.runId },
            include: { workflow: true },
        });
        console.log("📊 [ORCHESTRATOR] Found run:", { id: run?.id, workflowId: run?.workflow?.id });

        if (!run) throw new Error(`Run ${payload.runId} not found`);

        console.log("🔄 [ORCHESTRATOR] Updating run status to RUNNING...");
        // Update run status to RUNNING
        await prisma.workflowRun.update({
            where: { id: run.id },
            data: { status: "RUNNING" },
        });
        console.log("✅ [ORCHESTRATOR] Run status updated to RUNNING");

        const graph = run.workflow.data as WorkflowGraph;
        const nodes = graph.nodes;
        const edges = graph.edges;

        console.log(`📝 [ORCHESTRATOR] Starting execution for workflow: ${run.workflow.name}`);
        console.log(`📊 [ORCHESTRATOR] Total nodes: ${nodes.length}, Edges: ${edges.length}`);
        console.log(`🔗 [ORCHESTRATOR] Node types:`, nodes.map(n => ({ id: n.id, type: n.type })));

        try {
            console.log("🏗️ [ORCHESTRATOR] Building dependency graph...");
            // Build dependency graph
            const dependencyMap = buildDependencyGraph(nodes, edges);
            console.log("✅ [ORCHESTRATOR] Dependency graph built:", 
                Array.from(dependencyMap.entries()).map(([k, v]) => ({ node: k, deps: Array.from(v) })));
            
            console.log("⚡ [ORCHESTRATOR] Starting parallel node execution...");
            // Execute nodes with parallel execution where possible
            await executeNodesInParallel(nodes, edges, dependencyMap, run.id);
            console.log("✅ [ORCHESTRATOR] All nodes executed successfully");

            // Mark workflow as completed
            await prisma.workflowRun.update({
                where: { id: run.id },
                data: { 
                    status: "COMPLETED",
                    finishedAt: new Date(),
                },
            });

            return { 
                status: "Workflow Completed", 
                runId: run.id,
                message: `Successfully executed ${nodes.length} nodes`,
            };
        } catch (error) {
            console.error(`Workflow ${run.id} failed:`, error);
            
            await prisma.workflowRun.update({
                where: { id: run.id },
                data: { 
                    status: "FAILED",
                    finishedAt: new Date(),
                },
            });
            
            throw error;
        }
    },
});

// Build dependency graph to determine execution order
function buildDependencyGraph(nodes: NodeData[], edges: EdgeData[]): Map<string, Set<string>> {
    const dependencyMap = new Map<string, Set<string>>();
    
    // Initialize all nodes
    nodes.forEach(node => {
        dependencyMap.set(node.id, new Set<string>());
    });
    
    // Add dependencies (incoming edges)
    edges.forEach(edge => {
        const dependencies = dependencyMap.get(edge.target);
        if (dependencies) {
            dependencies.add(edge.source);
        }
    });
    
    return dependencyMap;
}

// Get all nodes that are ready to execute (dependencies met)
function getReadyNodes(
    nodes: NodeData[], 
    dependencyMap: Map<string, Set<string>>, 
    executedNodes: Set<string>,
    nonExecutableNodes: Set<string>
): NodeData[] {
    return nodes.filter(node => {
        // Skip already executed nodes
        if (executedNodes.has(node.id)) return false;
        
        // Skip non-executable nodes (tracked separately)
        if (nonExecutableNodes.has(node.id)) return false;
        
        // Skip non-executable node types
        if (!isExecutableNode(node)) return false;
        
        // Check if all dependencies are met
        const dependencies = dependencyMap.get(node.id);
        if (!dependencies || dependencies.size === 0) return true; // No dependencies
        
        // All dependencies must be either executed OR non-executable
        for (const dep of dependencies) {
            const isDepDone = executedNodes.has(dep) || nonExecutableNodes.has(dep);
            if (!isDepDone) return false;
        }
        
        return true;
    });
}

// Check if node type is executable
function isExecutableNode(node: NodeData): boolean {
    return node.type === "llmNode" || 
           node.type === "cropImageNode" || 
           node.type === "extractFrameNode";
}

// Execute nodes in parallel waves based on dependencies
async function executeNodesInParallel(
    nodes: NodeData[], 
    edges: EdgeData[], 
    dependencyMap: Map<string, Set<string>>,
    runId: string
): Promise<void> {
    console.log("🔄 [PARALLEL] Starting parallel execution engine");
    const executedNodes = new Set<string>();
    const nodeOutputs = new Map<string, any>();
    
    const totalExecutableNodes = nodes.filter(isExecutableNode).length;
    console.log(`📊 [PARALLEL] Total executable nodes: ${totalExecutableNodes}`);
    
    // Mark all non-executable nodes as "executed" since they don't need execution
    // But DON'T count them in the executable tracking
    const nonExecutableNodes = new Set<string>();
    nodes.forEach(node => {
        if (!isExecutableNode(node)) {
            nonExecutableNodes.add(node.id);
            console.log(`✅ [PARALLEL] Marking non-executable node: ${node.id} (${node.type})`);
        }
    });
    
    let waveNumber = 0;
    // Continue until all executable nodes are processed
    while (executedNodes.size < totalExecutableNodes) {
        waveNumber++;
        console.log(`\n🌊 [PARALLEL] === WAVE ${waveNumber} === (${executedNodes.size}/${totalExecutableNodes} completed)`);
        
        // Get nodes that are ready to execute
        const readyNodes = getReadyNodes(nodes, dependencyMap, executedNodes, nonExecutableNodes);
        console.log(`🎯 [PARALLEL] Ready nodes in wave ${waveNumber}:`, readyNodes.map(n => ({ id: n.id, type: n.type })));
        
        if (readyNodes.length === 0) {
            // No more nodes can be executed - check for circular dependencies
            const remainingExecutableNodes = nodes.filter(
                node => isExecutableNode(node) && !executedNodes.has(node.id)
            );
            
            if (remainingExecutableNodes.length > 0) {
                console.error("Circular dependency or missing nodes detected!");
                throw new Error("Cannot execute remaining nodes due to unmet dependencies");
            }
            
            break;
        }
        
        console.log(`⚡ [PARALLEL] Executing ${readyNodes.length} nodes in parallel...`);
        
        // Execute all ready nodes in parallel
        const executionPromises = readyNodes.map(node => {
            console.log(`🚀 [PARALLEL] Launching execution for node: ${node.id} (${node.type})`);
            return executeNode(node, edges, nodes, nodeOutputs, runId);
        });
        
        console.log(`⏳ [PARALLEL] Waiting for ${executionPromises.length} promises...`);
        const results = await Promise.allSettled(executionPromises);
        console.log(`✅ [PARALLEL] All ${results.length} promises settled`);
        
        // Mark nodes as executed and store outputs
        results.forEach((result, index) => {
            const node = readyNodes[index];
            executedNodes.add(node.id);
            
            if (result.status === "fulfilled") {
                nodeOutputs.set(node.id, result.value);
            }
        });
    }
}

// Execute a single node
async function executeNode(
    node: NodeData,
    edges: EdgeData[],
    allNodes: NodeData[],
    nodeOutputs: Map<string, any>,
    runId: string
): Promise<any> {
    console.log(`\n🎬 [NODE ${node.id}] Starting execution (${node.type})`);
    console.log(`📋 [NODE ${node.id}] Node data:`, JSON.stringify(node.data, null, 2));
    
    console.log(`💾 [NODE ${node.id}] Creating execution record...`);
    const executionRecord = await prisma.nodeExecution.create({
        data: {
            runId: runId,
            nodeId: node.id,
            nodeType: node.type,
            nodeLabel: node.data?.label || node.type,
            status: "RUNNING",
            startedAt: new Date(),
            inputData: node.data ?? {},
        },
    });
    
    const startTime = Date.now();
    
    try {
        let result: any;
        
        switch (node.type) {
            case "llmNode":
                result = await executeLLMNode(node, edges, allNodes, nodeOutputs);
                break;
            case "cropImageNode":
                result = await executeCropImageNode(node, edges, allNodes, nodeOutputs);
                break;
            case "extractFrameNode":
                result = await executeExtractFrameNode(node, edges, allNodes, nodeOutputs);
                break;
            default:
                throw new Error(`Unsupported node type: ${node.type}`);
        }
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ [EXECUTE] Node ${node.id} (${node.type}) completed in ${duration}ms`);
        console.log(`💾 [EXECUTE] Saving output to database:`, JSON.stringify(result).substring(0, 200));
        
        const updatedExecution = await prisma.nodeExecution.update({
            where: { id: executionRecord.id },
            data: {
                status: "SUCCESS",
                finishedAt: new Date(),
                outputData: result as any,
                duration,
            },
        });
        
        console.log(`✅ [EXECUTE] NodeExecution ${updatedExecution.id} saved - Status: ${updatedExecution.status}`);
        
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Node ${node.id} failed:`, error);
        
        await prisma.nodeExecution.update({
            where: { id: executionRecord.id },
            data: { 
                status: "FAILED", 
                finishedAt: new Date(), 
                error: String(error),
                duration,
            },
        });
        
        throw error;
    }
}

// Execute LLM Node
async function executeLLMNode(
    node: NodeData,
    edges: EdgeData[],
    allNodes: NodeData[],
    nodeOutputs: Map<string, any>
): Promise<any> {
    console.log(`🤖 [LLM ${node.id}] Executing LLM node...`);
    
    // Collect inputs from connected nodes
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    console.log(`🔗 [LLM ${node.id}] Incoming edges: ${incomingEdges.length}`);
    
    let userPrompt = node.data.prompt || "";
    let systemPrompt = node.data.systemPrompt || "";
    console.log(`📝 [LLM ${node.id}] Initial prompts - User: "${userPrompt.substring(0, 50)}...", System: "${systemPrompt.substring(0, 50)}..."`);
    
    // Gather inputs from predecessor nodes
    for (const edge of incomingEdges) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;
        
        const sourceOutput = nodeOutputs.get(edge.source);
        
        // Handle text nodes
        if (sourceNode.type === "textNode") {
            const text = sourceNode.data.text || "";
            if (edge.targetHandle === "system-prompt") {
                systemPrompt += "\n" + text;
            } else if (edge.targetHandle === "prompt") {
                userPrompt += "\n" + text;
            }
        }
        
        // Handle LLM node chaining
        if (sourceNode.type === "llmNode" && sourceOutput?.text) {
            if (edge.targetHandle === "system-prompt") {
                systemPrompt += "\n" + sourceOutput.text;
            } else {
                userPrompt += "\n" + sourceOutput.text;
            }
        }
    }
    
    if (!userPrompt.trim()) {
        userPrompt = "Generate a response";
        console.log(`⚠️ [LLM ${node.id}] No user prompt found, using default`);
    }
    
    const taskPayload = {
        prompt: userPrompt.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        model: node.data.model || "gemini-1.5-flash",
        temperature: node.data.temperature || 0.7,
    };
    
    console.log(`\n📥 [LLM ${node.id}] ========== INPUT ==========`);
    console.log(`   Model: ${taskPayload.model}`);
    console.log(`   Temperature: ${taskPayload.temperature}`);
    console.log(`   System Prompt: ${taskPayload.systemPrompt || '(none)'}`);
    console.log(`   User Prompt: ${taskPayload.prompt}`);
    console.log(`🚀 [LLM ${node.id}] Triggering aiGenerator task...`);
    
    // Execute via Trigger.dev task with full parameters
    const triggerResult = await aiGenerator.triggerAndWait(taskPayload);
    
    console.log(`\n🔍 [LLM ${node.id}] ========== RAW TRIGGER RESULT ==========`);
    console.log(`   Full result:`, JSON.stringify(triggerResult, null, 2));
    
    // Extract the actual output from Trigger.dev response
    const result = triggerResult.ok && triggerResult.output 
        ? triggerResult.output 
        : triggerResult;
    
    console.log(`\n📤 [LLM ${node.id}] ========== OUTPUT ==========`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Text Length: ${result.text?.length || 0} chars`);
    console.log(`   Response Preview: ${result.text?.substring(0, 200)}${result.text?.length > 200 ? '...' : ''}`);
    console.log(`✅ [LLM ${node.id}] Task completed successfully\n`);
    
    return result;
}

// Execute Crop Image Node
async function executeCropImageNode(
    node: NodeData,
    edges: EdgeData[],
    allNodes: NodeData[],
    nodeOutputs: Map<string, any>
): Promise<any> {
    // Get image input from connected image node
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    let imageUrl = node.data.originalImage || node.data.image;
    
    for (const edge of incomingEdges) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;
        
        if (sourceNode.type === "imageNode") {
            imageUrl = sourceNode.data.file?.url || sourceNode.data.image;
            break;
        }
    }
    
    if (!imageUrl) {
        throw new Error("No image input found for crop node");
    }
    
    const cropData = node.data.cropArea || { x: 0, y: 0, width: 100, height: 100 };
    
    const result = await cropImageTask.triggerAndWait({
        imageUrl,
        cropX: cropData.x,
        cropY: cropData.y,
        cropWidth: cropData.width,
        cropHeight: cropData.height,
    });
    
    return result;
}

// Execute Extract Frame Node
async function executeExtractFrameNode(
    node: NodeData,
    edges: EdgeData[],
    allNodes: NodeData[],
    nodeOutputs: Map<string, any>
): Promise<any> {
    // Get video input from connected video node
    const incomingEdges = edges.filter(edge => edge.target === node.id);
    
    let videoUrl = node.data.videoUrl;
    
    for (const edge of incomingEdges) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;
        
        if (sourceNode.type === "videoNode") {
            videoUrl = sourceNode.data.video?.url || sourceNode.data.videoUrl;
            break;
        }
    }
    
    if (!videoUrl) {
        throw new Error("No video input found for extract frame node");
    }
    
    const cropData = node.data.cropArea || { x: 0, y: 0, width: 100, height: 100 };
    const framesPerSecond = node.data.framesPerSecond || 1;
    
    const result = await extractVideoFrames.triggerAndWait({
        videoUrl,
        cropX: cropData.x,
        cropY: cropData.y,
        cropWidth: cropData.width,
        cropHeight: cropData.height,
        framesPerSecond,
    });
    
    return result;
}
