import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNavigate } from 'react-router-dom';

interface MarkdownPreviewProps {
  content: string;
}

// Utility to generate IDs from heading text
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-') // Support Chinese characters & alphanumeric
    .replace(/(^-|-$)+/g, '');
};

// Utility to extract text from React children (recursively if needed)
const getNodeText = (node: any): string => {
  if (['string', 'number'].includes(typeof node)) return node;
  if (node instanceof Array) return node.map(getNodeText).join('');
  if (typeof node === 'object' && node?.props?.children) return getNodeText(node.props.children);
  return '';
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  const navigate = useNavigate();

  // Simple Frontmatter Parser
  let displayContent = content;
  let frontmatter: Record<string, string> | null = null;

  if (content.startsWith('---')) {
    const endMatch = content.indexOf('---', 3);
    if (endMatch !== -1) {
      const fmBlock = content.slice(3, endMatch);
      displayContent = content.slice(endMatch + 3).trim();
      
      frontmatter = {};
      fmBlock.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
          frontmatter![key.trim()] = values.join(':').trim();
        }
      });
    }
  }

  const HeaderRenderer = ({ level, children, ...props }: any) => {
    const text = getNodeText(children);
    const slug = generateSlug(text);
    const Tag = `h${level}` as React.ElementType;
    
    // Tailwind classes based on level
    let classes = "font-bold tracking-tight text-white scroll-mt-20"; // scroll-mt handles sticky header offset
    if (level === 1) classes += " text-3xl border-b border-zenith-border pb-4 mb-6 mt-8 first:mt-0";
    if (level === 2) classes += " text-2xl mt-8 mb-4 flex items-center gap-2 before:content-['#'] before:text-zenith-orange/50 before:font-mono before:text-lg";
    if (level === 3) classes += " text-xl font-semibold mt-6 mb-3";
    if (level === 4) classes += " text-lg font-semibold mt-6 mb-2";

    return React.createElement(Tag, { ...props, id: slug, className: classes }, children);
  };

  return (
    <div className="flex flex-col gap-6">
      {frontmatter && Object.keys(frontmatter).length > 0 && (
        <div className="bg-zenith-surface border border-zenith-border p-4 mb-4 font-mono text-xs">
          <div className="text-zenith-muted uppercase tracking-widest mb-2 border-b border-zenith-border pb-1">Metadata</div>
          <div className="grid grid-cols-[100px_1fr] gap-y-1">
            {Object.entries(frontmatter).map(([k, v]) => (
              <React.Fragment key={k}>
                <span className="text-zenith-orange">{k}</span>
                <span className="text-zenith-text break-all">{v}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none font-sans">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}: any) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <div className="bg-zenith-surface border border-zenith-border my-4 group relative">
                  <div className="bg-zenith-border/30 px-3 py-1 text-[10px] font-mono text-zenith-muted uppercase border-b border-zenith-border flex justify-between items-center">
                    <span>{match[1]}</span>
                  </div>
                  <SyntaxHighlighter
                    {...props}
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ background: 'transparent', padding: '1rem', fontSize: '0.875rem' }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-zenith-surface border border-zenith-border px-1.5 py-0.5 rounded-none text-xs font-mono text-zenith-orange break-words" {...props}>
                  {children}
                </code>
              )
            },
            h1: ({node, children, ...props}) => <HeaderRenderer level={1} children={children} {...props} />,
            h2: ({node, children, ...props}) => <HeaderRenderer level={2} children={children} {...props} />,
            h3: ({node, children, ...props}) => <HeaderRenderer level={3} children={children} {...props} />,
            h4: ({node, children, ...props}) => <HeaderRenderer level={4} children={children} {...props} />,
            p: ({node, ...props}) => <p className="text-zenith-text leading-7 mb-4" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-zenith-orange pl-4 bg-zenith-surface/30 py-2 pr-2 text-zenith-muted italic my-6" {...props} />,
            
            // Lists
            ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 my-4 space-y-2 marker:text-zenith-orange text-zenith-text" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 my-4 space-y-2 marker:text-zenith-orange text-zenith-text" {...props} />,
            li: ({node, ...props}) => <li className="pl-1" {...props} />,

            // Links & Formatting
            a: ({node, href, ...props}) => {
                const isInternal = href && href.startsWith('/');
                return (
                    <a 
                        className="text-zenith-orange hover:text-white underline decoration-zenith-orange/50 hover:decoration-white underline-offset-4 transition-colors cursor-pointer" 
                        href={href}
                        onClick={(e) => {
                            if (isInternal) {
                                e.preventDefault();
                                navigate(href);
                            }
                        }}
                        {...props} 
                    />
                );
            },
            hr: ({node, ...props}) => <hr className="border-zenith-border my-8" {...props} />,
            img: ({node, ...props}) => <img className="max-w-full border border-zenith-border my-6 bg-black/50" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            em: ({node, ...props}) => <em className="italic text-zenith-text/80" {...props} />,
            del: ({node, ...props}) => <del className="line-through text-zenith-muted" {...props} />,

            // Tables (GFM)
            table: ({node, ...props}) => (
              <div className="overflow-x-auto my-8 border border-zenith-border">
                <table className="w-full text-left border-collapse text-sm" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="bg-zenith-surface border-b border-zenith-border" {...props} />,
            tbody: ({node, ...props}) => <tbody className="divide-y divide-zenith-border bg-black/20" {...props} />,
            tr: ({node, ...props}) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
            th: ({node, ...props}) => <th className="p-3 font-mono text-xs font-bold uppercase tracking-wider text-zenith-muted select-none" {...props} />,
            td: ({node, ...props}) => <td className="p-3 text-zenith-text border-r border-zenith-border last:border-r-0 whitespace-nowrap md:whitespace-normal" {...props} />,
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownPreview;