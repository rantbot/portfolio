// Inline editing for Ran. Loaded only after visiting a page with ?edit (see the end of site.js); visitors never load it.
// Changes are saved straight to the GitHub repo with a key Ran pastes in once. It only lives in this browser.
const REPO = "rantbot/portfolio";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}`;
const KEY_TOKEN = "edit-github-token";

const page = document.querySelector('meta[name="edit-source"]')?.content?.replace(/^\.\//, "") || "";
const main = document.querySelector("main");
const footer = document.querySelector(".site-footer");
const areas = [main, footer].filter(Boolean); // the page itself and the footer
const root = document.documentElement;
const pending = new Map(); // element -> { before, after }
const files = new Map(); // path -> { text, sha }
let tree = null;

const getToken = () => { try { return localStorage.getItem(KEY_TOKEN) || ""; } catch { return ""; } };
const setToken = (t) => { try { t ? localStorage.setItem(KEY_TOKEN, t) : localStorage.removeItem(KEY_TOKEN); } catch {} };

// ---- GitHub
async function gh(path, opts = {}) {
  const r = await fetch(API + path, { ...opts, headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${getToken()}`, ...(opts.body ? { "Content-Type": "application/json" } : {}) } });
  if (r.status === 401) throw new Error("GitHub didn’t accept the key. Add it again from the edit bar.");
  if (!r.ok) throw new Error(`GitHub said ${r.status}. ${(await r.json().catch(() => ({}))).message || ""}`.trim());
  return r.json();
}
const b64decode = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, "")), (c) => c.charCodeAt(0)));
const b64encode = (s) => { const bytes = new TextEncoder().encode(s); let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); };
async function readFile(path) {
  if (!files.has(path)) {
    const f = await gh(`/contents/${encodeURI(path)}?ref=${BRANCH}`);
    files.set(path, { text: b64decode(f.content), sha: f.sha });
  }
  return files.get(path);
}
async function allSourceFiles() {
  if (!tree) {
    const t = await gh(`/git/trees/${BRANCH}?recursive=1`);
    tree = t.tree.filter((n) => n.type === "blob" && /^src\/(?!assets\/).*\.(md|njk|ya?ml|html)$/.test(n.path)).map((n) => n.path);
  }
  return tree;
}

