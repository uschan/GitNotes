# GITNOTES // ZENITH CLOUD

> **A Supabase-powered, privacy-centric markdown knowledge base with Deep Space Industrial aesthetics.**

![Version](https://img.shields.io/badge/VERSION-3.1.0-FF4D00?style=for-the-badge&logo=git&logoColor=white&labelColor=000)
![Stack](https://img.shields.io/badge/REACT_19-VITE-00E676?style=for-the-badge&logo=react&logoColor=black&labelColor=white)
![Deploy](https://img.shields.io/badge/DEPLOY-VERCEL-white?style=for-the-badge&logo=vercel&logoColor=black)

## 🪐 Overview

**GitNotes Zenith** is a high-fidelity personal knowledge base designed for long-term data survival. It rejects modern bloat in favor of raw speed, anonymity, and industrial utility. 

It is built on the **JAMstack** architecture. It requires **no VPS**, **no docker containers**, and **zero maintenance**. 

## ⚡ Core Systems

### 1. Data Visualization (Activity Matrix)
*   **Thermal Grade Heatmap:** Visualize your writing frequency over the last year.
*   **Pixel Art Mode:** "Hack" your timeline by drawing custom patterns (like 'CHINA' or 'Invaders') directly onto your contribution graph.
*   **Responsive Scaling:** The matrix automatically adjusts its time horizon.

### 2. Smart Editor Environment
*   **Split-View & Render:** Toggle between raw Markdown, split-pane, or pure preview.
*   **Backlinks (Linked Mentions):** Type `[[` to instantly link other notes.
*   **Smart Paste:** Pasting HTML/Web content automatically converts it to clean Markdown.
*   **Zenith UI:** A custom "Void Black" & "International Orange" theme engine with switchable "Matrix Green" and "Holo Blue" modes.

### 3. Cloud Synchronization (Uplink)
*   **Supabase Backend:** Real-time persistence via PostgreSQL.
*   **Anonymous Auth:** Zero-knowledge identity via cryptographic keys.

---

## 🚀 Zero-Cost Deployment Protocol

You can deploy your own private instance of GitNotes for **$0/month** using Vercel (or Netlify) and Supabase.

### Phase 1: The Backend (Supabase)
1.  Create a free account at [supabase.com](https://supabase.com).
2.  Create a new project.
3.  Go to the **SQL Editor** (sidebar) and paste the following schema to initialize your database:

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

-- Indexes
create index idx_owner_repos on repositories(owner_id);
create index idx_repo_files on files(repo_id);
```

4.  Go to **Project Settings > API**. Copy your `Project URL` and `anon public key`.

### Phase 2: The Frontend (Vercel)
1.  Fork this repository to your GitHub.
2.  Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3.  Import your forked GitNotes repository.
4.  In the "Environment Variables" section, add:
    *   `VITE_SUPABASE_URL`: (Your Supabase Project URL)
    *   `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
5.  Click **Deploy**.

**Mission Complete.** Your private knowledge base is now live on the edge network.

---

## 🛠️ Local Development

```bash
npm install
npm run dev
```

## 🎨 Aesthetic Guidelines

*   **Palette:** Void Black (`#030303`), Zinc Surface (`#0F0F11`), International Orange (`#FF4D00`).
*   **Typography:** Inter (UI) + JetBrains Mono (Data/Code).
*   **Philosophy:** Tools should look like they belong in the cockpit of a spacecraft.

## 📜 License

**MIT License**. Designed by **WildSalt**.
Free to fork, modify, and deploy for your own personal knowledge base.

---
*End of Transmission // Zenith Systems*