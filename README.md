# WeavyxGalaxy - Visual AI Workflow Builder

<div align="center">

![Main Interface](public/readme/main.png)

**An advanced AI-powered visual workflow editor with serverless execution, multi-modal AI processing, and enterprise-grade architecture.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-4.3.3-purple?style=flat)](https://trigger.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture) • [Demo](#demo-walkthrough)

</div>

---

## Overview

WeavyxGalaxy is a production-ready visual workflow platform that enables users to build sophisticated AI automation pipelines through an intuitive drag-and-drop interface. Built with enterprise-grade technologies, it combines powerful LLM capabilities with seamless data processing and reliable serverless execution.

### Why WeavyxGalaxy?

- **Visual-First Design**: Intuitive node-based canvas for building complex workflows without code
- **AI-Powered**: Multi-modal Gemini AI integration for text and image analysis
- **Serverless Execution**: Trigger.dev orchestration with parallel processing and retry mechanisms
- **Enterprise Ready**: Clerk authentication, PostgreSQL storage, and comprehensive error handling
- **Developer Friendly**: Full TypeScript support, clean architecture, and extensive documentation

### Major Update (v1.0.0)

- README refreshed with all feature screenshots from `public/readme/`
- Architecture section upgraded with text-based diagrams (no external diagram image dependencies)
- Diagram borders and spacing standardized for clean monospace rendering
- `package.json` version bumped to `1.0.0` to reflect a major release milestone

---

## Table of Contents

- [Features](#features)
- [Demo Walkthrough](#demo-walkthrough)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Visual Workflow Editor

![Workflow Canvas](public/readme/flow.png)

- **Professional Canvas Interface**
  - Dark-mode theme with dotted grid background
  - Smooth pan, zoom, and minimap navigation
  - Real-time visual feedback during execution
  - Drag-and-drop node placement
  - Context menus for quick actions

- **Undo/Redo System**
  - Full canvas history tracking
  - Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
  - Canvas state restoration

### Node Types

**Text Input Node**
- Manual text entry for prompts
- System message configuration
- Multi-line text support

**Image Input Node**
- Direct image upload via Cloudinary
- URL-based image linking
- Base64 encoding support
- Multi-format compatibility (PNG, JPEG, WebP)

**Crop Image Node**
- Precise image cropping with percentage-based coordinates
- Real-time crop preview
- X, Y, Width, Height controls
- Cloudinary transformation

**LLM Processing Node**
- **Multi-Modal AI**: Gemini 1.5 Flash, 1.5 Pro, 2.5 Flash support
- **Image Analysis**: Analyze images alongside text prompts
- **Custom Configuration**: Temperature, model selection
- **User API Keys**: Bring your own Gemini API key for cost control

**Video Frame Extraction Node**
- Extract frames from video files
- Frame rate configuration
- Multiple output formats

### Workflow Execution

![Demo with History](public/readme/demowithhistory.png)

#### Trigger.dev Orchestration
- **Serverless Background Processing**: No timeout limitations
- **Parallel Execution**: Dependency-based node scheduling
- **Wave-Based Processing**: Execute independent nodes simultaneously
- **Automatic Retries**: Built-in failure recovery
- **Comprehensive Logging**: Real-time execution tracking

### Authentication & Security

![API Key Management](public/readme/apikey.png)

#### User API Key System
- **Cost Control**: Users can provide their own Gemini API keys
- **Fallback Support**: Server API key as backup
- **Priority System**: User key > Server key
- **Secure Storage**: Encrypted key management

- **Clerk Integration**: Email/password and OAuth support
- **Session Management**: Secure JWT-based authentication
- **API Key Storage**: User-specific Gemini API keys
- **Access Control**: User-scoped workflow ownership

### Workflow Management

![Workflow Space](public/readme/workflowspace.png)

#### Customize & Delete
![Customize and Delete](public/readme/customize&delete.png)

- Rename workflows
- Delete workflows with confirmation
- Duplicate workflows (coming soon)
- Export/Import workflow JSON

#### Create & Update
![Create and Update](public/readme/makenew+updatepublish.png)

- Auto-save functionality
- Version history tracking
- Workflow execution history
- Node-level execution logs

### Publishing & Sharing

![Share Workflow](public/readme/shareworkflow.png)

#### Public Workflow Publishing
![Published Workflows](public/readme/publicallypublished.png)

- **Publish to Gallery**: Share workflows with the community
- **Read-Only Sharing**: Generate shareable links
- **Workflow Discovery**: Browse published workflows
- **Clone & Customize**: Use published workflows as templates

![Published Section](public/readme/publishedworkflowsection.png)

### Built-in Tutorials

![Tutorials](public/readme/tutorials.png)

- **Interactive Guides**: Step-by-step workflow creation
- **Best Practices**: Optimization tips and patterns
- **Example Workflows**: Pre-built templates for common use cases

---

## Demo Walkthrough

Screenshots are shown once in the [Features](#features) section (to avoid repeating the same image multiple times). This section focuses on the flow.

### Main Landing Page
The main landing page showcasing WeavyxGalaxy's capabilities.
Screenshot: see the hero image at the top of this README.

### Workflow Management Space
Dedicated workspace where users can manage and organize their workflows.
Screenshot: see [Workflow Management](#workflow-management).

### Interactive Canvas
The node-based visual editor for building and customizing workflows.
Screenshot: see [Visual Workflow Editor](#visual-workflow-editor).

### Execution History
Real-time execution tracking with comprehensive history and logs.
Screenshot: see [Workflow Execution](#workflow-execution).

### Node Customization
Options for customizing and managing workflow nodes.
Screenshot: see [Customize & Delete](#customize--delete).

### Workflow Sharing
Share workflows publicly or with specific users via shareable links.
Screenshot: see [Publishing & Sharing](#publishing--sharing).

### API Key Management
User-specific API key configuration for cost control.
Screenshot: see [Authentication & Security](#authentication--security).

### Publishing Workflows
Create and update workflow publications for community sharing.
Screenshot: see [Create & Update](#create--update).

### Public Gallery
Browse and discover publicly published workflows.
Screenshot: see [Public Workflow Publishing](#public-workflow-publishing).

### Published Workflows Section
Dedicated section for managing your published workflows.
Screenshot: see [Publishing & Sharing](#publishing--sharing).

### Interactive Tutorials
Built-in guides to help users learn workflow creation.
Screenshot: see [Built-in Tutorials](#built-in-tutorials).

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript 5.0
- **UI Library**: React 19
- **Canvas**: React Flow 12.10.0
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **Task Orchestration**: Trigger.dev v4.3.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk v6.36.7
- **File Storage**: Cloudinary v2.9.0

### AI & Processing
- **LLM**: Google Gemini AI (1.5 Flash, 1.5 Pro, 2.5 Flash)
- **Image Processing**: Cloudinary Transformations
- **Video Processing**: Frame extraction utilities

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9
- **Type Checking**: TypeScript strict mode

---

## Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **PostgreSQL**: 15.x or higher
- **npm**: 10.x or higher

### Required Accounts

1. **Clerk**: https://clerk.com (Authentication)
2. **Trigger.dev**: https://trigger.dev (Task orchestration)
3. **Cloudinary**: https://cloudinary.com (Media storage)
4. **Google AI Studio**: https://aistudio.google.com (Gemini API)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shivamyeshu/WeavyxGalaxy.git
cd WeavyxGalaxy
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/weavy"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI (Server key - fallback)
GEMINI_API_KEY=AIzaSy...
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run development servers**

Terminal 1 - Next.js:
```bash
npm run dev
```

Terminal 2 - Trigger.dev:
```bash
npm run trigger:dev
```

6. **Open the application**
```
http://localhost:3000
```

### First-Time Setup

1. **Sign up** for a new account
2. **Navigate to Settings** and add your Gemini API key (optional)
3. **Create your first workflow** from the dashboard
4. **Explore tutorials** for guided learning

---

## Architecture

### System Design

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React Flow  │  │   Zustand    │  │  TailwindCSS │      │
│  │   Canvas     │  │    State     │  │    Styling   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────────────────────────────────────────────┘
                            ↓ API Calls
┌──────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /api/workflows/[id]/run         (POST/GET)          │  │
│  │  /api/workflows/nodes/[id]/run   (POST/GET)          │  │
│  │  /api/user/api-key               (GET/POST/DELETE)   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↓ Triggers
┌──────────────────────────────────────────────────────────────┐
│                   TRIGGER.DEV TASKS                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  workflow-orchestrator                                │  │
│  │    • Build dependency graph                           │  │
│  │    • Execute nodes in parallel waves                  │  │
│  │    • Handle failures and retries                      │  │
│  │                                                        │  │
│  │  single-node-executor                                 │  │
│  │    • Execute individual nodes                         │  │
│  │                                                        │  │
│  │  aiGenerator                                          │  │
│  │    • Fetch images from URLs                           │  │
│  │    • Convert to base64                                │  │
│  │    • Call Gemini API (multi-modal)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            ↓ Storage
┌──────────────────────────────────────────────────────────────┐
│                POSTGRESQL + PRISMA ORM                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Users, Workflows, WorkflowRuns,                      │  │
│  │  NodeExecutions, UserAPIKeys, PublishedWorkflows      │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Parallel Wave Execution

```
User Action: "RUN WORKFLOW"
        ↓
┌──────────────────────────────────────────────────────────────┐
│  WAVE 1: Independent Nodes (No Dependencies)                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ TextNode │    │ImageNode │    │ TextNode │              │
│  │    A     │    │    B     │    │    C     │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│       ↓               ↓               ↓                      │
│    (Skip)          (Skip)          (Skip)  ← Non-executable │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  WAVE 2: Depends on Wave 1                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         LLM Node D                                     │  │
│  │  • Fetch User API Key from DB                         │  │
│  │  • Collect Images from ImageNode B                    │  │
│  │  • Get Text from TextNode A, C                        │  │
│  │  • Trigger aiGenerator Task                           │  │
│  │  • Save to NodeExecution Table                        │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────────┐
│  WAVE 3: Depends on Wave 2                                   │
│  ┌──────────┐                   ┌──────────┐                │
│  │ LLMNode  │                   │ LLMNode  │                │
│  │    E     │                   │    F     │ ← Parallel     │
│  └──────────┘                   └──────────┘                │
└──────────────────────────────────────────────────────────────┘
        ↓
Mark WorkflowRun as COMPLETED
        ↓
Frontend Polling Detects Completion
        ↓
Display Results in UI
```

### Database Schema (ERD)

```
┌──────────────────┐
│      User        │
│──────────────────│
│ id (PK, Clerk)   │
│ email            │
└──────────────────┘
    │ 1                    1
    ├────────────────────────┐
    │                        │
    │ 1                      │ N
┌───▼──────────────┐   ┌────▼──────────────┐
│   UserAPIKey     │   │    Workflow       │
│──────────────────│   │───────────────────│
│ id (PK)          │   │ id (PK)           │
│ userId (FK)      │   │ name              │
│ geminiApiKey     │   │ data (JSON)       │
└──────────────────┘   │ userId (FK)       │
                       └───────────────────┘
                              │ 1
                              │
                              │ N
                       ┌──────▼────────────┐
                       │  WorkflowRun      │
                       │───────────────────│
                       │ id (PK, UUID)     │
                       │ workflowId (FK)   │
                       │ status            │
                       │ triggerType       │
                       │ startedAt         │
                       │ finishedAt        │
                       └───────────────────┘
                              │ 1
                              │
                              │ N
                       ┌──────▼────────────┐
                       │  NodeExecution    │
                       │───────────────────│
                       │ id (PK, UUID)     │
                       │ runId (FK)        │
                       │ nodeId            │
                       │ nodeType          │
                       │ status            │
                       │ inputData (JSON)  │
                       │ outputData (JSON) │
                       │ startedAt         │
                       │ finishedAt        │
                       │ duration          │
                       └───────────────────┘

Key Relationships:
• User ←→ UserAPIKey (1:1)
• User ←→ Workflow (1:N)
• Workflow ←→ WorkflowRun (1:N)
• WorkflowRun ←→ NodeExecution (1:N)
• User ←→ PublishedWorkflow (1:N) [not shown]
```

### User API Key Priority Flow

```
LLM Node Execution Starts
        ↓
┌──────────────────────────────────┐
│  Check userId exists?            │
└──────────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   │         └─────────────────────────┐
   ↓                                   ↓
┌────────────────────────┐   ┌────────────────────┐
│ Query UserAPIKey DB    │   │ Use Server API Key │
└────────────────────────┘   └────────────────────┘
        │
   ┌────┴────┐
   │         │
 FOUND    NOT FOUND
   │         │
   ↓         ↓
┌────────────────────┐   ┌────────────────────┐
│ Use User's Key     │   │ Use Server API Key │
│ (Cost to User)     │   │ (Fallback)         │
└────────────────────┘   └────────────────────┘
        │                      │
        └──────────┬───────────┘
                   ↓
        ┌────────────────────┐
        │ Execute aiGenerator│
        │ Task with API Key  │
        └────────────────────┘
```

### Multi-Modal Image Processing Pipeline

```
ImageNode with Cloudinary URL
        ↓
┌──────────────────────────────────┐
│  URL Validation                  │
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│ Is Base64 format?                │
└──────────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   │         ↓
   │    ┌─────────────────────────────┐
   │    │  Fetch from URL             │
   │    │  (HTTPS Request)            │
   │    └─────────────────────────────┘
   │         ↓
   │    ┌─────────────────────────────┐
   │    │  Convert to Base64          │
   │    │  Buffer.from()              │
   │    └─────────────────────────────┘
   │         │
   └─────────┘
        ↓
┌──────────────────────────────────┐
│ Format for Gemini API            │
│ {                                │
│   inlineData: {                  │
│     mimeType: "image/png",       │
│     data: base64String           │
│   }                              │
│ }                                │
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│  aiGenerator Task                │
│  • Add to content array          │
│  • Combine with text prompt      │
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│  Gemini API Call                 │
│  (Multi-modal: text+images)      │
└──────────────────────────────────┘
        ↓
┌──────────────────────────────────┐
│  Response Processing             │
│  • Extract text                  │
│  • Save to NodeExecution         │
└──────────────────────────────────┘
```

### Authentication & Authorization Flow

```
User Request
     ↓
┌──────────────────────┐
│  Clerk Middleware    │
└──────────────────────┘
     ↓
┌──────────────────────┐
│  Valid Session?      │
└──────────────────────┘
     │
┌────┴────┐
│         │
YES       NO
│         │
│         └─────────────────────────┐
↓                                   ↓
┌──────────────────┐    ┌──────────────────┐
│  Get userId      │    │  Redirect to     │
└──────────────────┘    │  Sign In Page    │
     ↓                  └──────────────────┘
┌──────────────────────────┐
│  Workflow Access Check   │
│  (User owns workflow?)   │
└──────────────────────────┘
     │
┌────┴────┐
│         │
YES       NO
│         │
↓         ↓
┌────────────┐  ┌─────────────────┐
│   Allow    │  │  403 Forbidden  │
└────────────┘  └─────────────────┘
```

### Real-Time Polling Architecture

```
Frontend: Workflow Execution Started
        ↓
┌───────────────────────────────────┐
│  Start Polling Timer              │
│  (Interval: 1 second)             │
└───────────────────────────────────┘
        ↓
        │ (Loop every 1s)
        ↓
┌───────────────────────────────────┐
│  GET /api/workflows/[id]/run      │
│  ?runId=xxx                       │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│  Database Query                   │
│  • WorkflowRun by runId           │
│  • Include NodeExecutions         │
└───────────────────────────────────┘
        ↓
┌───────────────────────────────────┐
│  Check status === "COMPLETED"     │
└───────────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   │         └───────────────────────┐
   ↓                                 │
┌──────────────────┐                 │
│  Stop Polling    │                 │
│  Show Results    │                 │
│  Update UI       │                 │
└──────────────────┘                 │
                                     ↓
                        ┌──────────────────┐
                        │  Continue Polling│
                        │  (Wait 1s)       │
                        └──────────────────┘
                                     │
                                     └─────→ (Loop back)
```

### Key Components

#### Workflow Orchestrator (`src/trigger/orchestrator.ts`)
- **Dependency Resolution**: Build DAG from workflow nodes
- **Parallel Execution**: Execute independent nodes simultaneously
- **Wave-Based Processing**: Group nodes by dependency depth
- **Non-Executable Handling**: Skip text/image nodes, only execute LLM/processing nodes
- **User API Key Integration**: Fetch and pass user's Gemini API key

#### Task Definitions (`src/trigger/workflow-nodes.ts`)
- **aiGenerator**: Multi-modal Gemini API calls
  - Text + Image support
  - URL to base64 conversion
  - User/Server API key priority
- **cropImageTask**: Cloudinary image transformations
- **extractFrameTask**: Video frame extraction

#### State Management (`src/store/workflowStore.ts`)
- Zustand for global state
- Canvas node/edge management
- Undo/redo history
- Execution status tracking

### Workflow Execution Flow

#### 1. User Triggers Workflow

```typescript
// User clicks "RUN WORKFLOW"
POST /api/workflows/[id]/run
  ↓
1. Create WorkflowRun record (status: RUNNING)
2. Trigger "workflow-orchestrator" task
3. Return runId to frontend
```

#### 2. Trigger.dev Orchestration

```typescript
workflow-orchestrator task:
  ↓
1. Fetch WorkflowRun with user info
2. Extract userId for API key lookup
3. Build dependency graph from nodes/edges
4. Execute nodes in parallel waves:
   
   Wave 1: [Text Node A, Image Node B]  (no dependencies)
     → Skip (non-executable)
   
   Wave 2: [LLM Node C]  (depends on A, B)
     → Fetch user API key from database
     → Collect images from connected Image Nodes
     → Trigger "aiGenerator" task with:
         - prompt, systemPrompt, model, temperature
         - imageUrls array
         - user's API key (or server key as fallback)
     → Wait for completion
     → Save results to NodeExecution table
   
5. Mark WorkflowRun as COMPLETED
```

#### 3. Frontend Polling

```typescript
// Poll every 1 second
GET /api/workflows/[id]/run?runId=xxx
  ↓
1. Fetch WorkflowRun with NodeExecutions
2. Return status and execution results
3. Update UI when status === "COMPLETED"
```

### Project Structure

```
weavy-clone-main/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/
│   ├── readme/                 # Documentation images
│   └── demo/                   # Demo assets
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Landing pages
│   │   ├── api/                # API routes
│   │   │   ├── workflows/
│   │   │   ├── user/
│   │   │   ├── image/
│   │   │   └── video/
│   │   ├── workflows/          # Workflow pages
│   │   ├── settings/           # User settings
│   │   ├── share/              # Shared workflows
│   │   └── my-publishes/       # Published workflows
│   ├── components/             # React components
│   │   ├── workflow/           # Canvas components
│   │   │   ├── nodes/          # Custom node types
│   │   │   ├── edges/          # Custom edge types
│   │   │   └── ...
│   │   ├── marketing/          # Landing page components
│   │   └── providers/          # Context providers
│   ├── trigger/                # Trigger.dev tasks
│   │   ├── orchestrator.ts     # Main workflow engine
│   │   └── workflow-nodes.ts   # Task definitions
│   ├── lib/                    # Utilities
│   │   ├── db.ts               # Database client
│   │   ├── prisma.ts           # Prisma instance
│   │   └── utils.ts            # Helper functions
│   └── store/                  # State management
│       └── workflowStore.ts    # Zustand store
├── trigger.config.ts           # Trigger.dev configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies
```

---

## Database Schema

### Core Models

```prisma
model User {
  id         String    @id // Clerk user ID
  email      String    @unique
  workflows  Workflow[]
  apiKey     UserAPIKey?
  published  PublishedWorkflow[]
}

model Workflow {
  id        Int      @id @default(autoincrement())
  name      String
  data      Json     // React Flow graph (nodes + edges)
  userId    String
  user      User     @relation(fields: [userId])
  runs      WorkflowRun[]
}

model WorkflowRun {
  id            String   @id @default(uuid())
  workflowId    Int
  workflow      Workflow @relation(fields: [workflowId])
  status        String   // RUNNING, COMPLETED, FAILED
  triggerType   String   // MANUAL, SCHEDULED, API
  startedAt     DateTime
  finishedAt    DateTime?
  nodeExecutions NodeExecution[]
}

model NodeExecution {
  id          String   @id @default(uuid())
  runId       String
  run         WorkflowRun @relation(fields: [runId])
  nodeId      String
  nodeType    String
  status      String   // RUNNING, SUCCESS, FAILED
  inputData   Json
  outputData  Json?
  startedAt   DateTime
  finishedAt  DateTime?
  duration    Int?
}

model UserAPIKey {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId])
  geminiApiKey String
}
```

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name description

# View database in Prisma Studio
npx prisma studio
```

### Debugging Trigger.dev Tasks

1. Check Trigger.dev terminal logs
2. Look for execution traces:
```
[INFO] [ORCHESTRATOR] Task started
[INFO] [API KEY] Fetching API key for userId: user_xxx
[SUCCESS] [API KEY] Found user API key: AIzaSy...xyz
[INFO] [LLM xxx] Using USER's API key
```

3. Monitor task execution at https://cloud.trigger.dev

---

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git push origin main
```

2. **Import to Vercel**
- Go to https://vercel.com/new
- Import your repository
- Add environment variables
- Deploy

3. **Set up Trigger.dev Cloud**
```bash
npx trigger.dev@latest deploy
```

### Environment Variables for Production

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `TRIGGER_SECRET_KEY` - Trigger.dev API key
- `GEMINI_API_KEY` - Google Gemini API key (server fallback)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

---

## Roadmap

### Planned Features

- [ ] **Workflow Templates**: Pre-built templates for common use cases
- [ ] **Scheduled Execution**: Cron-based workflow triggers
- [ ] **Webhook Triggers**: External API integration
- [ ] **Conditional Logic**: If/else branches in workflows
- [ ] **Loop Nodes**: Iterate over arrays
- [ ] **Variable System**: Store and reuse values
- [ ] **Workflow Versioning**: Track and revert changes
- [ ] **Team Collaboration**: Share workflows with team members
- [ ] **API Rate Limiting**: Prevent abuse
- [ ] **Cost Tracking**: Monitor API usage and costs

### Future Integrations

- [ ] OpenAI GPT-4/GPT-4V support
- [ ] Anthropic Claude support
- [ ] Hugging Face models
- [ ] AWS Rekognition
- [ ] Azure Computer Vision
- [ ] Database connectors (MySQL, MongoDB, etc.)

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write clean, documented code
- Add tests for new features
- Update documentation
- Follow existing code style

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **Next.js Team**: For the amazing framework
- **Trigger.dev Team**: For serverless task orchestration
- **React Flow Team**: For the canvas library
- **Clerk Team**: For authentication
- **Google AI Team**: For Gemini API
- **Vercel Team**: For hosting and deployment

---

## Contact

**Shivam Yeshu**
- GitHub: [@shivamyeshu](https://github.com/shivamyeshu)
- Repository: [WeavyxGalaxy](https://github.com/shivamyeshu/WeavyxGalaxy)

---

<div align="center">

**Built with Next.js, TypeScript, and Trigger.dev**

Star this repository if you find it helpful!

</div>

# Test production build locally
npm start
```

### Deployment Platforms

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Docker**
```bash
# Build image
docker build -t weavy-workflow .

# Run container
docker run -p 3000:3000 weavy-workflow
```

### Environment Variables

Ensure all production environment variables are configured in your deployment platform:

- Authentication keys (Clerk)
- API keys (Gemini, Transloadit, Cloudinary)
- Database connection string
- Trigger.dev configuration

---

## Roadmap

### Planned Features

**Phase 1 - Enhanced Nodes**
- Video processing with frame extraction
- Database query nodes
- HTTP request nodes
- File system operations
- Email and SMS notifications

**Phase 2 - Execution Improvements**
- Parallel execution branches
- Conditional logic nodes
- Loop and iteration support
- Error handling and retry strategies
- Workflow debugging tools

**Phase 3 - Collaboration**
- Real-time multi-user editing
- Workflow versioning
- Commenting and annotations
- Team workspaces
- Workflow templates library

**Phase 4 - Enterprise Features**
- Role-based access control
- Audit logging
- Performance monitoring
- Custom integrations API
- Workflow analytics dashboard

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- Additional node types
- UI/UX improvements
- Performance optimizations
- Documentation enhancements
- Bug fixes and testing

### Code Style

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Weavy.ai for design inspiration
- Next.js team for the amazing framework
- React Flow for the canvas library
- All open-source contributors

---

## Contact

**Developer**: Shivam
**Location**: Delhi, India  
**GitHub**: [github.com/shivamyeshu](https://github.com/shivamyeshu)  
**LinkedIn**: [linkedin.com/in/shivam-yeshu](https://www.linkedin.com/in/shivam-yeshu)

For questions, issues, or feature requests, please open an issue on GitHub.

---

## Support

Need help?

- Check existing [GitHub Issues](https://github.com/shivamyeshu/WeavyxGalaxy/issues)
- Review inline code documentation
- Join discussions in the repository

---