// ---- Finding the text in the source
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const finder = (text) => new RegExp(text.trim().split(/\s+/).map((w) => reEsc(w).replace(/&/g, "(?:&|&amp;)").replace(/[’']/g, "[’']")).join("\\s+"), "g");
const count = (text, re) => (text.match(re) || []).length;
// Footer text lives in site.yml or in the footer of base.njk, where words like "Leading" also appear in the header
const BASE = "src/_includes/base.njk";
const footerPart = (text) => { const a = text.indexOf("<footer"), b = text.indexOf("</footer>"); return a < 0 || b < 0 ? null : [a, b]; };
async function locateFooter(before) {
  const re = finder(before);
  const yml = await readFile("src/_data/site.yml").catch(() => null);
  if (yml && count(yml.text, re) === 1) return "src/_data/site.yml";
  const base = await readFile(BASE).catch(() => null);
  const part = base && footerPart(base.text);
  if (part && count(base.text.slice(...part), re) === 1) return BASE;
  throw new Error("Couldn’t find that footer text in one place. It may be generated automatically, so ask Claude to change it.");
}
async function locate(before) {
  const re = finder(before);
  const first = [page, "src/_data/site.yml"].filter(Boolean);
  for (const path of first) {
    const f = await readFile(path).catch(() => null);
    if (f && count(f.text, re) === 1) return path;
  }
  const hits = [];
  for (const path of await allSourceFiles()) {
    if (first.includes(path)) continue;
    const f = await readFile(path);
    const n = count(f.text, re);
    if (n) hits.push({ path, n });
  }
  if (hits.length === 1 && hits[0].n === 1) return hits[0].path;
  if (!hits.length) throw new Error("Couldn’t find that text in the site’s files. It may be generated automatically.");
  throw new Error(`That text appears in more than one place (${hits.map((h) => h.path).join(", ")}).`);
}

// YAML needs quotes around values with a colon and a space, a # after a space, or a leading special character
function fixYaml(text, value, isYaml) {
  if (!isYaml) return text;
  return text.split("\n").map((line) => {
    if (!line.includes(value)) return line;
    const m = line.match(/^(\s*-?\s*[\w-]+:\s)(.*)$/);
    if (!m || /^["']/.test(m[2])) return line;
    return /: | #|^[\-?:,\[\]{}#&*!|>'"%@`]/.test(m[2]) ? m[1] + JSON.stringify(m[2]) : line;
  }).join("\n");
}
const inFrontMatter = (text, index) => { const m = text.match(/^---\n[\s\S]*?\n---/); return m ? index < m[0].length : false; };

function apply(text, path, before, after, inFooter) {
  const part = inFooter && path === BASE && footerPart(text);
  if (part) return text.slice(0, part[0]) + apply(text.slice(...part), path, before, after) + text.slice(part[1]);
  const re = finder(before);
  const at = text.search(re);
  const isHtml = /\.(njk|html)$/.test(path) && !inFrontMatter(text, at);
  const isYaml = /\.ya?ml$/.test(path) || inFrontMatter(text, at);
  const value = isHtml ? after.replace(/&/g, "&amp;").replace(/</g, "&lt;") : after;
  return fixYaml(text.replace(re, () => value), value, isYaml);
}

// ---- Markdown blocks
// On a page written in Markdown, a paragraph, heading, quote or whole list opens as its Markdown source when clicked,
// so links, formatting and lists can be changed too. **bold**, *italic*, [words](https://address), "- " and "1. " lists
const isMd = /\.md$/.test(page);
const plainish = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const stripMd = (s) => plainish(s
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/<[^>]+>/g, "")
  .replace(/(\*\*|__)(.+?)\1/g, "$2")
  .replace(/\*(?!\s)(.+?)\*/g, "$1")
  .replace(/(?<!\w)_(?!\s)(.+?)_(?!\w)/g, "$1")
  .replace(/`([^`]*)`/g, "$1")
  .replace(/\\([\\`*_{}[\]()#+\-.!>])/g, "$1")
  .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));
const ITEM = /^(\s*)([-*+]|(\d+)([.)]))\s+/;
// The body's blocks, each exactly as it's written in the file
function mdBlocks(text) {
  const fm = text.match(/^---\n[\s\S]*?\n---\n/);
  const out = [];
  let cur = null, kind = "", fence = false, comment = false;
  const flush = () => { if (cur) out.push({ kind, src: cur.join("\n") }); cur = null; kind = ""; };
  const add = (k, line) => { if (kind !== k) { flush(); kind = k; cur = []; } cur.push(line); };
  for (const line of text.slice(fm ? fm[0].length : 0).split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; flush(); continue; }
    if (fence) continue;
    if (comment) { if (line.includes("-->")) comment = false; continue; }
    if (/^\s*<!--/.test(line) && !line.includes("-->")) { flush(); comment = true; continue; }
    if (!line.trim() || /^\s*(<|\{[%{]|---\s*$)/.test(line)) flush();
    else if (/^#{1,6}\s/.test(line)) { flush(); add("h", line); flush(); }
    else if (/^\s*>/.test(line)) add("quote", line);
    else if (ITEM.test(line) || (kind === "list" && /^\s+\S/.test(line))) add("list", line);
    else add("p", line);
  }
  flush();
  return out;
}
const blockText = (b) => stripMd(b.kind === "list" ? b.src.replace(new RegExp(ITEM.source, "gm"), "") : b.kind === "quote" ? b.src.replace(/^\s*>\s?/gm, "") : b.kind === "h" ? b.src.replace(/^#+\s+/, "") : b.src);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (u) => (/^(https?:|mailto:|\/|#)/i.test(u) ? u : "#");
// A quick preview. The site draws the real thing when it publishes.
const renderInline = (md) => esc(md)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}">${t}</a>`)
  .replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>")
  .replace(/\*(?!\s)(.+?)\*/g, "<em>$1</em>")
  .replace(/(?<!\w)_(?!\s)(.+?)_(?!\w)/g, "<em>$1</em>")
  .replace(/`([^`]+)`/g, "<code>$1</code>");
function renderBlocks(md) {
  const html = mdBlocks(md).map(({ kind, src }) => {
    if (kind === "h") { const n = src.match(/^#+/)[0].length; return `<h${n}>${renderInline(src.replace(/^#+\s+/, ""))}</h${n}>`; }
    if (kind === "quote") return `<blockquote><p>${renderInline(src.replace(/^\s*>\s?/gm, " ").trim())}</p></blockquote>`;
    if (kind === "list") {
      const items = [];
      src.split("\n").forEach((l) => (ITEM.test(l) ? items.push(l.replace(ITEM, "")) : items.length && (items[items.length - 1] += " " + l.trim())));
      const tag = /^\s*\d/.test(src) ? "ol" : "ul";
      return `<${tag}>${items.map((i) => `<li>${renderInline(i)}</li>`).join("")}</${tag}>`;
    }
    return `<p>${renderInline(src.replace(/\s*\n\s*/g, " "))}</p>`;
  }).join("");
  const t = document.createElement("template");
  t.innerHTML = html;
  return [...t.content.children];
}
const swap = (text, before, after) => {
  const i = text.indexOf(before);
  if (i < 0 || text.indexOf(before, i + 1) >= 0) throw new Error("Part of this page changed on GitHub since it loaded. Reload the page and try again.");
  return text.slice(0, i) + after + text.slice(i + before.length);
};
let blocks = [];
async function markMarkdown(pageText) {
  if (!isMd || pageText == null) return;
  const found = mdBlocks(pageText);
  const byText = new Map();
  found.forEach((b) => { const k = blockText(b); if (k) byText.set(k, byText.has(k) ? null : b); }); // null means it's written twice
  const used = new Set();
  main.querySelectorAll("p, h2, h3, h4, h5, h6, ul, ol, blockquote").forEach((el) => {
    if (el.closest("[data-edmd], li, .sr, svg, [aria-hidden='true'], .search-dialog") || el.querySelector("img, figure, div")) return;
    const b = byText.get(plainish(el.textContent));
    if (!b || used.has(b)) return;
    used.add(b);
    const block = { mode: "md", path: page, src: b.src, kind: b.kind, start: b.kind === "p" ? b.src.replace(/\s*\n\s*/g, " ") : b.src, after: null, orig: [el], nodes: [] };
    blocks.push(block);
    show(block, [el]);
  });
}
// Put a block's nodes on the page in place of what's there now
function show(block, nodes) {
  const first = block.nodes[0];
  if (first && first !== nodes[0]) { first.before(...nodes); block.nodes.forEach((n) => nodes.includes(n) || n.remove()); }
  block.nodes = nodes;
  nodes.forEach((n) => {
    if (n.tagName === "TEXTAREA") return;
    n.dataset.edmd = ""; n._block = block; n.tabIndex = 0;
    if (block.after != null) n.dataset.edChanged = ""; else delete n.dataset.edChanged;
  });
}
function setAfter(block, after) {
  block.after = after;
  show(block, after == null ? block.orig : block.mode === "html" ? [preview(block, after)] : renderBlocks(after));
  if (after == null) pending.delete(block); else pending.set(block, pend(block, after));
}
// What gets written to the file. Template lines are HTML, so the Markdown typed in the box becomes HTML again.
const toHtml = (block, md) => renderInline(md).replace(/<a href="([^"]*)">/g, (_, u) => (block.linkClass ? `<a href="${u}" class="${block.linkClass}">` : `<a href="${u}">`));
const pend = (block, text) => ({ before: block.src, after: block.mode === "html" ? toHtml(block, text) : text, md: true, text });
function preview(block, md) { const n = block.orig[0].cloneNode(false); n.innerHTML = toHtml(block, md); return n; }

// ---- Lines with links or formatting in a template (like the Work together page)
// They open as Markdown too, then go back into the template as HTML when published.
const INLINE = new Set(["A", "STRONG", "B", "EM", "I", "CODE", "BR"]);
function inlineOnly(el) {
  return [...el.querySelectorAll("*")].every((n) => INLINE.has(n.tagName) && [...n.attributes].every((a) => n.tagName === "A" ? a.name === "href" || a.name === "class" : false));
}
function htmlToMd(node) {
  return [...node.childNodes].map((n) => {
    if (n.nodeType === 3) return n.textContent;
    if (n.nodeType !== 1) return "";
    const inner = htmlToMd(n);
    return ({ A: `[${inner}](${n.getAttribute("href")})`, STRONG: `**${inner}**`, B: `**${inner}**`, EM: `*${inner}*`, I: `*${inner}*`, CODE: "`" + inner + "`", BR: " " })[n.tagName] ?? inner;
  }).join("").replace(/\s+/g, " ").trim();
}
function markHtml(el, pageText) {
  if (!pageText || !inlineOnly(el)) return false;
  const re = finder(el.innerHTML.replace(/&amp;/g, "&").replace(/&nbsp;/g, " "));
  const hits = pageText.match(re);
  if (!hits || hits.length !== 1) return false;
  const start = htmlToMd(el);
  const link = el.querySelector("a[class]");
  const block = { mode: "html", path: page, src: hits[0], kind: "p", start, linkClass: link ? link.getAttribute("class") : "ul", after: null, orig: [el], nodes: [] };
  blocks.push(block);
  show(block, [el]);
  return true;
}

// ---- Interface// ---- Interface
const css = `
  .ed-bar { position: fixed; left: 50%; bottom: 18px; z-index: 60; transform: translateX(-50%); display: flex; align-items: center; gap: 6px; padding: 5px; border-radius: 999px; background: #262624; color: #FAFAF7; font: 500 13px/1 "Instrument Sans", system-ui, sans-serif; box-shadow: 0 10px 30px -10px rgba(0,0,0,.45); white-space: nowrap; }
  .ed-bar button, .ed-bar a { padding: 9px 14px; border: 0; border-radius: 999px; background: none; color: inherit; font: inherit; cursor: pointer; }
  .ed-bar button:hover, .ed-bar a:hover { background: rgba(255,255,255,.12); }
  .ed-bar .ed-primary { background: #FAFAF7; color: #262624; }
  .ed-bar .ed-primary:hover { background: #fff; }
  .ed-bar .ed-primary[disabled] { opacity: .45; cursor: default; }
  .ed-bar .ed-note { padding: 0 8px; color: #B9B9B2; font-weight: 400; }
  .ed-bar .ed-x { width: 32px; padding: 0; color: #A9A9A2; font-size: 16px; }
  html.ed-on [data-ed], html.ed-on [data-edmd] { outline: 1px dashed transparent; outline-offset: 4px; border-radius: 2px; cursor: text; transition: outline-color 150ms; }
  html.ed-on [data-ed]:hover, html.ed-on [data-edmd]:hover { outline-color: #C9C8C1; }
  html.ed-on [data-ed]:focus, html.ed-on [data-edmd]:focus { outline: 1.5px solid #262624; }
  html.ed-on [data-ed-changed] { background: rgba(239, 232, 204, .55); }
  html.ed-on [data-ed-fixed]:hover { outline: 1px dotted #C9A35A; outline-offset: 4px; cursor: help; }
  .ed-sheet { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 20px; background: rgba(38,38,36,.3); }
  .ed-card { width: min(520px, 100%); padding: 28px; border-radius: 14px; background: #FAFAF7; color: #262624; box-shadow: 0 30px 80px -24px rgba(0,0,0,.4); font: 400 15px/1.55 "Instrument Sans", system-ui, sans-serif; }
  .ed-card h2 { margin: 0 0 10px; font: 400 26px/1.2 "Newsreader", Georgia, serif; }
  .ed-card ol { margin: 12px 0 18px; padding-left: 20px; }
  .ed-card li { margin: 4px 0; }
  .ed-card a { text-decoration: underline; text-underline-offset: 3px; }
  .ed-card input { width: 100%; padding: 12px 14px; border: 1px solid #C9C8C1; border-radius: 8px; background: #fff; font: 14px ui-monospace, monospace; }
  .ed-card .ed-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
  .ed-card button { padding: 10px 18px; border: 1px solid #C9C8C1; border-radius: 999px; background: none; font: 500 14px "Instrument Sans", system-ui, sans-serif; cursor: pointer; }
  .ed-card button.ed-primary { border-color: #262624; background: #262624; color: #FAFAF7; }
  .ed-toast { position: fixed; left: 50%; bottom: 76px; z-index: 60; transform: translateX(-50%); max-width: min(560px, calc(100vw - 40px)); padding: 10px 16px; border-radius: 10px; background: #262624; color: #FAFAF7; font: 400 13px/1.45 "Instrument Sans", system-ui, sans-serif; box-shadow: 0 10px 30px -10px rgba(0,0,0,.45); }
  .ed-fmt { position: absolute; z-index: 61; display: flex; align-items: center; gap: 2px; padding: 4px; border-radius: 10px; background: #262624; color: #FAFAF7; font: 500 13px/1 "Instrument Sans", system-ui, sans-serif; box-shadow: 0 10px 30px -10px rgba(0,0,0,.45); }
  .ed-fmt[hidden], .ed-fmt-link[hidden] { display: none; }
  .ed-fmt button { min-width: 30px; padding: 7px 10px; border: 0; border-radius: 6px; background: none; color: inherit; font: inherit; cursor: pointer; }
  .ed-fmt button:hover { background: rgba(255,255,255,.14); }
  .ed-fmt .ed-tip { padding: 0 8px; color: #B9B9B2; font-weight: 400; }
  .ed-fmt-link { display: flex; align-items: center; gap: 2px; margin-left: 4px; }
  .ed-fmt input { width: min(260px, 50vw); padding: 7px 9px; border: 0; border-radius: 6px; background: #FAFAF7; color: #262624; font: 13px ui-monospace, monospace; }
  .ed-ta { display: block; width: 100%; box-sizing: border-box; padding: 6px 8px; margin-left: -8px; margin-right: -8px; width: calc(100% + 16px); border: 0; border-radius: 4px; outline: 1.5px solid #262624; background: rgba(239, 232, 204, .35); color: inherit; resize: none; overflow: hidden; }
  .ed-toast.is-error { background: #7A2A22; }
`;
document.head.append(Object.assign(document.createElement("style"), { textContent: css }));

let toastTimer;
function toast(msg, error) {
  document.querySelector(".ed-toast")?.remove();
  const t = Object.assign(document.createElement("div"), { className: "ed-toast" + (error ? " is-error" : ""), textContent: msg });
  document.body.append(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), error ? 8000 : 3500);
}

const bar = document.createElement("div");
bar.className = "ed-bar";
document.body.append(bar);

let drawn = "";
function render() {
  const on = root.classList.contains("ed-on");
  const n = pending.size;
  const html = !on
    ? `<button type="button" class="ed-primary" data-act="start">Edit this page</button><button type="button" class="ed-x" data-act="hide" aria-label="Hide the edit bar">×</button>`
    : `<span class="ed-note">${n ? `${n} change${n === 1 ? "" : "s"}` : "Click any text to change it"}</span>` +
      `<button type="button" data-act="cancel">${n ? "Discard" : "Done"}</button>` +
      `<button type="button" class="ed-primary" data-act="publish"${n ? "" : " disabled"}>Publish</button>`;
  // Only redraw when something changed. Redrawing while a button is being clicked swallows the click.
  if (html !== drawn) bar.innerHTML = drawn = html;
}

const SEL = "h1, h2, h3, h4, p, li, figcaption, blockquote, dt, dd, span, a.button, a.arrow-link, strong, em";
// Plain text, or text whose only links were added automatically from site.yml (those come back on their own after publishing)
const autolink = (n) => n.nodeName === "A" && n.hasAttribute("data-autolink") && [...n.childNodes].every((c) => c.nodeType === 3);
const leaf = (el) => [...el.childNodes].every((n) => n.nodeType === 3 || n.nodeName === "BR" || autolink(n)) && el.textContent.trim().length > 1;
const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
function markEditable(pageText) {
  const all = [...main.querySelectorAll(SEL), ...(footer ? footer.querySelectorAll(SEL + ", nav a") : [])];
  all.forEach((el) => {
    if (el.closest("[data-edmd]")) return;
    if (el.closest(".sr, .sr-label, svg, [aria-hidden='true'], .search-dialog, time, .carousel-count, .footer-name, .footer-year")) return;
    if (leaf(el)) { el.dataset.ed = ""; el.contentEditable = "true"; el.spellcheck = true; }
    else if (ownText(el) && main.contains(el) && markHtml(el, pageText)) return;
    else if (ownText(el)) { el.dataset.edFixed = ""; el.title = "This line has links or formatting that can’t be edited here. Ask Claude to change it."; }
  });
}
function unmark() {
  blocks.forEach((b) => b.nodes.forEach((n) => { delete n.dataset.edmd; n.removeAttribute("tabindex"); }));
  blocks = [];
  areas.forEach((a) => a.querySelectorAll("[data-ed]").forEach((el) => { el.removeAttribute("contenteditable"); delete el.dataset.ed; }));
  areas.forEach((a) => a.querySelectorAll("[data-ed-fixed]").forEach((el) => { delete el.dataset.edFixed; el.removeAttribute("title"); }));
}

function askForKey() {
  return new Promise((resolve) => {
    const sheet = document.createElement("div");
    sheet.className = "ed-sheet";
    const make = "https://github.com/settings/personal-access-tokens/new?name=rancraycraft.com%20editor&description=Inline%20editing%20on%20my%20site&target_name=rantbot&expires_in=365&contents=write";
    sheet.innerHTML = `<div class="ed-card" role="dialog" aria-modal="true" aria-labelledby="ed-key-h">
      <h2 id="ed-key-h">One-time setup</h2>
      <p>To publish from the page, this browser needs a key from GitHub that can only change your site’s files.</p>
      <ol>
        <li><a href="${make}" target="_blank" rel="noopener">Open GitHub’s key page</a>.</li>
        <li>Under <strong>Repository access</strong>, choose <strong>Only select repositories</strong> and pick <strong>portfolio</strong>.</li>
        <li>Check that <strong>Contents</strong> is set to <strong>Read and write</strong>, then click <strong>Generate token</strong>.</li>
        <li>Copy the key and paste it here.</li>
      </ol>
      <input type="password" placeholder="github_pat_…" autocomplete="off" spellcheck="false">
      <div class="ed-row"><button type="button" data-k="cancel">Cancel</button><button type="button" class="ed-primary" data-k="save">Save key</button></div>
    </div>`;
    document.body.append(sheet);
    const input = sheet.querySelector("input");
    input.focus();
    const done = async (save) => {
      if (save) {
        const t = input.value.trim();
        if (!t) return input.focus();
        setToken(t);
        try { await gh(""); toast("Key saved. It only lives in this browser."); }
        catch (e) { setToken(""); toast(e.message.includes("401") || e.message.includes("accept") ? "That key didn’t work. Check it can access the portfolio repo." : e.message, true); return; }
      }
      sheet.remove();
      resolve(save);
    };
    sheet.addEventListener("click", (e) => { const k = e.target.closest("[data-k]")?.dataset.k; if (k) done(k === "save"); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
  });
}

async function start() {
  if (!getToken() && !(await askForKey())) return;
  root.classList.add("ed-on");
  blocks = [];
  const pageText = page ? (await readFile(page).catch(() => null))?.text : null;
  if (page && pageText == null) toast("Couldn’t load this page’s source, so lines with links stay locked.", true);
  await markMarkdown(pageText);
  markEditable(pageText);
  render();
}
function stop(discard) {
  if (discard) pending.forEach((v, el) => { if (v.md) setAfter(el, null); else { el.textContent = v.before; delete el.dataset.edChanged; } });
  undos.length = redos.length = 0;
  pending.clear();
  unmark();
  root.classList.remove("ed-on");
  render();
}

async function publish() {
  const btn = bar.querySelector('[data-act="publish"]');
  btn.disabled = true;
  btn.textContent = "Publishing…";
  files.clear(); tree = null; // always start from the latest version on GitHub
  const byFile = new Map();
  const failed = [];
  for (const [el, { before, after, md }] of pending) {
    try {
      const inFooter = !md && !!el.closest(".site-footer");
      const path = md ? el.path : inFooter ? await locateFooter(before) : await locate(before);
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path).push({ el, before, after, inFooter, md });
    } catch (e) { failed.push(e.message); }
  }
  let saved = 0;
  for (const [path, edits] of byFile) {
    try {
      const f = await readFile(path);
      let text = f.text;
      for (const { before, after, inFooter, md } of edits) text = md ? swap(text, before, after) : apply(text, path, before, after, inFooter);
      await gh(`/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message: `Edit copy in ${path.replace(/^src\//, "")}`, content: b64encode(text), sha: f.sha, branch: BRANCH }) });
      edits.forEach(({ el, after, md }) => {
        pending.delete(el);
        if (md) { el.src = after; el.start = el.after; el.after = null; el.orig = el.nodes; show(el, el.nodes); } else delete el.dataset.edChanged;
      });
      undos.length = redos.length = 0;
      saved += edits.length;
    } catch (e) { failed.push(e.message); }
  }
  render();
  if (failed.length) toast(`${saved ? `Published ${saved}. ` : ""}${failed[0]}`, true);
  else { toast(`Published ${saved} change${saved === 1 ? "" : "s"}. The live site updates in about two minutes.`); stop(false); }
}

bar.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "start") start();
  if (act === "cancel") stop(true);
  if (act === "publish") publish();
  if (act === "hide") { try { localStorage.removeItem("show-edit-links"); } catch {} bar.remove(); }
});

// Editing text: Enter finishes a line, Escape undoes it, pasting keeps plain text only
areas.forEach((a) => a.addEventListener("focusin", (e) => { const el = e.target.closest("[data-ed]"); if (el && !pending.has(el)) el.dataset.edBefore = el.textContent; }));
areas.forEach((a) => a.addEventListener("keydown", (e) => {
  const el = e.target.closest("[data-ed]");
  if (!el) return;
  if (e.key === "Enter") { e.preventDefault(); el.blur(); }
  if (e.key === "Escape") { el.textContent = pending.get(el)?.before ?? el.dataset.edBefore; pending.delete(el); delete el.dataset.edChanged; el.blur(); render(); }
}));
areas.forEach((a) => a.addEventListener("paste", (e) => {
  if (!e.target.closest("[data-ed], [data-edmd]")) return;
  e.preventDefault();
  document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " "));
}));
// Count a change as soon as it's typed, so Publish is ready before the line loses focus
areas.forEach((a) => a.addEventListener("input", (e) => {
  const el = e.target.closest("[data-ed]");
  if (!el) return;
  const before = pending.get(el)?.before ?? el.dataset.edBefore;
  const after = el.textContent.replace(/\s+/g, " ").trim();
  if (after && after !== before.replace(/\s+/g, " ").trim()) { pending.set(el, { before, after }); el.dataset.edChanged = ""; }
  else { pending.delete(el); delete el.dataset.edChanged; }
  render();
}));
areas.forEach((a) => a.addEventListener("focusout", (e) => {
  const el = e.target.closest("[data-ed]");
  if (!el) return;
  const before = pending.get(el)?.before ?? el.dataset.edBefore;
  const after = el.textContent.replace(/\s+/g, " ").trim();
  if (!after) { el.textContent = before; pending.delete(el); delete el.dataset.edChanged; toast("A line can’t be empty here. Ask Claude to remove it.", true); }
  else if (after === before.replace(/\s+/g, " ").trim()) { pending.delete(el); delete el.dataset.edChanged; }
  else { pending.set(el, { before, after }); el.dataset.edChanged = ""; }
  render();
}));
// While editing, clicking text inside a link edits it instead of following the link
document.addEventListener("click", (e) => { if (root.classList.contains("ed-on") && e.target.closest("[data-ed], [data-edmd], [data-ed-fixed]") && e.target.closest("a")) e.preventDefault(); }, true);
window.addEventListener("beforeunload", (e) => { if (pending.size) { e.preventDefault(); e.returnValue = ""; } });

