# GITNOTES // ZENITH CLOUD

> **A Supabase-powered, privacy-centric markdown knowledge base with Deep Space Industrial aesthetics.**

![License](https://img.shields.io/badge/license-MIT-orange)
![Version](https://img.shields.io/badge/version-3.0.0-white)
![Status](https://img.shields.io/badge/system-CLOUD_SYNCED-green)

## 🪐 Overview

GitNotes 3.0 transforms from a local storage app to a cloud-synced productivity tool. It uses a **"Secret Key"** mechanism to identify users, allowing for instant, anonymous, cross-device synchronization without traditional email/password registration.

**Key Features:**
*   **Supabase Backend:** Real-time data persistence via PostgreSQL.
*   **Secret Key Auth:** Generate a key on one device, paste it on another to sync. No email required.
*   **Quick Capture:** Dedicated interface for rapidly logging thoughts, code snippets, and journal entries.
*   **Command Interface:** Global `Cmd+K` / `Ctrl+K` command palette.
*   **Advanced Editor:** Split-View, Syntax Highlighting, Toolbar.

## 🛠️ Setup Guide

### 1. Supabase Configuration
1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL script found in `sql/schema.sql` (or see below) in your Supabase SQL Editor.
3. Get your `Project URL` and `anon key` from API Settings.

### 2. Environment Variables
Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Schema
Run this in Supabase SQL Editor:

```sql
create extension if not exists "uuid-ossp";

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
```

### 4. Run Locally

```bash
npm install
npm run dev
```

## 📜 License

Designed by **WildSalt**.
Licensed under MIT.

---
*End of Transmission // Zenith Systems*