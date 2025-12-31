# GITNOTES // ZENITH PROTOCOL

> **A storage-first, privacy-centric markdown knowledge base with Deep Space Industrial aesthetics.**

![License](https://img.shields.io/badge/license-MIT-orange)
![Version](https://img.shields.io/badge/version-2.6.0-white)
![Status](https://img.shields.io/badge/system-OPERATIONAL-green)

## 🪐 Overview

GitNotes is a standalone, client-side Single Page Application (SPA) designed for personal document management. It mimics a GitHub-like repository structure but operates entirely within your browser's local environment using a "Zenith" industrial sci-fi UI design language.

**Key Features:**
*   **Local-First Architecture:** All data is stored in the browser's `localStorage`. No database required.
*   **Data Sovereignty:** Built-in Backup (JSON Export) and Restore functionality to prevent data loss.
*   **Command Interface:** Global `Cmd+K` / `Ctrl+K` command palette for instant file and repository navigation.
*   **Dual-Mode Access:**
    *   **Visitor Mode:** Read-only access to public repositories.
    *   **Admin Mode:** Full create/edit/delete capabilities (Password protected).
*   **Advanced Editor:** 
    *   Split-View (Write/Preview)
    *   Syntax Highlighting (Prism)
    *   GFM Tables & Frontmatter support
    *   Quick Format Toolbar
*   **PWA Ready:** Installable as a native-like app on desktop and mobile.

## 🛠️ Tech Stack

*   **Core:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS (Custom Zenith Config)
*   **Icons:** Lucide React
*   **Routing:** React Router DOM v7
*   **Markdown:** React Markdown + Remark GFM + Syntax Highlighter

## 🚀 Deployment (VPS Guide)

Since GitNotes is a static site, you don't need Node.js running continuously on your server. You only need a web server (like Nginx, Apache, or Caddy) to serve the HTML/JS/CSS files.

### 1. Build the Artifacts
On your local machine (or CI/CD pipeline):

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

This will generate a `dist/` folder containing your static site.

### 2. Configure Authentication (IMPORTANT)
Before building, open `src/App.tsx` and change the default admin password:

```typescript
// App.tsx
const ADMIN_PASSWORD = 'YOUR_SECURE_PASSWORD_HERE';
```
*Note: Since this is a client-side app, the password logic exists in the browser bundle. It is designed as a "privacy lock" against casual visitors, not military-grade encryption.*

### 3. Nginx Configuration (Example)
Upload the contents of the `dist/` folder to your VPS (e.g., `/var/www/gitnotes`).

Add this configuration to your Nginx sites-enabled:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/gitnotes;
    index index.html;

    # Handle SPA Routing (Redirect all 404s to index.html)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

## 💾 Data Persistence

**Where is my data?**
Your data lives in your browser's `localStorage` under the key `gitnotes_data_v1`.

**Limitations & Safety:**
*   **Storage Limit:** Browsers typically limit LocalStorage to ~5MB. The "Maintenance" modal tracks usage.
*   **Browser Cache:** If you "Clear Site Data", your notes will be erased.
*   **Backup:** **CRITICAL.** Use the "Maintenance" -> "Export Backup" feature frequently to save your data to a JSON file.

## 📜 License

Designed by **WildSalt**.
Licensed under MIT.

---
*End of Transmission // Zenith Systems*