// ---- Editing a Markdown block, with a small toolbar for bold, italic, links and lists
const fmt = document.createElement("div");
fmt.className = "ed-fmt";
fmt.hidden = true;
fmt.innerHTML = `<button type="button" data-f="bold" title="Bold (⌘B)" aria-label="Bold"><b>B</b></button>` +
  `<button type="button" data-f="italic" title="Italic (⌘I)" aria-label="Italic"><i>I</i></button>` +
  `<button type="button" data-f="link" title="Link (⌘K)">Link</button>` +
  `<button type="button" data-f="ul" title="Bulleted list (⌘⇧8)" aria-label="Bulleted list">• List</button>` +
  `<button type="button" data-f="ol" title="Numbered list (⌘⇧7)" aria-label="Numbered list">1. List</button>` +
  `<span class="ed-fmt-link" hidden><input type="text" inputmode="url" placeholder="https://…" aria-label="Link address" spellcheck="false"><button type="button" data-f="apply">Save</button><button type="button" data-f="unlink" hidden>Remove</button></span>`;
document.body.append(fmt);
const linkBox = fmt.querySelector(".ed-fmt-link");
const linkInput = linkBox.querySelector("input");
let active = null; // the block being edited
let ta = null; // its text box
let saved = [0, 0]; // the selection, kept while the link box has focus
const undos = [], redos = []; // whole-block changes, for ⌘Z once you've clicked away

