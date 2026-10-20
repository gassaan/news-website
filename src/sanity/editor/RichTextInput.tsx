import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { set, unset, useClient, useFormValue, type TextInputProps } from "sanity";
import {
  EditorContent,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
  type NodeViewProps,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { parseBlocks, parseInline, photoSrc, plainText, videoEmbed } from "@/lib/richText";
import { RichBlock } from "@/components/RichBlocks";
import { photoUrl } from "./inputs";

// The article text: written like on the website, with a toolbar at the top of the
// phone's screen while typing (bold, sub-heading, quote, list, link, undo), a + button for photos,
// videos and the rest, and a Preview of the finished article. It is saved as lines
// of text with a few marks (see src/lib/richText.ts), so older text needs no change.

// ---------- Saved text <-> editor ----------

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineHtml(text: string): string {
  return parseInline(text)
    .map((p) => {
      let h = esc(p.text);
      if (p.href) h = `<a href="${esc(p.href)}">${h}</a>`;
      if (p.bold) h = `<strong>${h}</strong>`;
      return h;
    })
    .join("");
}

function toHtml(text: string): string {
  const lines = (s: string[]) => s.map((l) => `<p>${inlineHtml(l)}</p>`).join("");
  return parseBlocks(text.split("\n"))
    .map((b) => {
      switch (b.type) {
        case "p":
          return `<p>${inlineHtml(b.text)}</p>`;
        case "h":
          return `<h2>${inlineHtml(b.text)}</h2>`;
        case "quote":
          return `<blockquote>${lines(b.lines)}</blockquote>`;
        case "box":
          return `<aside data-box>${lines(b.lines)}</aside>`;
        case "list": {
          const tag = b.ordered ? "ol" : "ul";
          return `<${tag}>${b.items.map((i) => `<li><p>${inlineHtml(i)}</p></li>`).join("")}</${tag}>`;
        }
        case "img":
          return `<figure data-photo data-src="${esc(b.src)}" data-caption="${esc(b.caption)}"></figure>`;
        case "video":
          return `<div data-video="${esc(b.url)}"></div>`;
        case "hr":
          return "<hr>";
      }
    })
    .join("");
}

// A plain paragraph that happens to start like a mark keeps a "\" in front.
const LOOKS_LIKE_MARK = /^(\\|## |>|::|-\s|\d+\.\s|---$|!\[|@\[)/;

function inlineText(nodes?: JSONContent[]): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type !== "text") return "";
      let t = (n.text ?? "").replace(/\s*\n\s*/g, " ");
      const marks = n.marks ?? [];
      const href = marks.find((m) => m.type === "link")?.attrs?.href as string | undefined;
      if (href && /^https?:\/\//.test(href)) t = `[${t.replace(/[[\]]/g, "")}](${href.replace(/[\s)]/g, "")})`;
      if (marks.some((m) => m.type === "bold") && t.trim()) t = `**${t}**`;
      return t;
    })
    .join("")
    .trim();
}

function toText(doc: JSONContent): string {
  const out: string[] = [];
  for (const b of doc.content ?? []) {
    switch (b.type) {
      case "paragraph": {
        const t = inlineText(b.content);
        if (t) out.push(LOOKS_LIKE_MARK.test(t) ? `\\${t}` : t);
        break;
      }
      case "heading": {
        const t = inlineText(b.content);
        if (t) out.push(`## ${t}`);
        break;
      }
      case "blockquote":
      case "factBox": {
        for (const p of b.content ?? []) {
          const t = inlineText(p.content);
          if (t) out.push(`${b.type === "blockquote" ? ">" : "::"} ${t}`);
        }
        break;
      }
      case "bulletList":
      case "orderedList": {
        let n = 1;
        for (const li of b.content ?? []) {
          const t = (li.content ?? []).map((c) => inlineText(c.content)).filter(Boolean).join(" ");
          if (t) out.push(`${b.type === "bulletList" ? "-" : `${n++}.`} ${t}`);
        }
        break;
      }
      case "horizontalRule":
        out.push("---");
        break;
      case "photo":
        if (b.attrs?.src) out.push(`![${String(b.attrs.caption ?? "").replace(/[\]\n]/g, " ").trim()}](${b.attrs.src})`);
        break;
      case "video":
        if (b.attrs?.url) out.push(`@[video](${b.attrs.url})`);
        break;
    }
  }
  return out.join("\n");
}

