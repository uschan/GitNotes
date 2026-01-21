import { Repository } from './types';

export const INITIAL_REPOS: Repository[] = [
  {
    id: 'repo-1',
    name: 'neural-archive',
    description: 'Central knowledge hub. Connected thoughts and second brain storage.',
    isPrivate: true,
    updatedAt: new Date().toISOString(),
    stars: 42,
    language: 'Markdown',
    files: [
      {
        id: 'file-1-1',
        name: 'README.md',
        content: `# NEURAL ARCHIVE v2.0\n\nEntry point for external memory storage.\n\n## Core Sectors\n\n- [[01-Philosophy]]: Mental models and core beliefs.\n- [[02-Technology]]: Stack definitions and research.\n- [[03-Journal]]: Daily data dumps.\n\n> "The map is not the territory."`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 1024
      },
      {
        id: 'file-1-2',
        name: '01-Philosophy.md',
        content: `# Philosophy & Mental Models\n\nCore operating principles.\n\n### Concepts\n- [[Stoicism-Applied]]: Practical handbook.\n- [[Digital-Minimalism]]: Reducing signal noise.\n\nReturn to [[README]]`,
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        language: 'markdown',
        size: 512
      },
      {
        id: 'file-1-3',
        name: '02-Technology.md',
        content: `# Tech Radar\n\nCurrent focus areas for Q3.\n\n## Active Research\n- [[React-Server-Components]]: The future of frontend.\n- [[Supabase-Architecture]]: Backend as a service.\n- [[Rust-Lang]]: Systems programming.\n\n## Legacy\n- [[jQuery-Patterns]] (Deprecated)\n\nReturn to [[README]]`,
        updatedAt: new Date(Date.now() - 200000).toISOString(),
        language: 'markdown',
        size: 800
      },
      {
        id: 'file-1-4',
        name: 'React-Server-Components.md',
        content: `# RSC Analysis\n\nServer components allow for zero-bundle-size rendering.\n\nSee also: [[Supabase-Architecture]] for data fetching patterns.\nParent: [[02-Technology]]`,
        updatedAt: new Date(Date.now() - 300000).toISOString(),
        language: 'markdown',
        size: 600
      },
      {
        id: 'file-1-5',
        name: 'Supabase-Architecture.md',
        content: `# Supabase Structure\n\nUtilizing Postgres RLS for security.\n\nIntegrates well with: [[React-Server-Components]].\nParent: [[02-Technology]]`,
        updatedAt: new Date(Date.now() - 400000).toISOString(),
        language: 'markdown',
        size: 450
      },
      {
        id: 'file-1-6',
        name: 'Stoicism-Applied.md',
        content: `# The Obstacle is the Way\n\nFocus on what you can control.\n\nRelated: [[Digital-Minimalism]]\nParent: [[01-Philosophy]]`,
        updatedAt: new Date(Date.now() - 500000).toISOString(),
        language: 'markdown',
        size: 300
      },
      {
        id: 'file-1-7',
        name: 'Digital-Minimalism.md',
        content: `# Digital Declutter\n\n30 day protocol.\n\nSee: [[Stoicism-Applied]]\nParent: [[01-Philosophy]]`,
        updatedAt: new Date(Date.now() - 600000).toISOString(),
        language: 'markdown',
        size: 300
      }
    ]
  },
  {
    id: 'repo-2',
    name: 'titan-protocol',
    description: 'System architecture for Project Titan. Confidential.',
    isPrivate: true,
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    stars: 128,
    language: 'TypeScript',
    files: [
      {
        id: 'file-2-1',
        name: 'SYSTEM_CORE.md',
        content: `# PROJECT TITAN // CORE\n\nSystem Entry Point.\n\n## Modules\n\n1. [[AUTH_MODULE]]: User identity & access control.\n2. [[PAYMENT_GATEWAY]]: Stripe integration logic.\n3. [[DATA_PIPELINE]]: ETL processes.\n\nStatus: ACTIVE`,
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        language: 'markdown',
        size: 2048
      },
      {
        id: 'file-2-2',
        name: 'AUTH_MODULE.md',
        content: `# Authentication Module\n\nHandles JWT issuance and rotation.\n\nDependencies:\n- [[USER_SCHEMA]]\n- [[SESSION_STORE]]\n\nUpstream: [[SYSTEM_CORE]]`,
        updatedAt: new Date(Date.now() - 200000).toISOString(),
        language: 'markdown',
        size: 1024
      },
      {
        id: 'file-2-3',
        name: 'PAYMENT_GATEWAY.md',
        content: `# Payment Processing\n\nHandles subscriptions.\n\nRequires: [[USER_SCHEMA]] for billing details.\nUpstream: [[SYSTEM_CORE]]`,
        updatedAt: new Date(Date.now() - 300000).toISOString(),
        language: 'markdown',
        size: 1024
      },
      {
        id: 'file-2-4',
        name: 'USER_SCHEMA.md',
        content: `# Database Schema: Users\n\nDefines user table structure.\n\nReferenced by: [[AUTH_MODULE]] and [[PAYMENT_GATEWAY]].`,
        updatedAt: new Date(Date.now() - 400000).toISOString(),
        language: 'sql',
        size: 1024
      },
      {
         id: 'file-2-5',
         name: 'SESSION_STORE.md',
         content: `# Redis Session Store\n\nTTL configuration for user sessions.\n\nPart of: [[AUTH_MODULE]]`,
         updatedAt: new Date(Date.now() - 500000).toISOString(),
         language: 'markdown',
         size: 500
      }
    ]
  },
  {
    id: 'repo-3',
    name: 'black-ops-log',
    description: 'Scattered thoughts, fragments, and unstable data.',
    isPrivate: true,
    updatedAt: new Date(Date.now() - 500000000).toISOString(),
    stars: 0,
    language: 'Text',
    files: [
        {
            id: 'file-3-1',
            name: 'fragment-01.md',
            content: `Signal detected on channel 4.\n\nSeems related to [[fragment-03]].`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 100
        },
        {
            id: 'file-3-2',
            name: 'fragment-02.md',
            content: `Encryption key missing.\n\nCheck [[fragment-01]] for headers.\nPossible link to [[fragment-04]].`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 120
        },
        {
            id: 'file-3-3',
            name: 'fragment-03.md',
            content: `Decoding...\n\nData corrupted. See [[fragment-02]].`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 80
        },
        {
            id: 'file-3-4',
            name: 'fragment-04.md',
            content: `The loop is closed.\n\n[[fragment-01]] -> [[fragment-02]] -> [[fragment-03]] -> [[fragment-04]].`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 150
        }
    ]
  }
];