const shown = (b) => b.after ?? b.start;
const grow = () => { if (ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; } };
function place() {
  if (!active || !ta) return;
  fmt.hidden = false;
  const r = ta.getBoundingClientRect();
  const h = fmt.offsetHeight;
  const top = r.top > h + 70 ? r.top - h - 10 : r.bottom + 10;
  fmt.style.top = `${top + scrollY}px`;
  fmt.style.left = `${Math.max(8, Math.min(r.left, innerWidth - fmt.offsetWidth - 8)) + scrollX}px`;
}
function remember(undo, redo) { undos.push({ undo, redo }); redos.length = 0; }

function open(block) {
  if (active) close();
  const first = block.nodes[0];
  const cs = getComputedStyle(first.tagName === "UL" || first.tagName === "OL" ? first.querySelector("li") || first : first);
  ta = document.createElement("textarea");
  ta.className = "ed-ta";
  ta.spellcheck = true;
  ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing"].forEach((k) => (ta.style[k] = cs[k]));
  ta.value = shown(block);
  ta._start = ta.value;
  ta._was = block.after;
  active = block;
  show(block, [ta]);
  ta.addEventListener("input", () => { grow(); track(); place(); });
  ta.addEventListener("keydown", keys);
  ta.addEventListener("focusout", (e) => { if (!fmt.contains(e.relatedTarget)) close(); });
  grow();
  ta.focus();
  linkBox.hidden = true;
  fmt.querySelectorAll('[data-f="ul"], [data-f="ol"]').forEach((b) => (b.hidden = block.mode === "html")); // template lines can't hold lists
  place();
}
function track() {
  if (!active) return;
  const v = ta.value.replace(/\s+$/, "");
  if (v.trim() && v !== active.start) pending.set(active, pend(active, v));
  else pending.delete(active);
  render();
}
function close() {
  const block = active, box = ta;
  if (!block) return;
  active = ta = null;
  fmt.hidden = true;
  linkBox.hidden = true;
  let v = box.value.replace(/\s+$/, "");
  if (!v.trim()) { toast("A block can’t be empty here. Ask Claude to remove it.", true); v = box._start; }
  const was = box._was;
  const now = v === block.start ? null : v;
  setAfter(block, now);
  if (now !== was) remember(() => setAfter(block, was), () => setAfter(block, now));
  render();
}

