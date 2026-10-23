"use client";

import { useState, useRef } from "react";
import { parseMarkdown } from "@/lib/markdown/renderer";
import { Eye, Edit3, Upload, FileText, CheckCircle2, Save, Image as ImageIcon, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ArticleEditorProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    subtitle?: string | null;
    summary: string;
    content: string;
    categoryId?: string | null;
    status: string;
    visibility: string;
    isFeatured: boolean;
    tags?: string;
  };
  categories: Category[];
  actionUrl: string;
}

export function ArticleEditor({ initialData, categories, actionUrl }: ArticleEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [content, setContent] = useState(
    initialData?.content ||
      `# Executive Overview\n\nDocument the vulnerability or security architecture here...\n\n> [!NOTE]\n> Ensure this analysis adheres to responsible disclosure guidelines.\n\n## Technical Prerequisites\n\n\`\`\`bash\n# Verify target software build\ncurl -I http://target.local\n\`\`\`\n`
  );
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [status, setStatus] = useState(initialData?.status || "DRAFT");
  const [visibility, setVisibility] = useState(initialData?.visibility || "PUBLIC");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [tags, setTags] = useState(initialData?.tags || "");

  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("split");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert image markdown snippet into textarea at current cursor position
  const insertTextAtCursor = (insertion: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + "\n" + insertion + "\n");
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const nextContent = current.substring(0, start) + insertion + current.substring(end);
    setContent(nextContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertion.length, start + insertion.length);
    }, 50);
  };

  // Upload an image file to /api/upload/image and insert markdown into editor
  const uploadImageFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await res.json();
      const altText = file.name.replace(/\.[^/.]+$/, "");
      insertTextAtCursor(`\n![${altText}](${data.url})\n`);
    } catch (err: any) {
      console.error("Upload error:", err);
      // Fallback: convert to base64 Data URL so user's image is NEVER lost
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          insertTextAtCursor(`\n![Pasted Image](${dataUrl})\n`);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle direct Ctrl+V / Paste of images from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          uploadImageFile(file);
          return;
        }
      }
    }
  };

  // Handle Image button upload
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
    e.target.value = "";
  };

  // Handle Markdown file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsed = parseMarkdown(text);
        setContent(parsed.content);

        // Derive metadata if present in frontmatter
        if (parsed.data.title) setTitle(parsed.data.title);
        if (parsed.data.description || parsed.data.summary) {
          setSummary(parsed.data.description || parsed.data.summary);
        }
        if (parsed.data.tags && Array.isArray(parsed.data.tags)) {
          setTags(parsed.data.tags.join(", "));
        }
      } catch (err) {
        setContent(text);
      }
    };
    reader.readAsText(file);
  };

  const previewResult = parseMarkdown(content);

  return (
    <form action={actionUrl} method="POST" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-[#1f3352] bg-[#111d30]/95 sticky top-16 z-30 backdrop-blur shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#9fef00] uppercase tracking-wider">
            {initialData?.id ? "Editing Article" : "Drafting Research Publication"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Image Upload Button */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b121e] border border-[#1f3352] hover:border-[#9fef00] text-xs font-mono text-slate-300 cursor-pointer transition-colors">
            {isUploadingImage ? (
              <Loader2 className="w-3.5 h-3.5 text-[#9fef00] animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-[#2de2e6]" />
            )}
            <span>{isUploadingImage ? "Uploading..." : "Insert Image"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageInputChange}
              disabled={isUploadingImage}
              className="hidden"
            />
          </label>

          {/* File Upload .md */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b121e] border border-[#1f3352] hover:border-[#9fef00] text-xs font-mono text-slate-300 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-[#9fef00]" />
            <span>Import .md</span>
            <input type="file" accept=".md,.markdown" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-[#1f3352] bg-[#0b121e] p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "edit" ? "bg-[#1f3352] text-[#9fef00] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("split")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "split" ? "bg-[#1f3352] text-[#9fef00] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === "preview" ? "bg-[#1f3352] text-[#9fef00] font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#9fef00] hover:bg-[#b0ff1a] text-[#0b121e] font-bold text-xs font-mono transition-colors shadow-[0_0_15px_rgba(159,239,0,0.3)]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{status === "PUBLISHED" ? "Publish Article" : "Save Draft"}</span>
          </button>
        </div>
      </div>

      {/* Metadata Configuration */}
      <div className="p-6 rounded-2xl border border-[#1f3352] bg-[#111d30]/80 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Article Title *</label>
            <input
              type="text"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linux Kernel PrivEsc CVE-2026-XXXX Analysis"
              className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-sm font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] font-sans"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-slate-300">Slug (URL identifier)</label>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated-if-blank"
              className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-[#9fef00] placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-slate-300">Subtitle / Tagline</label>
          <input
            type="text"
            name="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A tactical analysis of memory corruption in kernel netlink subsystem"
            className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-slate-300">Executive Summary / Abstract *</label>
          <textarea
            name="summary"
            required
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A concise 2-sentence summary that appears in cards, RSS feeds, and search snippets..."
            className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00] font-sans"
          />
        </div>

        {/* Row 3: Category, Status, Visibility, Featured */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-[#1f3352] text-xs font-mono">
          <div className="space-y-1.5">
            <label className="block text-slate-400">Category</label>
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-slate-300 focus:outline-none focus:border-[#9fef00]"
            >
              <option value="none">-- Uncategorized --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400">Status</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-slate-300 focus:outline-none focus:border-[#9fef00]"
            >
              <option value="DRAFT">DRAFT (Unpublished)</option>
              <option value="REVIEW">REVIEW (Under Peer Check)</option>
              <option value="PUBLISHED">PUBLISHED (Live)</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-400">Visibility</label>
            <select
              name="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-slate-300 focus:outline-none focus:border-[#9fef00]"
            >
              <option value="PUBLIC">PUBLIC (Searchable)</option>
              <option value="UNLISTED">UNLISTED (Direct link only)</option>
              <option value="PRIVATE">PRIVATE (Author & Admins only)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isFeatured"
              name="isFeatured"
              value="true"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded bg-[#0b121e] border-[#1f3352] text-[#9fef00] focus:ring-0 accent-[#9fef00]"
            />
            <label htmlFor="isFeatured" className="text-slate-300 cursor-pointer">
              Feature on Homepage
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5 pt-2 border-t border-[#1f3352]">
          <label className="block text-xs font-mono text-slate-400">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="cve, linux, privilege-escalation, memory-corruption"
            className="w-full px-3 py-2 rounded-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-[#9fef00]"
          />
        </div>
      </div>

      {/* Markdown Content & Live Preview */}
      <div className="space-y-2">
        <label className="block text-xs font-mono text-slate-300">
          Markdown Technical Content (Supports Callouts, Code Blocks, Tables, Mermaid)
        </label>

        <div
          className={`grid gap-4 ${
            activeTab === "split"
              ? "grid-cols-1 lg:grid-cols-2"
              : activeTab === "edit"
              ? "grid-cols-1"
              : "grid-cols-1"
          }`}
        >
          {/* Raw Markdown Editor */}
          {(activeTab === "edit" || activeTab === "split") && (
            <div className="flex flex-col">
              <div className="px-3 py-1.5 rounded-t-lg bg-[#0b121e] border border-b-0 border-[#1f3352] text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>MARKDOWN_SOURCE</span>
                <span>{content.split(/\s+/).length} words</span>
              </div>
              <textarea
                ref={textareaRef}
                name="content"
                required
                rows={22}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Write your markdown technical content here... You can paste screenshots (Ctrl+V) directly or use the 'Insert Image' button above!"
                className="w-full p-4 rounded-b-lg bg-[#0b121e] border border-[#1f3352] text-xs font-mono text-slate-200 focus:outline-none focus:border-[#9fef00] leading-relaxed resize-y font-mono"
              />
            </div>
          )}

          {/* Live Rendered Preview */}
          {(activeTab === "preview" || activeTab === "split") && (
            <div className="flex flex-col">
              <div className="px-3 py-1.5 rounded-t-lg bg-[#0b121e] border border-b-0 border-[#1f3352] text-[11px] font-mono text-[#9fef00] flex items-center justify-between">
                <span>LIVE_COMPILED_PREVIEW</span>
                <span>{previewResult.readingTimeMinutes} min read</span>
              </div>
              <div
                className="p-6 rounded-b-lg bg-[#0b121e] border border-[#1f3352] min-h-[500px] max-h-[600px] overflow-y-auto article-prose text-xs"
                dangerouslySetInnerHTML={{ __html: previewResult.html }}
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
