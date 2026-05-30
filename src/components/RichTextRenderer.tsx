import React from 'react';

interface RichTextRendererProps {
  text: string;
  fontSizeClass?: string;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ 
  text, 
  fontSizeClass = "text-sm sm:text-base" 
}) => {
  if (!text) return null;

  // Split content by lines
  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let currentListItems: React.ReactNode[] = [];
  let isInsideCodeBlock = false;
  let codeBlockLines: string[] = [];

  // Parse inline elements (bold, math formula, inline code code)
  const parseInlineStyles = (lineText: string): React.ReactNode[] => {
    // Regex matches:
    // 1. **bold** -> \*\*[^*]+\*\*
    // 2. `inline code` -> `[^`]+`
    // 3. $math$ -> \$[^$]+\$
    const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g;
    const parts = lineText.split(regex);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong 
            key={index} 
            className="font-bold text-slate-900 bg-slate-100/70 px-1 py-0.5 rounded border border-slate-200/40"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code 
            key={index} 
            className="font-mono text-xs text-rose-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        const mathContent = part.slice(1, -1);
        return (
          <span 
            key={index} 
            className="font-mono text-[13px] sm:text-[14px] font-semibold italic text-blue-600 bg-blue-50/50 px-1 py-0.5 rounded border border-blue-100/30 mx-0.5"
          >
            {mathContent}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1.5 text-slate-600">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  const flushCodeBlock = (key: string | number) => {
    if (codeBlockLines.length > 0) {
      renderedElements.push(
        <div key={`pre-container-${key}`} className="my-3 rounded-xl overflow-hidden border border-slate-200">
          <div className="bg-slate-900 text-[10px] text-slate-400 font-mono px-4 py-1.5 flex justify-between items-center select-none border-b border-slate-800">
            <span>Shell Output / Code Snippet</span>
            <span>Standard</span>
          </div>
          <pre className="bg-slate-950 text-slate-100 text-xs font-mono p-4 overflow-x-auto leading-relaxed">
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        </div>
      );
      codeBlockLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // 1. Detect code block ```
    if (line.startsWith('```')) {
      if (isInsideCodeBlock) {
        flushCodeBlock(i);
        isInsideCodeBlock = false;
      } else {
        flushList(i);
        isInsideCodeBlock = true;
      }
      continue;
    }

    if (isInsideCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // 2. Heading headers
    if (line.startsWith('#### ')) {
      flushList(i);
      renderedElements.push(
        <h4 
          key={`h4-${i}`} 
          className="text-slate-800 font-bold mt-5 mb-2.5 flex items-center gap-1.5 border-l-4 border-slate-300 pl-2 text-xs sm:text-sm"
        >
          {parseInlineStyles(line.slice(5))}
        </h4>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList(i);
      renderedElements.push(
        <h3 
          key={`h3-${i}`} 
          className="text-slate-900 font-extrabold mt-6 mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2 text-sm sm:text-base"
        >
          {parseInlineStyles(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList(i);
      renderedElements.push(
        <h2 
          key={`h2-${i}`} 
          className="text-slate-900 font-black mt-7 mb-4 text-base sm:text-lg"
        >
          {parseInlineStyles(line.slice(3))}
        </h2>
      );
      continue;
    }

    // 3. Unordered list points
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const content = line.slice(2);
      currentListItems.push(
        <li key={`li-${i}-${currentListItems.length}`} className={`leading-relaxed text-slate-600 ${fontSizeClass}`}>
          {parseInlineStyles(content)}
        </li>
      );
      continue;
    }

    // 4. Clean up empty break lines
    if (line === '') {
      flushList(i);
      // Give a spacing to separation
      renderedElements.push(<div key={`spacer-${i}`} className="h-2" />);
      continue;
    }

    // 5. Normal paragraphs of plain lines
    flushList(i);
    renderedElements.push(
      <p 
        key={`p-${i}`} 
        className={`leading-relaxed text-slate-600 whitespace-normal break-words ${fontSizeClass}`}
      >
        {parseInlineStyles(rawLine)}
      </p>
    );
  }

  // Clean-up sweeps
  flushList('end');
  flushCodeBlock('end');

  return (
    <div className="space-y-1">
      {renderedElements}
    </div>
  );
};