// Changes go through the browser's own typing, so ⌘Z and ⌘⇧Z undo and redo them
function edit(a, b, text, selA, selB = selA) {
  ta.focus();
  ta.setSelectionRange(a, b);
  const ok = text ? document.execCommand("insertText", false, text) : a === b || document.execCommand("delete");
  if (!ok) ta.setRangeText(text, a, b, "end");
  ta.setSelectionRange(selA, selB);
  grow(); track(); place();
}
function trimmed() {
  const v = ta.value;
  let a = ta.selectionStart, b = ta.selectionEnd;
  while (a < b && /\s/.test(v[a])) a++;
  while (b > a && /\s/.test(v[b - 1])) b--;
  return [a, b];
}
function wrap(mark) {
  if (!ta) return;
  const v = ta.value, [a, b] = trimmed(), n = mark.length;
  if (a === b) return toast("Select some words first.");
  if (v.slice(a - n, a) === mark && v.slice(b, b + n) === mark) return edit(a - n, b + n, v.slice(a, b), a - n, b - n);
  edit(a, b, mark + v.slice(a, b) + mark, a + n, b + n);
}
const linkAt = (t, a, b = a) => { const re = /\[([^\]]*)\]\(([^)\s]*)\)/g; let m; while ((m = re.exec(t))) if (a >= m.index && b <= m.index + m[0].length) return m; return null; };
function openLink() {
  if (!ta) return;
  saved = [ta.selectionStart, ta.selectionEnd];
  const m = linkAt(ta.value, ...saved);
  if (!m && saved[0] === saved[1]) return toast("Select the words you want to link.");
  linkBox.hidden = false;
  fmt.querySelector('[data-f="unlink"]').hidden = !m;
  linkInput.value = m ? m[2] : "";
  place();
  linkInput.focus();
  linkInput.select();
}
function saveLink(remove) {
  if (!ta) return;
  let url = linkInput.value.trim();
  if (url && !/^(https?:|mailto:|\/|#)/i.test(url)) url = (/^[^\s/]+@[^\s/]+\.\w+$/.test(url) ? "mailto:" : "https://") + url;
  linkBox.hidden = true;
  const v = ta.value, m = linkAt(v, ...saved);
  if (m) {
    const out = remove || !url ? m[1] : `[${m[1]}](${url})`;
    return edit(m.index, m.index + m[0].length, out, m.index, m.index + out.length);
  }
  ta.setSelectionRange(...saved);
  const [a, b] = trimmed();
  if (!url || a === b) { ta.focus(); return; }
  const out = `[${v.slice(a, b)}](${url})`;
  edit(a, b, out, a, a + out.length);
}
// Turn the selected lines into a list, switch the kind of list, or take the list away
function list(kind) {
  if (!ta || active.mode === "html") return;
  const v = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
  const s = v.lastIndexOf("\n", a - 1) + 1;
  let e = v.indexOf("\n", b > a && v[b - 1] === "\n" ? b - 1 : b);
  if (e < 0) e = v.length;
  const lines = v.slice(s, e).split("\n").filter((l) => l.trim());
  const isKind = (l) => (kind === "ul" ? /^\s*[-*+]\s+/ : /^\s*\d+[.)]\s+/).test(l);
  const off = lines.length && lines.every(isKind);
  let n = 0;
  const out = off
    ? lines.map((l) => l.replace(ITEM, "").trim()).join("\n\n") // separate paragraphs again
    : lines.map((l) => { const ind = l.match(/^\s*/)[0]; return ind + (kind === "ul" ? "- " : `${++n}. `) + l.replace(ITEM, "").trim(); }).join("\n");
  edit(s, e, out, s + out.length);
}
function keys(e) {
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === "Escape") { e.preventDefault(); ta.value = ta._start; ta.blur(); return; }
  if (e.key === "Enter" && (mod || active?.mode === "html")) { e.preventDefault(); ta.blur(); return; } // template lines are a single line
  if (mod && e.shiftKey && (e.code === "Digit8" || e.code === "Digit7")) { e.preventDefault(); return list(e.code === "Digit8" ? "ul" : "ol"); }
  if (mod && !e.shiftKey && /^[bik]$/i.test(e.key)) {
    e.preventDefault();
    e.stopPropagation(); // ⌘K opens search everywhere else
    return ({ b: () => wrap("**"), i: () => wrap("*"), k: openLink })[e.key.toLowerCase()]();
  }
  // Enter in a list starts the next item. Enter on an empty item ends the list.
  if (e.key === "Enter" && !e.shiftKey && !mod && ta.selectionStart === ta.selectionEnd) {
    const v = ta.value, a = ta.selectionStart, s = v.lastIndexOf("\n", a - 1) + 1;
    const m = v.slice(s, a).match(ITEM);
    if (!m) return;
    e.preventDefault();
    let end = v.indexOf("\n", a); if (end < 0) end = v.length;
    if (!v.slice(s, end).replace(ITEM, "").trim()) return edit(s, end, "\n", s + 1);
    const next = m[3] ? `${+m[3] + 1}${m[4]} ` : `${m[2]} `;
    edit(a, a, "\n" + m[1] + next, a + 1 + m[1].length + next.length);
  }
}

