/**
 * Trigger.dev v4 Task Exports
 * 
 * This file exports all tasks for Trigger.dev to discover during deployment.
 * All tasks must be exported from this file to be detected by the CLI.
 */

// Export orchestrator tasks
export { orchestrator, singleNodeExecutor } from "./orchestrator";

// Export workflow node tasks
export { 
  aiGenerator, 
  imageProcessor,
  cropImageTask, 
  extractVideoFrames 
} from "./workflow-nodes";
