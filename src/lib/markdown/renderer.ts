import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownParseResult {
  data: Record<string, any>;
  content: string;
  html: string;
  toc: TocItem[];
  readingTimeMinutes: number;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Transform GitHub Alert Callouts: > [!NOTE] into rich stylized alert containers
function transformCallouts(markdown: string): string {
  const calloutRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?((?:^>.*(?:\n|$))*)/gim;

  return markdown.replace(calloutRegex, (_match, type, content) => {
    const cleanContent = content
      .split("\n")
      .map((line: string) => line.replace(/^>\s?/, ""))
      .join("\n")
      .trim();

    const t = type.toUpperCase();
    return `\n\n<div class="callout callout-${t.toLowerCase()}" data-callout="${t}">
<div class="callout-header">
<span class="callout-badge">${t}</span>
</div>
<div class="callout-body">

${cleanContent}

</div>
</div>\n\n`;
  });
}

export function parseMarkdown(rawSource: string): MarkdownParseResult {
  // 1. Extract Frontmatter
  const { data, content } = matter(rawSource);
  const readingTimeMinutes = calculateReadingTime(content);

  // 2. Preprocess Callouts
  const preprocessed = transformCallouts(content);

  // 3. Extract TOC
  const toc: TocItem[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    toc.push({ id, text, level });
  }

  // 4. Configure marked with custom heading IDs and code blocks
  const renderer = new marked.Renderer();

  renderer.heading = function ({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const id = slugify(text.replace(/<[^>]+>/g, ""));
    return `<h${depth} id="${id}" class="heading-anchor group"><a href="#${id}" class="anchor-link opacity-0 group-hover:opacity-100 transition-opacity mr-2 text-[#9fef00]">#</a>${text}</h${depth}>`;
  };

  renderer.code = function ({ text, lang }) {
    const language = lang || "text";
    const isTerminal = ["bash", "sh", "shell", "zsh", "powershell", "cmd", "terminal"].includes(language.toLowerCase());
    const isMermaid = language.toLowerCase() === "mermaid";

    if (isMermaid) {
      return `<div class="mermaid-diagram-container my-6 rounded-lg border border-[#1f3352] bg-[#0b121e] p-4">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-[#1f3352] text-xs text-slate-400 font-mono">
          <span class="text-[#9fef00] font-bold">MERMAID DIAGRAM</span>
        </div>
        <pre class="mermaid text-xs font-mono overflow-x-auto text-[#2de2e6]">${escapeHtml(text)}</pre>
      </div>`;
    }

    const encodedCode = encodeURIComponent(text);

    return `
      <div class="code-block-wrapper my-5 rounded-lg border border-[#1f3352] bg-[#0b121e] overflow-hidden group">
        <div class="flex items-center justify-between px-4 py-2 border-b border-[#1f3352] bg-[#111d30] text-xs font-mono text-slate-400">
          <span class="flex items-center gap-2">
            ${isTerminal ? '<span class="inline-block w-2.5 h-2.5 rounded-full bg-[#9fef00] shadow-[0_0_8px_rgba(159,239,0,0.6)]"></span>' : '<span class="inline-block w-2.5 h-2.5 rounded-full bg-[#2de2e6] shadow-[0_0_8px_rgba(45,226,230,0.6)]"></span>'}
            <span class="uppercase tracking-wider font-semibold text-slate-200">${language}</span>
          </span>
          <button class="copy-code-btn px-2 py-1 rounded bg-[#0b121e] border border-[#1f3352] hover:border-[#9fef00] text-slate-300 hover:text-[#9fef00] transition-colors text-xs flex items-center gap-1" data-code="${encodedCode}">
            Copy
          </button>
        </div>
        <pre class="p-4 overflow-x-auto text-sm font-mono text-slate-200 leading-relaxed"><code>${escapeHtml(text)}</code></pre>
      </div>
    `;
  };

  const rawHtml = marked.parse(preprocessed, { renderer, async: false }) as string;

  // 5. Sanitize HTML
  const cleanHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "h1", "h2", "h3", "h4", "h5", "h6",
      "div", "span", "button", "pre", "code", "table", "thead", "tbody", "tr", "th", "td",
      "details", "summary", "svg", "path"
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "id", "data-*"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      button: ["data-code", "type"],
    },
    allowedSchemes: ["http", "https", "mailto", "data", "blob"],
    allowedSchemesByTag: {
      img: ["http", "https", "data", "blob"],
    },
    allowProtocolRelative: true,
  });

  return {
    data,
    content,
    html: cleanHtml,
    toc,
    readingTimeMinutes,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
