import React, { useState } from 'react';

export const HighlightText = ({ text, query }) => {
  if (!query || !text) return <>{text}</>;
  const keywords = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (keywords.length === 0) return <>{text}</>;
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = String(text).split(regex);
  return (
    <>
      {parts.map((part, i) =>
        keywords.some((kw) => new RegExp(`^${kw}$`, 'i').test(part)) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/60 text-black dark:text-white rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const stripHtml = (html) => {
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export function useCloseAnimation(closeAction, delay = 200) {
  const [isClosing, setIsClosing] = useState(false);
  const close = (...args) => {
    setIsClosing(true);
    setTimeout(() => closeAction(...args), delay);
  };
  return [isClosing, close];
}

export const LoadingSpinner = () => (
  <svg
    className="animate-spin h-3.5 w-3.5 mr-2 inline-block"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const renderRichText = (text) => {
  if (!text) return <span className="text-neutral-400 italic">No description provided.</span>;

  const codeBlocks = [];
  let escaped = String(text);

  escaped = escaped.replace(/```([\s\S]*?)(?:```|$)/g, (match, p1) => {
    codeBlocks.push(p1);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  let formattedText = escaped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/__(.*?)__/g, '<u class="underline underline-offset-2">$1</u>')
    .replace(/\n- (.*?)(?=\n|$)/g, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>');

  codeBlocks.forEach((code, i) => {
    let cleanCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    cleanCode = cleanCode.replace(/^[a-z0-9_-]+[ \t]*\r?\n/i, '');

    let lines = cleanCode.split(/\r?\n/);
    let minIndent = Infinity;
    lines.forEach((line) => {
      if (line.trim().length > 0) {
        const match = line.match(/^[ \t]*/);
        if (match) minIndent = Math.min(minIndent, match[0].length);
      }
    });
    if (minIndent > 0 && minIndent !== Infinity) {
      cleanCode = lines.map((line) => (line.length >= minIndent ? line.substring(minIndent) : line)).join('\n');
    } else {
      cleanCode = lines.join('\n');
    }

    const block = `<details class="group bg-[#272822] text-[#F8F8F2] rounded-xl my-3 shadow-lg border border-[#3e3d32] overflow-hidden w-full max-w-full" open><summary class="px-4 py-2 bg-[#1e1f1c] cursor-pointer text-xs font-bold font-sans flex items-center justify-between select-none border-b border-[#3e3d32] hover:bg-[#2c2d27] transition-colors"><span class="text-[#A6E22E] flex items-center gap-2"><span>⌨️</span> <span>Code / Flowchart</span></span><div class="flex items-center gap-3"><button type="button" onclick="event.preventDefault(); event.stopPropagation(); navigator.clipboard.writeText(this.closest('details').querySelector('code').innerText); const t = this.innerHTML; this.innerHTML = '✅ Copied!'; setTimeout(() => this.innerHTML = t, 2000);" class="text-[10px] font-bold text-neutral-400 hover:text-[#A6E22E] transition-colors bg-[#272822] border border-[#3e3d32] px-2.5 py-1 rounded-md active:scale-95">📋 Copy</button><span class="group-open:rotate-180 transition-transform">▼</span></div></summary><div class="overflow-x-auto p-4 w-full custom-scrollbar" style="overscroll-behavior-x: contain;"><pre class="font-mono text-[10px] sm:text-xs text-left" style="white-space: pre; line-height: 1.3; min-width: max-content;"><code>${cleanCode}</code></pre></div></details>`;
    formattedText = formattedText.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return <div dangerouslySetInnerHTML={{ __html: formattedText }} className="space-y-1" />;
};
