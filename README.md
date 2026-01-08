# GITNOTES // ZENITH CLOUD

> **A Supabase-powered, privacy-centric markdown knowledge base with Deep Space Industrial aesthetics.**

![Version](https://img.shields.io/badge/VERSION-3.1.0-FF4D00)
![Status](https://img.shields.io/badge/SYSTEM-ONLINE-00E676)
![Stack](https://img.shields.io/badge/REACT-19-white)
![Backend](https://img.shields.io/badge/SUPABASE-POSTGRES-white)

## 🪐 Overview

**GitNotes Zenith** is a high-fidelity personal knowledge base designed for long-term data survival. It rejects modern bloat in favor of raw speed, anonymity, and industrial utility. 

Unlike traditional note-taking apps, GitNotes uses a **"Secret Key"** mechanism. You generate a key on one device and enter it on another to establish a secure uplink. No emails, no passwords, no tracking.

## ⚡ Core Systems

### 1. Data Visualization (Activity Matrix)
*   **Thermal Grade Heatmap:** Visualize your writing frequency over the last year.
*   **Responsive Scaling:** The matrix automatically adjusts its time horizon based on your viewport (Desktop: 364 days, Mobile: ~120 days).
*   **Status Indicators:** Visual cues for system idle vs. active states.

### 2. Smart Editor Environment
*   **Split-View & Render:** Toggle between raw Markdown, split-pane, or pure preview.
*   **Backlinks (Linked Mentions):** Type `[[` to instantly link other notes. View all incoming references at the bottom of any document.
*   **Smart Paste:** Pasting HTML/Web content automatically converts it to clean Markdown (strips images/trackers).
*   **Toolbar:** Quick formatting tools for mobile and desktop.
*   **Mobile Optimized:** Truncated filenames and flexible layouts prevent UI clutter on small screens.

### 3. Cloud Synchronization (Uplink)
*   **Supabase Backend:** Real-time persistence via PostgreSQL.
*   **Manual Sync:** Force-pull data via the dashboard button to ensure cross-device consistency.
*   **Anonymous Auth:** Zero-knowledge identity via cryptographic keys.

### 4. Quick Capture Protocol
*   **Rapid Logging:** A dedicated accordion interface for dumping thoughts or code snippets without creating files manually.
*   **Auto-Filing:** Automatically creates repositories or files if specific targets aren't selected.

### 5. Keyboard Control
*   **Global Command:** Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to instantly search all modules and files.

---

## 🛠️ Installation & Setup

### 1. Supabase Configuration
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** and run the schema script below.
3. Retrieve your `Project URL` and `anon public key` from Project Settings > API.

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Database Schema (SQL)
Run this in your Supabase SQL Editor to initialize the system:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Repositories Table
create table repositories (
  id uuid default uuid_generate_v4() primary key,
  owner_id text not null,
  name text not null,
  description text,
  is_private boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  stars int default 0,
  language text default 'Markdown'
);

-- Files Table
create table files (
  id uuid default uuid_generate_v4() primary key,
  repo_id uuid references repositories(id) on delete cascade,
  owner_id text not null,
  name text not null,
  content text,
  language text default 'markdown',
  size int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexing for speed
create index idx_owner_repos on repositories(owner_id);
create index idx_repo_files on files(repo_id);
```

### 4. Run Locally

```bash
npm install
npm run dev
```

## 🚀 Deployment

GitNotes is a pure SPA (Single Page Application). You can deploy it to Vercel, Netlify, or any Nginx static server.

**Build Command:**
```bash
npm run build
```

**Output Directory:**
`dist`

## 🎨 Aesthetic Guidelines (Zenith)

*   **Palette:** Void Black (`#030303`), Zinc Surface (`#0F0F11`), International Orange (`#FF4D00`).
*   **Typography:** Inter (UI) + JetBrains Mono (Data/Code).
*   **Philosophy:** Tools should look like they belong in the cockpit of a spacecraft.

## 📜 License

**MIT License**. Designed by **WildSalt**.
Free to fork, modify, and deploy for your own personal knowledge base.

---
*End of Transmission // Zenith Systems*