// Keep the cursor in the text when a toolbar button is pressed
fmt.addEventListener("mousedown", (e) => { if (!e.target.closest("input")) e.preventDefault(); });
fmt.addEventListener("click", (e) => {
  const f = e.target.closest("[data-f]")?.dataset.f;
  if (f === "bold") wrap("**");
  if (f === "italic") wrap("*");
  if (f === "link") linkBox.hidden ? openLink() : saveLink(false);
  if (f === "apply") saveLink(false);
  if (f === "unlink") saveLink(true);
  if (f === "ul" || f === "ol") list(f);
});
linkInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); saveLink(false); }
  if (e.key === "Escape") { e.preventDefault(); linkBox.hidden = true; ta.focus(); ta.setSelectionRange(...saved); }
  e.stopPropagation();
});
linkInput.addEventListener("focusout", (e) => { if (active && e.relatedTarget !== ta && !fmt.contains(e.relatedTarget)) close(); });
main.addEventListener("click", (e) => {
  const n = root.classList.contains("ed-on") && e.target.closest("[data-edmd]");
  if (n?._block) { e.preventDefault(); open(n._block); }
});
main.addEventListener("keydown", (e) => {
  const n = e.target.closest?.("[data-edmd]");
  if (n?._block && e.key === "Enter") { e.preventDefault(); open(n._block); }
});
addEventListener("resize", place);