// ---------- Photo, video and fact box inside the text ----------

function PhotoView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  return (
    <NodeViewWrapper className="re-photo" contentEditable={false}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture */}
      <img src={photoSrc(String(node.attrs.src), 900)} alt="" />
      <input
        className="re-caption"
        dir="rtl"
        placeholder="ފޮޓޯގެ ތަފްޞީލް (ބޭނުންނަމަ)"
        value={String(node.attrs.caption ?? "")}
        disabled={!editor.isEditable}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
      />
      {editor.isEditable && (
        <button type="button" className="re-x" aria-label="Remove the photo" onClick={deleteNode}>
          ×
        </button>
      )}
    </NodeViewWrapper>
  );
}

function VideoView({ node, deleteNode, editor }: NodeViewProps) {
  const url = String(node.attrs.url);
  const yt = videoEmbed(url)?.match(/embed\/([\w-]{11})/)?.[1];
  return (
    <NodeViewWrapper className="re-video" contentEditable={false}>
      {yt ? (
        // eslint-disable-next-line @next/next/no-img-element -- YouTube's own preview picture
        <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt="" />
      ) : (
        <span className="re-video-fb">Facebook video</span>
      )}
      <span className="re-play" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span className="re-video-url">{url}</span>
      {editor.isEditable && (
        <button type="button" className="re-x" aria-label="Remove the video" onClick={deleteNode}>
          ×
        </button>
      )}
    </NodeViewWrapper>
  );
}

const Photo = Node.create({
  name: "photo",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      src: { default: "", parseHTML: (el) => el.getAttribute("data-src") ?? "", renderHTML: (a) => ({ "data-src": a.src }) },
      caption: { default: "", parseHTML: (el) => el.getAttribute("data-caption") ?? "", renderHTML: (a) => ({ "data-caption": a.caption }) },
    };
  },
  parseHTML: () => [{ tag: "figure[data-photo]" }],
  renderHTML: ({ HTMLAttributes }) => ["figure", mergeAttributes(HTMLAttributes, { "data-photo": "" })],
  addNodeView: () => ReactNodeViewRenderer(PhotoView),
});

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  addAttributes() {
    return { url: { default: "", parseHTML: (el) => el.getAttribute("data-video") ?? "", renderHTML: (a) => ({ "data-video": a.url }) } };
  },
  parseHTML: () => [{ tag: "div[data-video]" }],
  renderHTML: ({ HTMLAttributes }) => ["div", HTMLAttributes],
  addNodeView: () => ReactNodeViewRenderer(VideoView),
});

const FactBox = Node.create({
  name: "factBox",
  group: "block",
  content: "paragraph+",
  defining: true,
  parseHTML: () => [{ tag: "aside[data-box]" }],
  renderHTML: ({ HTMLAttributes }) => ["aside", mergeAttributes(HTMLAttributes, { "data-box": "", class: "re-box" }), 0],
});

// ---------- Buttons ----------

const I = ({ d, fill = false }: { d: string; fill?: boolean }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  plus: <I d="M12 5v14M5 12h14" />,
  bold: <b className="re-glyph">B</b>,
  heading: <b className="re-glyph">H</b>,
  quote: <I fill d="M10 7H6a2 2 0 0 0-2 2v4h4v4l2-4V7zm10 0h-4a2 2 0 0 0-2 2v4h4v4l2-4V7z" />,
  list: <I d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  link: <I d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  undo: <I d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  paragraph: <b className="re-glyph">¶</b>,
  photo: <I d="M4 7h3l2-2h6l2 2h3v12H4zM12 16.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7z" />,
  video: <I d="M4 6h11v12H4zM15 10l5-3v10l-5-3" />,
  divider: <I d="M4 12h16" />,
  box: <I d="M4 5h16v14H4zM12 9v.01M12 12v4" />,
  eye: <I d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6z" />,
};

// Keeps the editor's cursor (and the phone's keyboard) while a toolbar button is pressed.
const keepFocus = (e: MouseEvent | React.PointerEvent) => e.preventDefault();

type Sheet = null | "add" | "link" | "video" | "preview";

function Popup({ scheme, label, onClose, wide, children }: { scheme: string; label: string; onClose: () => void; wide?: boolean; children: ReactNode }) {
  return createPortal(
    <div data-scheme={scheme}>
      <div className="ef-lib-back" onClick={onClose}>
        <section className={`ef-lib re-sheet${wide ? " re-sheet-full" : ""}`} role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
          <div className="ef-lib-head">
            <b>{label}</b>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </div>
          {children}
        </section>
      </div>
    </div>,
    document.body,
  );
}

// ---------- The field ----------

type Parent = { title?: string; image?: { asset?: { _ref?: string } } };

export function RichTextInput(props: TextInputProps) {
  const { value, onChange, readOnly, path } = props;
  const client = useClient({ apiVersion: "2025-02-19" });
  const { projectId = "", dataset = "" } = client.config();
  // The article (or the story episode) this text belongs to, for the preview.
  const parent = useFormValue(path.slice(0, -1)) as Parent | undefined;

  const [text, setText] = useState(value ?? "");
  const lastSaved = useRef(value ?? "");
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEdit = useRef(0);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [scheme, setScheme] = useState("dark");
  const [focused, setFocused] = useState(false);
  const [barTop, setBarTop] = useState(0);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [touch] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  // Sanity refuses changes while the page is (re)connecting. The text stays in the editor
  // and saving is tried again shortly, so nothing typed is lost.
  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const next = pending.current;
    if (next === null) return;
    try {
      onChange(next ? set(next) : unset());
      pending.current = null;
      setError("");
    } catch {
      setError("The page is still connecting. Your text is kept and will be saved in a moment.");
      timer.current = setTimeout(flush, 1500);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        underline: false,
        hardBreak: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Placeholder.configure({ placeholder: "މިތާ ލިޔުއްވާ…" }),
      Photo,
      Video,
      FactBox,
    ],
    content: toHtml(value ?? ""),
    editorProps: {
      attributes: { dir: "rtl", class: "re-doc" },
      // Keep the line being typed clear of the toolbar at the top.
      scrollMargin: { top: 90, bottom: 40, left: 0, right: 0 },
      scrollThreshold: { top: 90, bottom: 40, left: 0, right: 0 },
    },
    onUpdate: ({ editor: ed }) => {
      const next = toText(ed.getJSON());
      setText(next);
      if (next === lastSaved.current) return;
      lastSaved.current = next;
      lastEdit.current = Date.now();
      pending.current = next;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 400);
    },
    onFocus: ({ editor: ed }) => {
      setScheme(ed.view.dom.closest("[data-scheme]")?.getAttribute("data-scheme") ?? "dark");
      setFocused(true);
    },
    onBlur: () => {
      setFocused(false);
      flush();
    },
  });

  // Text changed somewhere else (another phone, or "Discard changes"): show it here too.
  // Not in the few seconds after typing, while the page may still show the older text.
  useEffect(() => {
    if (!editor || editor.isFocused || timer.current || Date.now() - lastEdit.current < 4000) return;
    const v = value ?? "";
    if (v === lastSaved.current) return;
    lastSaved.current = v;
    editor.commands.setContent(toHtml(v), { emitUpdate: false });
    setText(v);
  }, [editor, value]);

  // Locked while someone can't edit; a short connection blip while typing doesn't
  // take the keyboard away (saving waits for it instead).
  useEffect(() => {
    if (editor && !(readOnly && editor.isFocused)) editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  // Save what's typed before leaving the page.
  useEffect(() => () => flush(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Phones: the toolbar is pinned to the top of what's visible while typing. The bottom,
  // above the keyboard, is where iPhone Safari puts its own bar and the address pill.
  useEffect(() => {
    if (!focused) return;
    const vv = window.visualViewport;
    const place = () => setBarTop(vv ? Math.max(0, vv.offsetTop) : 0);
    place();
    vv?.addEventListener("resize", place);
    vv?.addEventListener("scroll", place);
    return () => {
      vv?.removeEventListener("resize", place);
      vv?.removeEventListener("scroll", place);
    };
  }, [focused]);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            bold: ed.isActive("bold"),
            heading: ed.isActive("heading"),
            quote: ed.isActive("blockquote"),
            list: ed.isActive("bulletList") || ed.isActive("orderedList"),
            link: ed.isActive("link"),
            box: ed.isActive("factBox"),
            undo: ed.can().undo(),
          }
        : null,
  });

  const open = (which: Sheet, e?: MouseEvent<HTMLElement>) => {
    const from = e?.currentTarget ?? editor?.view.dom;
    setScheme(from?.closest("[data-scheme]")?.getAttribute("data-scheme") ?? "dark");
    if (which === "link") setUrl(editor?.getAttributes("link").href ?? "");
    if (which === "video") setUrl("");
    setSheet(which);
  };
  const run = (fn: (ed: Editor) => void) => {
    if (!editor) return;
    fn(editor);
    setSheet(null);
  };

  const upload = async (f: File | undefined) => {
    if (!f || !editor) return;
    setBusy(true);
    setError("");
    try {
      const asset = await client.assets.upload("image", f, { filename: f.name });
      editor.chain().focus().insertContent({ type: "photo", attrs: { src: asset.url, caption: "" } }).run();
    } catch {
      setError("The photo couldn't be uploaded. Check the connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const applyLink = () =>
    run((ed) => {
      const raw = url.trim();
      if (!raw) {
        ed.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      const href = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
      if (ed.state.selection.empty && !ed.isActive("link"))
        ed.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
      else ed.chain().focus().extendMarkRange("link").setLink({ href }).run();
    });
  const videoOk = Boolean(videoEmbed(url.trim()));

  const blocks: { key: string; dv: string; en: string; icon: ReactNode; on?: boolean; act: (e: MouseEvent<HTMLButtonElement>) => void }[] = [
    { key: "p", dv: "ޕެރެގްރާފް", en: "Paragraph", icon: ICONS.paragraph, act: () => run((ed) => ed.chain().focus().clearNodes().run()) },
    { key: "h", dv: "ސަބް ހެޑިންގ", en: "Sub-heading", icon: ICONS.heading, on: state?.heading, act: () => run((ed) => ed.chain().focus().toggleHeading({ level: 2 }).run()) },
    { key: "q", dv: "ކޯޓް", en: "Quote", icon: ICONS.quote, on: state?.quote, act: () => run((ed) => ed.chain().focus().toggleBlockquote().run()) },
    { key: "l", dv: "ލިސްޓް", en: "List", icon: ICONS.list, on: state?.list, act: () => run((ed) => ed.chain().focus().toggleBulletList().run()) },
    {
      key: "ph",
      dv: "ފޮޓޯ",
      en: "Photo",
      icon: ICONS.photo,
      act: () => {
        setSheet(null);
        fileInput?.click();
      },
    },
    { key: "v", dv: "ވީޑިއޯ", en: "Video", icon: ICONS.video, act: (e) => open("video", e) },
    { key: "hr", dv: "ލައިނެއް", en: "Divider", icon: ICONS.divider, act: () => run((ed) => ed.chain().focus().setHorizontalRule().run()) },
    { key: "b", dv: "ފެކްޓް ބޮކްސް", en: "Fact box", icon: ICONS.box, on: state?.box, act: () => run((ed) => ed.chain().focus().setParagraph().toggleWrap("factBox").run()) },
  ];

  // Phones: the toolbar floats at the top of the screen while typing. Computers: it sits
  // on top of the text, so it never covers the Publish button.
  const toolbar = (
    <div
      className={touch ? "re-bar" : "re-bar re-bar-inline"}
      style={touch ? { top: barTop } : undefined}
      role="toolbar"
      aria-label="Formatting"
    >
      <button type="button" className="re-tb re-tb-plus" aria-label="Add a photo, video and more" onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={(e) => open("add", e)}>
        {ICONS.plus}
      </button>
      <button type="button" className="re-tb" aria-label="Bold" aria-pressed={state?.bold} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => editor?.chain().focus().toggleBold().run()}>
        {ICONS.bold}
      </button>
      <button type="button" className="re-tb" aria-label="Sub-heading" aria-pressed={state?.heading} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
        {ICONS.heading}
      </button>
      <button type="button" className="re-tb" aria-label="Quote" aria-pressed={state?.quote} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
        {ICONS.quote}
      </button>
      <button type="button" className="re-tb" aria-label="List" aria-pressed={state?.list} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
        {ICONS.list}
      </button>
      <button type="button" className="re-tb" aria-label="Link" aria-pressed={state?.link} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={(e) => open("link", e)}>
        {ICONS.link}
      </button>
      <button type="button" className="re-tb" aria-label="Undo" disabled={!state?.undo} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => editor?.chain().focus().undo().run()}>
        {ICONS.undo}
      </button>
    </div>
  );

  const words = plainText(text.split("\n")).split(/\s+/).filter(Boolean).length;
  const hero = parent?.image?.asset?._ref;

  return (
    <div className="re">
      <input
        ref={setFileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {!touch && editor?.isEditable && toolbar}
      <EditorContent editor={editor} className="re-editor" />
      {busy && <p className="ef-note">Uploading the photo…</p>}
      {error && <p className="ef-photo-error">{error}</p>}

      <div className="re-foot">
        {!readOnly && (
          <button type="button" className="re-pill re-add" onClick={(e) => open("add", e)}>
            {ICONS.plus}
            Add
          </button>
        )}
        <button type="button" className="re-pill" onClick={(e) => open("preview", e)}>
          {ICONS.eye}
          Preview
        </button>
        {words > 0 && (
          <span className="re-count">
            {words} word{words === 1 ? "" : "s"} · {Math.max(1, Math.round(words / 200))} min read
          </span>
        )}
      </div>

      {focused &&
        editor?.isEditable &&
        touch &&
        createPortal(<div data-scheme={scheme}>{toolbar}</div>, document.body)}

      {sheet === "add" && (
        <Popup scheme={scheme} label="Add to the article" onClose={() => setSheet(null)}>
          <div className="re-blocks">
            {blocks.map((b) => (
              <button key={b.key} type="button" className="re-block" aria-pressed={b.on} onClick={b.act}>
                <span className="re-block-icon">{b.icon}</span>
                <span className="re-block-dv">{b.dv}</span>
                <span className="re-block-en">{b.en}</span>
              </button>
            ))}
          </div>
        </Popup>
      )}

      {sheet === "link" && (
        <Popup scheme={scheme} label={state?.link ? "Change the link" : "Add a link"} onClose={() => setSheet(null)}>
          <input className="re-url" type="url" inputMode="url" autoFocus placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyLink()} />
          <p className="ef-note">Select words first to turn them into a link, or the link itself is added.</p>
          <div className="re-sheet-actions">
            {state?.link && (
              <button type="button" className="re-pill re-danger" onClick={() => run((ed) => ed.chain().focus().extendMarkRange("link").unsetLink().run())}>
                Remove link
              </button>
            )}
            <button type="button" className="re-pill re-solid" disabled={!url.trim()} onClick={applyLink}>
              {state?.link ? "Save" : "Add link"}
            </button>
          </div>
        </Popup>
      )}

      {sheet === "video" && (
        <Popup scheme={scheme} label="Add a video" onClose={() => setSheet(null)}>
          <input className="re-url" type="url" inputMode="url" autoFocus placeholder="YouTube or Facebook video link" value={url} onChange={(e) => setUrl(e.target.value)} />
          {url.trim() && !videoOk && <p className="ef-photo-error">Paste a YouTube or Facebook video link.</p>}
          <div className="re-sheet-actions">
            <button type="button" className="re-pill re-solid" disabled={!videoOk} onClick={() => run((ed) => ed.chain().focus().insertContent({ type: "video", attrs: { url: url.trim() } }).run())}>
              Add video
            </button>
          </div>
        </Popup>
      )}

      {sheet === "preview" && (
        <Popup scheme={scheme} label="Preview" onClose={() => setSheet(null)} wide>
          <div className="ef-lib-scroll">
            <article className="re-pv" dir="rtl">
              {hero && (
                // eslint-disable-next-line @next/next/no-img-element -- Sanity's own resized picture
                <img className="re-pv-hero" src={photoUrl(hero, projectId, dataset, 1000)} alt="" />
              )}
              {parent?.title && <h1>{parent.title}</h1>}
              <div className="re-pv-body">
                {parseBlocks(text.split("\n")).map((b, i) => (
                  <RichBlock key={i} block={b} />
                ))}
                {!text && <p className="ef-note">Nothing written yet.</p>}
              </div>
            </article>
          </div>
          <span className="re-pv-note">How it will look on the website</span>
        </Popup>
      )}
    </div>
  );
}
