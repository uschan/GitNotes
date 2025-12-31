import { Repository } from './types';

export const INITIAL_REPOS: Repository[] = [
  {
    id: 'repo-1',
    name: 'personal-notes',
    description: 'My daily thoughts, todos, and random brain dumps.',
    isPrivate: true,
    updatedAt: new Date().toISOString(),
    stars: 1,
    language: 'Markdown',
    files: [
      {
        id: 'file-1-1',
        name: 'README.md',
        content: `# Personal Notes\n\nWelcome to my personal knowledge base. This is where I store everything.\n\n## Categories\n\n- Ideas\n- Todos\n- Journal\n\n> "The faintest ink is better than the best memory."`,
        updatedAt: new Date().toISOString(),
        language: 'markdown',
        size: 1024
      },
      {
        id: 'file-1-2',
        name: 'todo-list.md',
        content: `# Current Tasks\n\n- [x] Build the dashboard\n- [ ] Fix the markdown renderer\n- [ ] Add dark mode support\n\n## Shopping List\n* Milk\n* Eggs\n* Coffee beans`,
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        language: 'markdown',
        size: 512
      }
    ]
  },
  {
    id: 'repo-2',
    name: 'dev-snippets',
    description: 'Useful code snippets and configuration files.',
    isPrivate: false,
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    stars: 12,
    language: 'TypeScript',
    files: [
      {
        id: 'file-2-1',
        name: 'react-pattern.md',
        content: `# React Hook Pattern\n\nHere is a useful pattern for async data fetching:\n\n\`\`\`typescript\nconst useAsync = (asyncFn) => {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    asyncFn().then(setData).finally(() => setLoading(false));\n  }, [asyncFn]);\n\n  return { data, loading };\n};\n\`\`\``,
        updatedAt: new Date(Date.now() - 100000).toISOString(),
        language: 'markdown',
        size: 2048
      }
    ]
  },
  {
    id: 'repo-3',
    name: 'project-ideas',
    description: 'Million dollar ideas that I will definitely build someday.',
    isPrivate: true,
    updatedAt: new Date(Date.now() - 500000000).toISOString(),
    stars: 0,
    language: 'Markdown',
    files: [
        {
            id: 'file-3-1',
            name: 'app-idea.md',
            content: `# The Uber for Cats\n\nIt's like Uber, but for transporting cats.\n\n## Tech Stack\n\n1. React Native\n2. Node.js\n3. CatGPS API`,
            updatedAt: new Date().toISOString(),
            language: 'markdown',
            size: 300
        }
    ]
  }
];