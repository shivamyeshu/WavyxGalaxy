# Galaxy.ai × Weavy Workflow Builder

> An advanced LLM-powered visual workflow editor inspired by Weavy.ai, built for Galaxy.ai SDE internship challenge. Seamlessly create, execute, and manage AI workflows with a beautiful node-based canvas interface.

**Submission for Galaxy.ai** | Candidate:Shivam | January 18, 2026
---

## What is This?

Galaxy Workflow Builder is a modern, production-ready visual workflow editor that lets you:

- **Build workflows visually** using an intuitive drag-and-drop node canvas
- **Execute LLM-powered workflows** with Google Gemini integration
- **Process images** with upload, crop, and AI analysis capabilities
- **Run on Trigger.dev** for reliable, scalable execution
- **Persist everything** with Prisma + PostgreSQL
- **Secure authentication** with Clerk
- **Beautiful dark mode UI** inspired by Weavy's design system

Perfect for:
- Building no-code AI automation workflows
- Image processing pipelines with AI
- Rapid workflow prototyping
- Understanding modern web app architecture

---

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Demo Workflow](#demo-workflow)
- [Configuration](#configuration)
- [Roadmap](#roadmap)
- [Architecture Highlights](#architecture-highlights)
- [About](#about)

---

## Key Features

### Canvas & UI
- Pixel-inspired Weavy design with dark mode, dotted grid, and minimap
- Smooth pan/zoom interactions on the canvas
- Real-time visual feedback with pulsating glow effects on running nodes
- Left sidebar with quick-access node buttons

### Workflow Execution
- 4 fully functional node types:
  - Image Input: Upload images via Transloadit, get public URLs
  - Crop Image: Precise image cropping with X%, Y%, Width%, Height% parameters
  - LLM Node: Execute Google Gemini prompts via Trigger.dev
  - Text Node: Static text with output connections

- Sequential workflow execution with real data flow
- Trigger.dev integration for reliable, serverless execution
- Node deletion & context menus with loading/error states

### Data & Persistence
- Workflow history panel with execution logs (timestamp, status, node details)
- Prisma ORM with PostgreSQL for reliable persistence
- Type-safe data flow with Zod validation
- JSON-based node data storage for flexibility

### Authentication & Security
- Clerk authentication with protected routes
- User-scoped workflows and executions

---

## Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI Framework | Tailwind CSS + shadcn/ui + Lucide React Icons |
| Canvas | @xyflow/react (React Flow v12) |
| State | Zustand + Zundo (undo/redo ready) |
| Auth | Clerk (@clerk/nextjs) |
| Database | Prisma ORM + PostgreSQL (Neon) |
| LLM | Google Gemini API (@google/generative-ai) |
| Execution | Trigger.dev v4 (serverless orchestration) |
| File Upload | Transloadit (Uppy + @uppy/transloadit) |
| Validation | Zod |
| Animations | Framer Motion |

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL (free tier: Neon.tech)
- External accounts:
  - Clerk — Authentication
  - Google AI Studio — Gemini API key
  - Trigger.dev — Workflow orchestration
  - Transloadit — File uploads

### Installation

```bash
# Clone and install
git clone https://github.com/shivamyeshu/WavyxGalaxy.git
cd weavy-clone-main
npm install

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push
```

### Environment Setup

Create `.env.local` in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Gemini
GEMINI_API_KEY=AIzaSy...

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:...@ep-...neon.tech/neondb?sslmode=require

# Transloadit (File Upload)
TRANSLOADIT_KEY=...
TRANSLOADIT_SECRET=...
TRANSLOADIT_TEMPLATE_ID=asm_...

# Trigger.dev (Execution Engine)
TRIGGER_SECRET_KEY=tr_dev_...
TRIGGER_PROJECT_REF=prj_...
```

### Run Development Server

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Trigger.dev local execution (optional, for testing)
npx trigger.dev@latest dev

# Open http://localhost:3000
```

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/             # Landing pages
│   ├── workflows/               # Workflow builder pages
│   ├── sign-in/                 # Clerk auth pages
│   ├── api/                     # API routes (LLM execution)
│   └── globals.css              # Global styles
├── components/
│   ├── workflow/                # Canvas + editor components
│   │   ├── FlowEditor.tsx       # Main canvas
│   │   ├── Sidebar.tsx          # Node palette
│   │   ├── nodes/               # Custom node types (Image, Crop, LLM, Text)
│   │   └── edges/               # Animated edge renderer
│   ├── marketing/               # Landing page sections
│   └── providers/               # Clerk AuthProvider
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── types.ts                 # TypeScript interfaces
│   ├── demoWorkflows.ts         # Pre-built workflow templates
│   └── utils.ts                 # Helpers
├── store/
│   └── workflowStore.ts         # Zustand workflow state
├── trigger/
│   ├── workflow-nodes.ts        # Trigger.dev task definitions
│   └── orchestrator.ts          # Execution orchestration
└── middleware.ts                # Clerk auth middleware

prisma/
├── schema.prisma                # Database schema
└── migrations/                  # Prisma migrations
```

---

## Demo Workflow

The app includes a pre-built demo workflow:

**Image → Crop → LLM Analysis Pipeline**

1. Upload Image: Transloadit handles upload, stores public URL
2. Crop Image: Adjust crop region with X%, Y%, Width%, Height% sliders
3. Text Prompt: Add your analysis prompt (e.g., "Describe what you see")
4. Run LLM: Gemini analyzes the cropped image using your prompt
5. View Results: Output appears in node + execution history panel

To load: Click "Load Demo Workflow" in the workflow editor.

---

## Configuration

### Database Migrations

If you modify `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev --name <migration_name>
```

### Customizing Nodes

Create new node types in `src/components/workflow/nodes/`:

```typescript
// NewNode.tsx
import { Handle, Position } from '@xyflow/react';

export function NewNode({ data }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-sm font-semibold">{data.label}</div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

### Trigger.dev Tasks

Define new tasks in `src/trigger/workflow-nodes.ts`:

```typescript
export const myCustomTask = task({
  id: "my-custom-task",
  run: async (payload) => {
    // Your logic here
    return result;
  },
});
```

---

## Roadmap

### Phase 2 (Planned)
- Video Processing — Upload video, extract frames with FFmpeg
- Parallel Execution — Run multiple branches simultaneously
- Convergence Nodes — Merge parallel workflows at final LLM node
- Workflow Import/Export — Save as JSON, share with teammates
- DAG Cycle Detection — Prevent invalid workflow connections
- Full Undo/Redo — Complete history management via Zundo
- Advanced Node Types — Database queries, webhooks, SMS/Email
- Monitoring Dashboard — Execution analytics & performance metrics
- Multi-user Collaboration — Real-time editing with WebSockets
- Pixel-Perfect Styling — Exact Weavy.ai UI replication

---

## Architecture Highlights

### State Management
- Zustand for workflow state (nodes, edges, executions)
- Zundo integration ready for undo/redo functionality
- React Context for Clerk authentication

### Data Flow
```
User Action → Zustand Store → Update Canvas → Serialize → Prisma → PostgreSQL
                    ↓
              Trigger.dev Job → Google Gemini → Result → Update History
```

### Type Safety
- TypeScript for compile-time safety
- Zod for runtime validation of workflow/node data
- Prisma types generated from schema

### Performance
- Next.js Image Optimization for uploaded images
- React Flow memoization to prevent unnecessary node re-renders
- Trigger.dev async execution keeps UI responsive

---

## What This Demonstrates

- Full-stack modern web development with Next.js 15, TypeScript, and Zustand
- External service integrations with Clerk, Google Gemini, Trigger.dev, and Transloadit
- Complex UI patterns with React Flow, animations, and responsive design
- Production-ready code with error handling, validation, persistence, and security

---

## Contributing

Found a bug or want to improve this? Fork the repo and submit a PR.

Areas that need help:
- Video processing branch implementation
- Parallel execution + convergence
- Pixel-perfect UI refinements
- Unit/integration tests

---

## License

This project is open for educational and portfolio purposes. Credit Galaxy.ai and Weavy.ai for inspiration.

---

## About

**Shivam** | Delhi, India

- GitHub: https://github.com/shivamyeshu
- LinkedIn: https://www.linkedin.com/in/shivam-yeshu
- Contact via GitHub

Built for the Galaxy.ai SDE internship challenge.

Deadline: January 22, 2026 EOD

---

## Support

Have questions?
- Check the Issues tab
- Open a discussion for architecture questions
- Review the inline code comments (especially in `src/trigger/` and `src/store/`)