// Plain lines keep their own history too, so ⌘Z after clicking away undoes the whole line
areas.forEach((a) => a.addEventListener("focusin", (e) => { const el = e.target.closest("[data-ed]"); if (el) el._at = { text: el.textContent, pend: pending.get(el) }; }));
const setPlain = (el, s) => { el.textContent = s.text; if (s.pend) { pending.set(el, s.pend); el.dataset.edChanged = ""; } else { pending.delete(el); delete el.dataset.edChanged; } };
areas.forEach((a) => a.addEventListener("focusout", (e) => {
  const el = e.target.closest("[data-ed]");
  const at = el?._at;
  if (!at) return;
  el._at = null;
  if (el.textContent === at.text) return;
  const now = { text: el.textContent, pend: pending.get(el) };
  remember(() => setPlain(el, at), () => setPlain(el, now));
}));
// ⌘Z and ⌘⇧Z outside a text box step back and forward through whole changes
document.addEventListener("keydown", (e) => {
  if (!root.classList.contains("ed-on") || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
  const t = document.activeElement;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName))) return; // the browser handles those
  e.preventDefault();
  const step = (e.shiftKey ? redos : undos).pop();
  if (!step) return toast(e.shiftKey ? "Nothing to redo." : "Nothing to undo.");
  (e.shiftKey ? step.redo : step.undo)();
  (e.shiftKey ? undos : redos).push(step);
  render();
});

render();
