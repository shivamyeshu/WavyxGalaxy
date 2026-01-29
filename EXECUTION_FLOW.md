# Workflow Execution Flow

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE (Browser)                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │              Header.tsx (FlowEditor UI)                 │         │
│  │  • User clicks "RUN WORKFLOW" button                    │         │
│  │  • Saves workflow if needed                             │         │
│  │  • Calls API: POST /api/workflows/[id]/run             │         │
│  │  • Starts polling: GET /api/workflows/[id]/run          │         │
│  │  • Updates node UI states from poll results             │         │
│  └────────────────┬────────────────────────────────────────┘         │
│                   │                                                   │
└───────────────────┼───────────────────────────────────────────────────┘
                    │ HTTP
                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        API LAYER (Next.js)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │      /api/workflows/[workflowId]/run/route.ts          │         │
│  │                                                         │         │
│  │  POST: Start Execution                                 │         │
│  │  ├─ Validate user auth                                 │         │
│  │  ├─ Check workflow exists                              │         │
│  │  ├─ Validate executable nodes                          │         │
│  │  ├─ Create WorkflowRun (PENDING)                       │         │
│  │  └─ Trigger: tasks.trigger("workflow-orchestrator")    │─────┐   │
│  │                                                         │     │   │
│  │  GET: Check Status                                     │     │   │
│  │  ├─ Get latest WorkflowRun                             │     │   │
│  │  ├─ Include NodeExecutions                             │     │   │
│  │  └─ Return status & results                            │     │   │
│  └─────────────────────────────────────────────────────────┘     │   │
│                                                                   │   │
└───────────────────────────────────────────────────────────────────┼───┘
                                                                    │
                                                                    │ Trigger.dev
                                                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  TRIGGER.DEV ORCHESTRATOR LAYER                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │      orchestrator.ts: workflow-orchestrator task       │         │
│  │                                                         │         │
│  │  1. Load WorkflowRun + Workflow data                   │         │
│  │  2. Update run status: RUNNING                         │         │
│  │  3. Build dependency graph from edges                  │         │
│  │  4. Execute in parallel waves:                         │         │
│  │                                                         │         │
│  │     Wave 1 (No dependencies):                          │         │
│  │     ┌──────────┐  ┌──────────┐  ┌──────────┐          │         │
│  │     │ LLM Node │  │ LLM Node │  │Crop Node │          │         │
│  │     │    A     │  │    B     │  │    C     │          │         │
│  │     └────┬─────┘  └────┬─────┘  └────┬─────┘          │         │
│  │          │             │             │                 │         │
│  │          └─────────────┼─────────────┘                 │         │
│  │                        ▼                               │         │
│  │     Wave 2 (Depends on Wave 1):                       │         │
│  │     ┌──────────┐                                      │         │
│  │     │ LLM Node │                                      │         │
│  │     │    D     │                                      │         │
│  │     └──────────┘                                      │         │
│  │                                                         │         │
│  │  5. For each node, create NodeExecution record        │         │
│  │  6. Call appropriate task (parallel)                  │─────┐   │
│  │  7. Update NodeExecution with result                  │     │   │
│  │  8. Mark WorkflowRun as COMPLETED                     │     │   │
│  └─────────────────────────────────────────────────────────┘     │   │
│                                                                   │   │
└───────────────────────────────────────────────────────────────────┼───┘
                                                                    │
                                                                    │ triggerAndWait
                                                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    TRIGGER.DEV TASK WORKERS                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ aiGenerator  │  │cropImageTask │  │extractVideo  │              │
│  │    Task      │  │    Task      │  │Frames Task   │              │
│  │              │  │              │  │              │              │
│  │ • Gemini AI  │  │ • Cloudinary │  │ • Cloudinary │              │
│  │ • Multiple   │  │ • Image crop │  │ • Frame      │              │
│  │   models     │  │ • Transform  │  │   extraction │              │
│  │ • System     │  │              │  │              │              │
│  │   prompts    │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

                                    │
                                    │ Results stored in
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │ WorkflowRun                                             │         │
│  │ ├─ id (UUID)                                            │         │
│  │ ├─ workflowId                                           │         │
│  │ ├─ status: PENDING → RUNNING → COMPLETED/FAILED        │         │
│  │ ├─ startedAt                                            │         │
│  │ └─ finishedAt                                           │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────┐         │
│  │ NodeExecution (multiple per run)                        │         │
│  │ ├─ id (UUID)                                            │         │
│  │ ├─ runId                                                │         │
│  │ ├─ nodeId (from React Flow)                            │         │
│  │ ├─ nodeType (llmNode, cropImageNode, etc.)             │         │
│  │ ├─ status: PENDING → RUNNING → SUCCESS/FAILED          │         │
│  │ ├─ inputData (JSON)                                     │         │
│  │ ├─ outputData (JSON)                                    │         │
│  │ ├─ error (if failed)                                    │         │
│  │ ├─ duration (milliseconds)                              │         │
│  │ └─ timestamps                                           │         │
│  └─────────────────────────────────────────────────────────┘         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## Parallel Execution Example

Given this workflow:

```
TextNode A ──┐
             ├─→ LLM Node 1 ─┐
TextNode B ──┘               │
                             ├─→ LLM Node 3 (final)
TextNode C ──→ LLM Node 2 ─┘
```

**Execution Timeline:**

```
Time 0s:  [LLM Node 1] [LLM Node 2]  ← Wave 1: Both execute in parallel
          └─────────────┴──────────────┘
                    │
Time 3s:  Wait for both to complete
                    │
Time 3s:  [LLM Node 3]  ← Wave 2: Executes after dependencies complete
                    │
Time 6s:  COMPLETED ✓
```

**Before (Sequential):**
- Total time: ~9 seconds (3s + 3s + 3s)

**After (Parallel):**
- Total time: ~6 seconds (3s parallel + 3s)
- **33% faster!** 🚀

## Key Benefits

1. **⚡ Performance**: Parallel execution of independent nodes
2. **🔒 Security**: Server-side execution, no API key exposure
3. **📊 Observability**: Full execution history in database
4. **🎯 Reliability**: Isolated tasks with retry capabilities
5. **📈 Scalability**: Trigger.dev handles load distribution
