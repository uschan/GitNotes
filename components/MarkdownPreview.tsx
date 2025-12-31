import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <div className="prose prose-invert prose-sm max-w-none font-sans">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="bg-zenith-surface border border-zenith-border my-4">
                <div className="bg-zenith-border/30 px-3 py-1 text-[10px] font-mono text-zenith-muted uppercase border-b border-zenith-border">
                  {match[1]}
                </div>
                <div className="p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-zenith-text" {...props}>
                    {children}
                    </code>
                </div>
              </div>
            ) : (
              <code className="bg-zenith-surface border border-zenith-border px-1.5 py-0.5 rounded-none text-xs font-mono text-zenith-orange" {...props}>
                {children}
              </code>
            )
          },
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold tracking-tight text-white border-b border-zenith-border pb-2 mb-4 mt-6" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold tracking-tight text-white mt-6 mb-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mt-5 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="text-zenith-text leading-relaxed mb-4" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-zenith-orange pl-4 text-zenith-muted italic my-4" {...props} />,
          ul: ({node, ...props}) => <ul className="list-square list-inside my-4 space-y-1 marker:text-zenith-orange" {...props} />,
          a: ({node, ...props}) => <a className="text-zenith-orange hover:underline cursor-pointer" {...props} />,
          hr: ({node, ...props}) => <hr className="border-zenith-border my-6" {...props} />,
          img: ({node, ...props}) => <img className="max-w-full border border-zenith-border my-4 grayscale hover:grayscale-0 transition-all duration-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownPreview;