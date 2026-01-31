# Architecture Refactor: Server-Side Workflow Orchestration

## Overview
Refactored the workflow execution system to use **server-side Trigger.dev orchestration** instead of client-side execution, with **proper parallel node execution** support.

## Key Changes

### 1. New API Route: `/api/workflows/[workflowId]/run`
**File:** `src/app/api/workflows/[workflowId]/run/route.ts`

- **POST endpoint**: Triggers server-side workflow execution
  - Validates user authorization
  - Checks for executable nodes in workflow
  - Creates a `WorkflowRun` record in database
  - Triggers the Trigger.dev orchestrator task
  - Returns run ID and trigger handle

- **GET endpoint**: Checks execution status
  - Returns latest workflow run with node execution details
  - Includes status, outputs, and error information

### 2. Refactored Client-Side Execution
**File:** `src/components/workflow/Header.tsx`

**Before:** Client-side sequential execution
- Iterated through LLM nodes one by one
- Manually fetched inputs from connected nodes
- Called `/api/llm/execute` for each node
- Updated UI state directly

**After:** Server-side orchestrated execution
- Saves workflow if not already saved
- Calls `/api/workflows/[workflowId]/run` to trigger execution
- Polls execution status every second
- Updates node UI states based on server execution results
- Handles timeout after 60 seconds

### 3. Enhanced Orchestrator
**File:** `src/trigger/orchestrator.ts`

**New Features:**
- ✅ **Parallel Execution**: Executes independent nodes simultaneously
- ✅ **Dependency Management**: Builds dependency graph from edges
- ✅ **Wave-based Execution**: Processes nodes in dependency waves
- ✅ **Multiple Node Types**: Supports LLM, Crop Image, and Extract Frame nodes
- ✅ **Database Tracking**: Creates execution records for each node
- ✅ **Error Handling**: Graceful failure with detailed error messages

**Execution Flow:**
1. Build dependency graph from workflow edges
2. Identify nodes with no dependencies (wave 1)
3. Execute all nodes in current wave in parallel
4. Wait for all to complete
5. Identify next wave (nodes whose dependencies are now met)
6. Repeat until all executable nodes are processed

### 4. Enhanced Task Definitions
**File:** `src/trigger/workflow-nodes.ts`

**`aiGenerator` task improvements:**
- Supports multiple models (gemini-1.5-flash, gemini-1.5-pro)
- Accepts system prompts
- Configurable temperature
- Better logging with emojis

**Existing tasks ready for parallel execution:**
- `cropImageTask`: Image cropping via Cloudinary
- `extractVideoFrames`: Video frame extraction
- `imageProcessor`: Image processing placeholder

## Benefits

### 🚀 Performance
- **Parallel Execution**: Independent nodes run simultaneously
- **Reduced Latency**: No client-side bottlenecks
- **Scalable**: Trigger.dev handles load distribution

### 🔒 Security
- **Server-Side**: API keys never exposed to client
- **Authorization**: User validation on every request
- **Rate Limiting**: Controlled via Trigger.dev

### 📊 Observability
- **Database Tracking**: Every node execution logged
- **Execution History**: Full audit trail in `WorkflowRun` and `NodeExecution` tables
- **Status Monitoring**: Real-time status updates via polling

### 🧪 Testability
- **Isolated Tasks**: Each node type has dedicated task
- **Dependency Injection**: Easy to mock for testing
- **Structured Data**: Clear input/output contracts

## Database Schema Usage

### `WorkflowRun`
- Tracks overall workflow execution
- Status: PENDING → RUNNING → COMPLETED/FAILED
- Records start and finish times

### `NodeExecution`
- Tracks individual node execution
- Stores input/output data
- Records execution duration
- Captures errors

## Migration Notes

### No Breaking Changes
- Existing workflows continue to work
- UI remains unchanged for users
- Same workflow save/load functionality

### Backward Compatibility
- Old client-side execution code removed
- Replaced with server-side trigger
- UI polling shows same real-time updates

## Testing Recommendations

1. **Unit Tests**
   - Test dependency graph building
   - Test wave-based execution logic
   - Test each node executor function

2. **Integration Tests**
   - Test API route with various workflows
   - Test parallel execution with independent nodes
   - Test sequential execution with dependent nodes

3. **E2E Tests**
   - Create workflow with multiple LLM nodes
   - Verify parallel execution
   - Check UI updates during execution
   - Verify execution history

## Future Enhancements

- [ ] Add retry logic for failed nodes
- [ ] Support conditional execution paths
- [ ] Add execution visualization in UI
- [ ] Support workflow scheduling
- [ ] Add execution metrics dashboard
- [ ] Support custom node types via plugins

## Ready for Re-Review! ✅

All critical architecture issues have been resolved:
- ✅ Workflow execution now uses server-side Trigger.dev orchestration
- ✅ Orchestrator properly implements parallel execution
- ✅ All node types are supported (LLM, Crop, Extract Frame)
- ✅ Clean separation between UI and execution logic
- ✅ Proper database tracking and observability
