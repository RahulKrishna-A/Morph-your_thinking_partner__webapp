# Morph — Your Thinking Partner

Morph is a voice-first AI thinking companion. You dump your thoughts as voice recordings, have a live conversation with an AI agent to refine them, and receive a structured voice memo plan back.

> **Backend coming soon** — The backend repository (Firebase Cloud Functions, agent orchestration, research pipeline) will be open-sourced soon.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND (this repo)                           │
│                        Next.js 16 · React 19 · TypeScript                     │
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐   │
│  │   /login     │     │   / (home)   │     │         Components           │   │
│  │  Google      │     │  Chat Shell  │     │  ChatHeader · ChatView       │   │
│  │  OAuth       │ ──▶ │  Recording   │     │  ChatInputBar · Sidebar      │   │
│  │  + Name      │     │  Agent Call  │     │  NoCreditsModal · Orb        │   │
│  └──────────────┘     └──────┬───────┘     └──────────────────────────────┘   │
│                              │                                               │
│        ┌─────────────────────┼─────────────────────┐                         │
│        ▼                     ▼                     ▼                         │
│   ┌──────────────┐   ┌──────────────┐   ┌────────────────┐                  │
│   │ use-sessions │   │ use-recording│   │ use-agent-call │                  │
│   └──────┬───────┘   └──────────────┘   └──────┬─────────┘                  │
│          │                                    │                            │
└──────────┼────────────────────────────────────┼────────────────────────────┘
           │                                    │
           ▼                                    ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────────┐
│       Firebase Services      │   │        Google Cloud Function             │
│                              │   │            (onAgentCall)                 │
│  • Auth (Google)             │   │                                          │
│  • Firestore                 │   │  Returns:                                │
│    – User/{uid}              │   │   • conversationToken                    │
│    – User/{uid}/Sessions/{id}│   │   • agentContext (for ElevenLabs)        │
│    – CreditRequests          │   └───────────────┬──────────────────────────┘
│  • Storage                   │                   │
│    – audio/{uid}/{sessionId} │                   ▼
│      /dump.webm              │   ┌──────────────────────────────────────────┐
└──────────────────────────────┘   │         ElevenLabs WebRTC                │
                                   │     Live voice conversation with AI      │
                                   │                agent + Firecrawl search  │
                                   └──────────────────────────────────────────┘
