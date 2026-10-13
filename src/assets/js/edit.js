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

// ---- Markdown lines
// On a page written in Markdown, a line opens as its Markdown source when clicked,
// so links and formatting can be changed too. **bold**, *italic*, [words](https://address)
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
// Each paragraph, heading, list item or quote line in the body, exactly as it's written in the file
function mdLines(text) {
  const fm = text.match(/^---\n[\s\S]*?\n---\n/);
  const out = [];
  let para = [], fence = false, comment = false;
  const flush = () => { if (para.length) out.push(para.join("\n")); para = []; };
  for (const line of text.slice(fm ? fm[0].length : 0).split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; flush(); continue; }
    if (fence) continue;
    if (comment) { if (line.includes("-->")) comment = false; continue; }
    if (/^\s*<!--/.test(line) && !line.includes("-->")) { flush(); comment = true; continue; }
    const m = line.match(/^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)(.*)$/);
    if (!line.trim() || /^\s*(<|\{[%{]|---\s*$)/.test(line)) flush();
    else if (m) { flush(); if (m[1].trim()) out.push(m[1]); }
    else para.push(line);
  }
  flush();
  return out;
}
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const safeUrl = (u) => (/^(https?:|mailto:|\/|#)/i.test(u) ? u : "#");
// A quick preview of the line. The site draws the real thing when it publishes.
const renderInline = (md) => esc(md)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${safeUrl(u)}">${t}</a>`)
  .replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>")
  .replace(/\*(?!\s)(.+?)\*/g, "<em>$1</em>")
  .replace(/(?<!\w)_(?!\s)(.+?)_(?!\w)/g, "<em>$1</em>")
  .replace(/`([^`]+)`/g, "<code>$1</code>");
const swap = (text, before, after) => {
  const i = text.indexOf(before);
  if (i < 0 || text.indexOf(before, i + 1) >= 0) throw new Error("A line changed on GitHub since this page loaded. Reload the page and try again.");
  return text.slice(0, i) + after + text.slice(i + before.length);
};
async function markMarkdown() {
  if (!isMd) return;
  let lines;
  try { lines = mdLines((await readFile(page)).text); }
  catch (e) { toast(`Couldn’t load this page’s Markdown, so lines with links stay locked. ${e.message}`, true); return; }
  const byText = new Map();
  lines.forEach((src) => { const k = stripMd(src); if (k) byText.set(k, byText.has(k) ? null : src); }); // null means it's written twice
  const used = new Set();
  main.querySelectorAll("p, li, h2, h3, h4, h5, h6, blockquote, dd, figcaption").forEach((el) => {
    if (el.closest(".sr, svg, [aria-hidden='true'], .search-dialog") || el.querySelector("p, ul, ol, div, blockquote, img, figure")) return;
    const src = byText.get(plainish(el.textContent));
    if (!src || used.has(src)) return;
    used.add(src);
    el.dataset.edmd = ""; el.contentEditable = "true"; el.spellcheck = true;
    el._src = src; el._html = el.innerHTML;
  });
}

// ---- Interface
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
function markEditable() {
  const all = [...main.querySelectorAll(SEL), ...(footer ? footer.querySelectorAll(SEL + ", nav a") : [])];
  all.forEach((el) => {
    if (el.closest("[data-edmd]")) return;
    if (el.closest(".sr, .sr-label, svg, [aria-hidden='true'], .search-dialog, time, .carousel-count, .footer-name, .footer-year")) return;
    if (leaf(el)) { el.dataset.ed = ""; el.contentEditable = "true"; el.spellcheck = true; }
    else if (ownText(el)) { el.dataset.edFixed = ""; el.title = "This line has links or formatting that can’t be edited here. Ask Claude to change it."; }
  });
}
function unmark() {
  main.querySelectorAll("[data-edmd]").forEach((el) => { el.removeAttribute("contenteditable"); el.classList.remove("ed-src"); delete el.dataset.edmd; });
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
  await markMarkdown();
  markEditable();
  render();
}
function stop(discard) {
  if (discard) pending.forEach((v, el) => { if (v.md) el.innerHTML = el._html; else el.textContent = v.before; delete el.dataset.edChanged; });
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
      const inFooter = !!el.closest(".site-footer");
      const path = md ? page : inFooter ? await locateFooter(before) : await locate(before);
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
      edits.forEach(({ el, after, md }) => { pending.delete(el); delete el.dataset.edChanged; if (md) { el._src = after; el._html = el.innerHTML; } });
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

// ---- Editing a Markdown line, with a small toolbar for bold, italic and links
const fmt = document.createElement("div");
fmt.className = "ed-fmt";
fmt.hidden = true;
fmt.innerHTML = `<button type="button" data-f="bold" title="Bold (⌘B)" aria-label="Bold"><b>B</b></button>` +
  `<button type="button" data-f="italic" title="Italic (⌘I)" aria-label="Italic"><i>I</i></button>` +
  `<button type="button" data-f="link" title="Link (⌘K)">Link</button>` +
  `<span class="ed-fmt-link" hidden><input type="text" inputmode="url" placeholder="https://…" aria-label="Link address" spellcheck="false"><button type="button" data-f="apply">Save</button><button type="button" data-f="unlink" hidden>Remove</button></span>`;
document.body.append(fmt);
const linkBox = fmt.querySelector(".ed-fmt-link");
const linkInput = linkBox.querySelector("input");
let active = null; // the line being edited
let saved = [0, 0]; // the selection, kept while the link box has focus
const flat = (s) => s.replace(/\s+/g, " ").trim();

function offsets(el) {
  const s = getSelection();
  const n = el.textContent.length;
  if (!s.rangeCount || !el.contains(s.anchorNode)) return [n, n];
  const r = s.getRangeAt(0), pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(r.startContainer, r.startOffset);
  const a = pre.toString().length;
  return [a, Math.min(n, a + r.toString().length)];
}
function select(el, a, b = a) {
  if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) el.textContent = el.textContent;
  const t = el.firstChild || el.appendChild(document.createTextNode(""));
  const r = document.createRange();
  r.setStart(t, Math.min(a, t.length)); r.setEnd(t, Math.min(b, t.length));
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
}
function track(el) {
  const after = flat(el.textContent);
  if (after && after !== flat(el._src)) { pending.set(el, { before: el._src, after, md: true }); el.dataset.edChanged = ""; }
  else { pending.delete(el); delete el.dataset.edChanged; }
  render();
}
function setText(el, text, a, b) { el.textContent = text; el.focus(); select(el, a, b); track(el); place(); }
function place() {
  if (!active) return;
  fmt.hidden = false;
  const r = active.getBoundingClientRect();
  const h = fmt.offsetHeight;
  const top = r.top > h + 70 ? r.top - h - 10 : r.bottom + 10;
  fmt.style.top = `${top + scrollY}px`;
  fmt.style.left = `${Math.max(8, Math.min(r.left, innerWidth - fmt.offsetWidth - 8)) + scrollX}px`;
}
function open(el) {
  active = el;
  el.textContent = flat(pending.get(el)?.after ?? el._src);
  el.classList.add("ed-src");
  linkBox.hidden = true;
  place();
}
function close(el) {
  const after = flat(el.textContent);
  el.classList.remove("ed-src");
  active = null;
  fmt.hidden = true;
  linkBox.hidden = true;
  if (!after) { pending.delete(el); delete el.dataset.edChanged; el.innerHTML = el._html; toast("A line can’t be empty here. Ask Claude to remove it.", true); }
  else if (after === flat(el._src)) { pending.delete(el); delete el.dataset.edChanged; el.innerHTML = el._html; }
  else { pending.set(el, { before: el._src, after, md: true }); el.dataset.edChanged = ""; el.innerHTML = renderInline(after); }
  render();
}
function wrap(mark) {
  const el = active;
  if (!el) return;
  const t = el.textContent;
  let [a, b] = offsets(el);
  while (a < b && t[a] === " ") a++;
  while (b > a && t[b - 1] === " ") b--;
  if (a === b) return toast("Select some words first.");
  const n = mark.length;
  if (t.slice(a - n, a) === mark && t.slice(b, b + n) === mark) return setText(el, t.slice(0, a - n) + t.slice(a, b) + t.slice(b + n), a - n, b - n);
  setText(el, t.slice(0, a) + mark + t.slice(a, b) + mark + t.slice(b), a + n, b + n);
}
const linkAt = (t, a, b = a) => { const re = /\[([^\]]*)\]\(([^)\s]*)\)/g; let m; while ((m = re.exec(t))) if (a >= m.index && b <= m.index + m[0].length) return m; return null; };
function openLink() {
  const el = active;
  if (!el) return;
  saved = offsets(el);
  const m = linkAt(el.textContent, ...saved);
  if (!m && saved[0] === saved[1]) return toast("Select the words you want to link.");
  linkBox.hidden = false;
  fmt.querySelector('[data-f="unlink"]').hidden = !m;
  linkInput.value = m ? m[2] : "";
  place();
  linkInput.focus();
  linkInput.select();
}
function saveLink(remove) {
  const el = active;
  if (!el) return;
  let url = linkInput.value.trim();
  if (url && !/^(https?:|mailto:|\/|#)/i.test(url)) url = (/^[^\s/]+@[^\s/]+\.\w+$/.test(url) ? "mailto:" : "https://") + url;
  linkBox.hidden = true;
  const t = el.textContent;
  const m = linkAt(t, ...saved);
  if (m) {
    const out = remove || !url ? m[1] : `[${m[1]}](${url})`;
    return setText(el, t.slice(0, m.index) + out + t.slice(m.index + m[0].length), m.index, m.index + out.length);
  }
  let [a, b] = saved;
  while (a < b && t[a] === " ") a++;
  while (b > a && t[b - 1] === " ") b--;
  if (!url || a === b) { el.focus(); return select(el, ...saved); }
  const out = `[${t.slice(a, b)}](${url})`;
  setText(el, t.slice(0, a) + out + t.slice(b), a, a + out.length);
}

// Keep the cursor in the line when a toolbar button is pressed
fmt.addEventListener("mousedown", (e) => { if (!e.target.closest("input")) e.preventDefault(); });
fmt.addEventListener("click", (e) => {
  const f = e.target.closest("[data-f]")?.dataset.f;
  if (f === "bold") wrap("**");
  if (f === "italic") wrap("*");
  if (f === "link") linkBox.hidden ? openLink() : saveLink(false);
  if (f === "apply") saveLink(false);
  if (f === "unlink") saveLink(true);
});
linkInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); saveLink(false); }
  if (e.key === "Escape") { e.preventDefault(); linkBox.hidden = true; active.focus(); select(active, ...saved); }
  e.stopPropagation();
});
linkInput.addEventListener("focusout", (e) => { if (active && e.relatedTarget !== active && !fmt.contains(e.relatedTarget)) close(active); });
main.addEventListener("focusin", (e) => { const el = e.target.closest("[data-edmd]"); if (el && el !== active) { if (active) close(active); open(el); } });
main.addEventListener("focusout", (e) => {
  const el = e.target.closest("[data-edmd]");
  if (el && el === active && !fmt.contains(e.relatedTarget)) close(el);
});
main.addEventListener("input", (e) => { const el = e.target.closest("[data-edmd]"); if (el) { track(el); place(); } });
main.addEventListener("keydown", (e) => {
  const el = e.target.closest("[data-edmd]");
  if (!el) return;
  const mod = e.metaKey || e.ctrlKey;
  if (e.key === "Enter") { e.preventDefault(); el.blur(); }
  else if (e.key === "Escape") { e.preventDefault(); el.textContent = flat(el._src); el.blur(); }
  else if (mod && /^[bik]$/i.test(e.key)) {
    e.preventDefault();
    e.stopPropagation(); // ⌘K opens search everywhere else
    ({ b: () => wrap("**"), i: () => wrap("*"), k: openLink })[e.key.toLowerCase()]();
  }
});
addEventListener("resize", place);

render();
