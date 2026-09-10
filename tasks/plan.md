# Implementation Plan: short_bot

## Overview
`short_bot` is a local-first web application designed to help creators automatically generate and upload promotional YouTube Shorts. The application runs locally (`localhost`) and allows the user to:
1. Scan local assets (raw video recordings and screenshots of their website).
2. Write hook phrases (e.g., "Need to create a CV fast?").
3. Automatically render a professionally formatted, high-impact 9:16 YouTube Short using **Remotion** (incorporating the hook text, media sequence, zoom/pan transitions, and kinetic typography).
4. Review and play rendered drafts in a local web dashboard.
5. "Accept" or "Reject" drafts. If accepted, the video uploads automatically to YouTube via the official YouTube Data API v3.

## Architecture Decisions
- **Monorepo / Single Package Structure:** To keep the project extremely easy to run and manage locally, we will structure it as a unified Node.js project. We'll have a main backend (Express) and frontend (Vite + React) together or served from a single server.
- **Remotion Integration:** We will use `@remotion/cli` and `@remotion/renderer` to programmatically trigger renders from the Express backend using inputs. We'll pass inputs as standard JSON `--props`.
- **Database:** A lightweight local JSON file (`db.json`) to track:
  - YouTube OAuth credentials (encrypted or stored safely locally).
  - List of raw inputs (videos, captures).
  - Draft Shorts history, render status, YouTube upload status, and metadata.
- **YouTube OAuth 2.0:** A built-in authorization flow. The localhost server will host a callback endpoint `http://localhost:3000/api/youtube/callback` to dynamically receive credentials and save them locally.
- **UI Design:** A gorgeous, modern, dark-themed UI (Tailwind CSS) featuring rich video previews, draft queues, real-time rendering status, and settings.

## Folder Structure
```
short_bot/
├── assets/
│   ├── inputs/        # User places screenshots & web recordings here
│   └── outputs/       # Rendered mp4 files
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── db.ts      # Simple local JSON database
│   │   └── youtube.ts # YouTube Data API integration
│   └── db.json
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── remotion/          # Remotion video project
│   ├── src/
│   │   ├── Root.tsx
│   │   ├── ShortTemplate.tsx
│   │   └── composition/
│   └── remotion.config.ts
├── package.json       # Main orchestrator
└── tasks/
```

## Task List

### Phase 1: Foundation and Remotion Template
- [ ] **Task 1: Project Scaffolding**
  - Initialize the main directory, setup `package.json`, install shared dependencies (TypeScript, Express, Remotion, Vite, Tailwind CSS).
  - Create the `assets/inputs` and `assets/outputs` directories.
- [ ] **Task 2: High-Impact Remotion Template**
  - Create a 1080x1920 (9:16) composition template.
  - Implement hook typography animation (word-by-word kinetic scale animation).
  - Implement a sequencing system for raw images and video clips with panning/zooming effects and smooth fades.
  - Add a final call-to-action transition ("Check the link in bio!").

### Checkpoint 1: Visual Composition
- [ ] Remotion studio launches and renders a sample short preview with test images/videos.
- [ ] Manual test: Render a draft MP4 video via CLI to verify output format and styling.

### Phase 2: Localhost Express Backend & JSON DB
- [ ] **Task 3: Backend API and Media Scanner**
  - Implement Express server with endpoints to list assets inside `assets/inputs/`.
  - Implement `db.json` database management to keep track of generated videos and their state.
  - Create endpoint `POST /api/generate` that takes hook text + asset selection, triggers `npx remotion render` in a background child process, and writes the status in `db.json`.
- [ ] **Task 4: YouTube Data API v3 OAuth & Upload integration**
  - Implement OAuth redirect and callback URLs in the backend.
  - Save OAuth client details and user tokens locally.
  - Implement a robust upload script using `googleapis` that uploads an accepted MP4 to YouTube with shorts-compliant parameters (portrait, #shorts in description, title under 100 chars).

### Checkpoint 2: Headless Generation & Core Logic
- [ ] `POST /api/generate` successfully triggers a background Remotion render and saves a `.mp4` file in `assets/outputs`.
- [ ] YouTube authorization flow correctly redirects and saves credentials in local database.

### Phase 3: local UI Dashboard
- [ ] **Task 5: Frontend Layout & Asset Selector**
  - Build a dark-theme UI with modern sidebar (Dashboard, Queue, Assets, Settings).
  - Dashboard: form to write hook text and select assets with a visual multi-select layout.
- [ ] **Task 6: Queue & Action Buttons**
  - Implement the "Queue" tab showing generated drafts.
  - Support playing the rendered video directly from `assets/outputs/` using HTML5 video.
  - Add "Accept" and "Reject" buttons. "Accept" calls the backend to upload the video to YouTube.
- [ ] **Task 7: Setup and Configuration Page**
  - UI to input YouTube Client ID & Client Secret (and a helper guide on how to get them).
  - Button to start the Google Consent screen flow.
  - Connection status indicator.

### Checkpoint 3: End-to-End System
- [ ] Complete pipeline functions: Assets scanned -> Video generated -> Video previewed on localhost UI -> Video accepted -> Video uploaded to YouTube.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube API Quota Limits | Medium | YouTube API v3 allows 10,000 units/day. Each upload takes 1,600 units (approx. 6 uploads per day on free tier). We will log quota usage and warn the user. |
| Headless Puppeteer Issues | High | Rendering Remotion on headless systems can fail if Chromium lacks dependencies. We will configure Remotion CLI properly and verify execution environment with non-sandbox flag. |
| Large files & heavy rendering | Medium | Remotion renders can take 30s-2min. We will run them asynchronously with real-time SSE or polling status updates in the UI. |

## Open Questions
- None. Requirements are clear. Let's begin the implementation!
