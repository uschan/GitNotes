
import { Repository } from './types';

export const INITIAL_REPOS: Repository[] = [
  {
    id: 'repo-1',
    name: 'nexus-prime',
    description: 'Central operations hub. Contains complex graph structures with crossing dependencies.',
    isPrivate: true,
    updatedAt: new Date().toISOString(),
    stars: 88,
    language: 'Markdown',
    files: [
      {
        id: 'file-1-1',
        name: 'README.md',
        content: `# NEXUS PRIME\n\nEntry point for the Knowledge Graph.\n\n## Core Sectors\n\n1. [[01-Project-Mars]] - Planetary Colonization\n2. [[02-AI-Research]] - Neural Networks\n3. [[03-Poetry-Collection]] - Arts & Culture (Independent)\n\n> "Structure is the enemy of entropy."`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 1024
      },
      
      // --- THEME A: PROJECT MARS (Cluster 1) ---
      {
        id: 'file-1-2',
        name: '01-Project-Mars.md',
        content: `# Project Mars\n\nObjective: Terraforming and colonization.\n\n### Modules\n- [[Life-Support-Systems]]\n- [[Rocket-Propulsion-v9]]\n- [[Rover-Logistics]]\n\nStatus: ACTIVE`,
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        language: 'markdown',
        size: 800
      },
      {
        id: 'file-1-3',
        name: 'Life-Support-Systems.md',
        content: `# Oxygen Generation\n\nCritical path for [[01-Project-Mars]].\nRequires: [[Water-Filtration]].`,
        updatedAt: new Date(Date.now() - 200000).toISOString(),
        language: 'markdown',
        size: 400
      },
      {
        id: 'file-1-4',
        name: 'Rocket-Propulsion-v9.md',
        content: `# Heavy Lift Vehicle\n\nEngine specs for the interplanetary transport.\nParent: [[01-Project-Mars]]`,
        updatedAt: new Date(Date.now() - 300000).toISOString(),
        language: 'markdown',
        size: 500
      },

      // --- THEME B: AI RESEARCH (Cluster 2) ---
      {
        id: 'file-1-5',
        name: '02-AI-Research.md',
        content: `# Artificial Intelligence Lab\n\nFocus: AGI and Computer Vision.\n\n### Active Experiments\n- [[Neural-Networks-Deep]]\n- [[Computer-Vision-API]]\n- [[Ethical-Constraints]]`,
        updatedAt: new Date(Date.now() - 150000).toISOString(),
        language: 'markdown',
        size: 750
      },
      {
        id: 'file-1-6',
        name: 'Neural-Networks-Deep.md',
        content: `# Deep Learning Models\n\nTransformer architectures.\nParent: [[02-AI-Research]]`,
        updatedAt: new Date(Date.now() - 250000).toISOString(),
        language: 'markdown',
        size: 600
      },
      
      // --- THE CROSS-OVER (The "Clerk" connecting Mars and AI) ---
      {
        id: 'file-1-7',
        name: 'Autonomous-Drones.md',
        content: `# Autonomous Survey Drones\n\n**The Intersection Point**\n\nThese drones are used by [[01-Project-Mars]] for surface mapping.\n\nHowever, they run on software developed in [[02-AI-Research]] (specifically [[Computer-Vision-API]]).\n\nThis node should physically pull the two clusters together.`,
        updatedAt: new Date(Date.now() - 50000).toISOString(),
        language: 'markdown',
        size: 1200
      },
      {
        id: 'file-1-8',
        name: 'Computer-Vision-API.md',
        content: `# Vision Systems\n\nObject detection algorithms.\n\nUsed by: [[Autonomous-Drones]]\nParent: [[02-AI-Research]]`,
        updatedAt: new Date(Date.now() - 60000).toISOString(),
        language: 'markdown',
        size: 500
      },

      // --- THEME C: POETRY COLLECTION (Cluster 3 - Completely Isolated) ---
      {
        id: 'file-1-9',
        name: '03-Poetry-Collection.md',
        content: `# The Quiet Corner\n\nA collection of distinct thoughts, unconnected to the tech stack.\n\n- [[Haiku-01]]\n- [[Haiku-02]]`,
        updatedAt: new Date(Date.now() - 800000).toISOString(),
        language: 'markdown',
        size: 300
      },
      {
        id: 'file-1-10',
        name: 'Haiku-01.md',
        content: `# Winter\n\nCode flows like water\nBugs freeze in the winter ice\nDeploy on Friday`,
        updatedAt: new Date(Date.now() - 810000).toISOString(),
        language: 'markdown',
        size: 100
      },
      {
        id: 'file-1-11',
        name: 'Haiku-02.md',
        content: `# Server Room\n\nBlinking lights in dark\nFans humming a quiet song\nData sleeps inside`,
        updatedAt: new Date(Date.now() - 820000).toISOString(),
        language: 'markdown',
        size: 100
      },
      
      // --- ORPHAN (Testing Edge Case) ---
      {
        id: 'file-1-12',
        name: 'Lost-Note.md',
        content: `I am floating in the void. No one links to me, and I link to no one.`,
        updatedAt: new Date(Date.now() - 900000).toISOString(),
        language: 'markdown',
        size: 50
      }
    ]
  },
  {
    id: 'repo-2',
    name: 'black-ops-log',
    description: 'Classified operations. Testing linear chains.',
    isPrivate: true,
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    stars: 12,
    language: 'Text',
    files: [
      {
        id: 'file-2-1',
        name: 'Mission-Alpha.md',
        content: `Start point. Goes to [[Mission-Beta]].`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 100
      },
      {
        id: 'file-2-2',
        name: 'Mission-Beta.md',
        content: `Mid point. Goes to [[Mission-Gamma]].`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 100
      },
      {
        id: 'file-2-3',
        name: 'Mission-Gamma.md',
        content: `End point. Refers back to [[Mission-Alpha]]. (Loop Test)`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 100
      }
    ]
  },
  {
    id: 'repo-3',
    name: 'library-interlink-test',
    description: 'Testing references to other repositories.',
    isPrivate: false,
    updatedAt: new Date(Date.now() - 500000).toISOString(),
    stars: 5,
    language: 'Markdown',
    files: [
        {
            id: 'file-3-1',
            name: 'External-Ref.md',
            content: `# Cross-Repo Reference\n\nThis note references a file in another repo conceptually:\n\nSee [[01-Project-Mars]] in Nexus Prime.`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 200
        }
    ]
  }
];
