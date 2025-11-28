import React from 'react';
import ReactMarkdown from 'react-markdown';

export const MarkdownText: React.FC<{ content: string }> = ({ content }) => {
  return (
    <ReactMarkdown
      components={{
        strong: ({node, ...props}) => <span className="font-bold text-indigo-200" {...props} />,
        em: ({node, ...props}) => <span className="italic text-gray-300" {...props} />,
        p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed text-lg" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};