```

---

## How It Works

### 1. Authentication

Users sign in with **Google OAuth** via Firebase Auth. On first sign-in, they're prompted to enter their name and receive **1 free credit**.

### 2. Session Lifecycle

Each thinking session follows this flow:

| Step | What happens | Where |
|------|-------------|-------|
| **Create** | A UUID is generated client-side and persisted in `localStorage` | `use-sessions.ts` |
| **Record** | Browser `MediaRecorder` captures audio as WebM | `use-recording.ts` |
| **Submit** | Audio uploads to Firebase Storage, session doc created in Firestore with `status: "recording_submitted"`, 1 credit deducted | `use-sessions.ts` |
| **Process** | Backend pipeline transcribes, processes, and prepares the call | Backend (external) |
| **Call** | Client calls Cloud Function → gets ElevenLabs token → WebRTC voice session starts | `use-agent-call.ts` |
| **Research** | Backend researches and builds the plan | Backend (external) |
| **Voice Memo** | Backend generates a synthesized voice memo, writes `vmUrl` to session doc | Backend (external) |
| **Complete** | Session marked `completed`, VM audio appears in chat | Firestore listener |

Session status is driven entirely by Firestore document updates. The frontend subscribes via `onSnapshot` and maps status strings to UI states.

### 3. Credits System

| Event | Credits |
|-------|---------|
| New user sign-up | +1 |
| Recording submitted (first message per session) | -1 |
| Credits reach 0 | Modal blocks new sessions/recordings, shows request form |

Credit requests (email, message, optional X handle) are saved to a `CreditRequests` Firestore collection.

### 4. AI Agent Call (ElevenLabs)

1. Client POSTs `{ sessionId, userId }` to a **Google Cloud Function** (`onAgentCall`)
2. Function returns `conversationToken` + `agentContext`
3. `@elevenlabs/react` `useConversation` opens a **WebRTC** session with dynamic variables
4. Real-time voice interaction happens directly between the browser and ElevenLabs
5. On disconnect or session completion, the call ends and the backend pipeline continues

### 5. Real-time UI

The 3D **Orb** (Three.js via `@react-three/fiber`) reflects the current agent state:

- **Thinking** — processing / transcribing / researching
- **Listening** — agent is listening to the user
- **Talking** — agent is speaking

All state transitions are reactive via Firestore `onSnapshot` listeners.

---

## Project Structure

```
morph-your_thinking_partner__webapp/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── globals.css         # Tailwind v4 theme, dark tokens, animations
│   ├── page.tsx            # Main chat/home (auth gate, session + call orchestration)
│   └── login/
│       └── page.tsx        # Google sign-in + name onboarding
├── components/
│   ├── chat-header.tsx     # Top bar: menu, status pill, brand, credits, user menu
│   ├── chat-view.tsx       # Scrollable conversation with messages + orb
│   ├── chat-input-bar.tsx  # Record / submit / call controls
│   ├── app-sidebar.tsx     # Session history sidebar (Sheet)
│   ├── empty-state.tsx     # Empty chat landing
│   ├── no-credits-modal.tsx# Credit exhaustion modal with request form
│   └── ui/                 # Design system primitives
│       ├── orb.tsx         # 3D animated orb (Three.js)
│       ├── button.tsx      # Button variants (CVA)
│       ├── sheet.tsx       # Side panel (Base UI Dialog)
│       ├── audio-player.tsx
│       ├── live-waveform.tsx
│       ├── voice-button.tsx
│       ├── avatar.tsx
│       ├── dropdown-menu.tsx
│       ├── scroll-area.tsx
│       └── ...             # badge, separator, tooltip, skeleton, etc.
├── hooks/
│   ├── use-sessions.ts     # Firestore sessions + Storage upload + credit deduction
│   ├── use-recording.ts    # Browser MediaRecorder (WebM)
│   └── use-agent-call.ts   # Cloud Function + ElevenLabs WebRTC
├── lib/
│   ├── firebase.ts         # Firebase init (Auth, Firestore, Storage)
│   ├── types.ts            # Shared TypeScript types
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── public/                 # Static assets
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json         # shadcn/ui configuration
└── .gitignore
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui (base-nova), CSS variables |
| **Fonts** | Geist Sans, Geist Mono, Playfair Display, Caveat |
| **3D** | Three.js, @react-three/fiber, @react-three/drei |
| **Auth & Data** | Firebase Auth (Google), Cloud Firestore, Firebase Storage |
| **Voice Agent** | @elevenlabs/react (WebRTC), Google Cloud Functions |
| **Animations** | Motion, tw-animate-css, custom keyframes |
| **Markdown** | Streamdown (streaming markdown rendering) |
| **Icons** | Lucide React |

---

## Firestore Data Model

```
User/{uid}
  ├── name: string
  ├── credits: number
  └── Sessions/{sessionId}
        ├── sessionId: string
        ├── status: string          # recording_submitted → transcribing → processing →
        │                           # ready_for_call → in_call → processing_research →
        │                           # building_vm → completed
        ├── dumpAudioUrl: string    # Firebase Storage URL
        ├── vmUrl: string           # Generated voice memo URL
        ├── createdAt: timestamp
        └── updatedAt: timestamp

CreditRequests/{autoId}
  ├── userId: string
  ├── userName: string
  ├── email: string
  ├── message: string
  ├── xHandle: string | null
  └── createdAt: timestamp
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Auth, Firestore, and Storage enabled
- Google OAuth configured in Firebase Auth

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

---

## Deployment

The app is deployable to **Vercel** (recommended), **Firebase Hosting**, or any Node.js hosting platform. Ensure all `NEXT_PUBLIC_FIREBASE_*` environment variables are set in your hosting provider's dashboard.

---

## Backend (Open Sourcing Soon)

The backend powering Morph includes:

- **Firebase Cloud Functions** — Agent orchestration, transcription triggers, research pipeline
- **ElevenLabs Agent Configuration** — Voice agent setup and context management
- **Voice Memo Generation** — Synthesized audio plan creation

The backend repository will be **open-sourced soon**. Stay tuned.

---

## License

This project is private. License details will be added when the backend is open-sourced.
