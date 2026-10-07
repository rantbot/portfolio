// Inline editing for Ran. Loaded only after visiting a page with ?edit (see the end of site.js); visitors never load it.
// Changes are saved straight to the GitHub repo with a key Ran pastes in once. It only lives in this browser.
const REPO = "rantbot/portfolio";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}`;
const KEY_TOKEN = "edit-github-token";

const page = document.querySelector('meta[name="edit-source"]')?.content?.replace(/^\.\//, "") || "";
const main = document.querySelector("main");
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

function apply(text, path, before, after) {
  const re = finder(before);
  const at = text.search(re);
  const isHtml = /\.(njk|html)$/.test(path) && !inFrontMatter(text, at);
  const isYaml = /\.ya?ml$/.test(path) || inFrontMatter(text, at);
  const value = isHtml ? after.replace(/&/g, "&amp;").replace(/</g, "&lt;") : after;
  return fixYaml(text.replace(re, () => value), value, isYaml);
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
  html.ed-on [data-ed] { outline: 1px dashed transparent; outline-offset: 4px; border-radius: 2px; cursor: text; transition: outline-color 150ms; }
  html.ed-on [data-ed]:hover { outline-color: #C9C8C1; }
  html.ed-on [data-ed]:focus { outline: 1.5px solid #262624; }
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

function render() {
  const on = root.classList.contains("ed-on");
  const n = pending.size;
  if (!on) {
    bar.innerHTML = `<button type="button" class="ed-primary" data-act="start">Edit this page</button><button type="button" class="ed-x" data-act="hide" aria-label="Hide the edit bar">×</button>`;
  } else {
    bar.innerHTML = `<span class="ed-note">${n ? `${n} change${n === 1 ? "" : "s"}` : "Click any text to change it"}</span>` +
      `<button type="button" data-act="cancel">${n ? "Discard" : "Done"}</button>` +
      `<button type="button" class="ed-primary" data-act="publish"${n ? "" : " disabled"}>Publish</button>`;
  }
}

const SEL = "h1, h2, h3, h4, p, li, figcaption, blockquote, dt, dd, span, a.button, a.arrow-link, strong, em";
// Plain text, or text whose only links were added automatically from site.yml (those come back on their own after publishing)
const autolink = (n) => n.nodeName === "A" && n.hasAttribute("data-autolink") && [...n.childNodes].every((c) => c.nodeType === 3);
const leaf = (el) => [...el.childNodes].every((n) => n.nodeType === 3 || n.nodeName === "BR" || autolink(n)) && el.textContent.trim().length > 1;
const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
function markEditable() {
  main.querySelectorAll(SEL).forEach((el) => {
    if (el.closest(".sr, .sr-label, svg, [aria-hidden='true'], .search-dialog, time, .carousel-count")) return;
    if (leaf(el)) { el.dataset.ed = ""; el.contentEditable = "true"; el.spellcheck = true; }
    else if (ownText(el)) { el.dataset.edFixed = ""; el.title = "This line has links or formatting. Ask Claude to change it for now."; }
  });
}
function unmark() {
  main.querySelectorAll("[data-ed]").forEach((el) => { el.removeAttribute("contenteditable"); delete el.dataset.ed; });
  main.querySelectorAll("[data-ed-fixed]").forEach((el) => { delete el.dataset.edFixed; el.removeAttribute("title"); });
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
  markEditable();
  render();
}
function stop(discard) {
  if (discard) pending.forEach((v, el) => { el.textContent = v.before; delete el.dataset.edChanged; });
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
  for (const [el, { before, after }] of pending) {
    try {
      const path = await locate(before);
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path).push({ el, before, after });
    } catch (e) { failed.push(e.message); }
  }
  let saved = 0;
  for (const [path, edits] of byFile) {
    try {
      const f = await readFile(path);
      let text = f.text;
      for (const { before, after } of edits) text = apply(text, path, before, after);
      await gh(`/contents/${encodeURI(path)}`, { method: "PUT", body: JSON.stringify({ message: `Edit copy in ${path.replace(/^src\//, "")}`, content: b64encode(text), sha: f.sha, branch: BRANCH }) });
      edits.forEach(({ el }) => { pending.delete(el); delete el.dataset.edChanged; });
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
main.addEventListener("focusin", (e) => { const el = e.target.closest("[data-ed]"); if (el && !pending.has(el)) el.dataset.edBefore = el.textContent; });
main.addEventListener("keydown", (e) => {
  const el = e.target.closest("[data-ed]");
  if (!el) return;
  if (e.key === "Enter") { e.preventDefault(); el.blur(); }
  if (e.key === "Escape") { el.textContent = pending.get(el)?.before ?? el.dataset.edBefore; pending.delete(el); delete el.dataset.edChanged; el.blur(); render(); }
});
main.addEventListener("paste", (e) => {
  if (!e.target.closest("[data-ed]")) return;
  e.preventDefault();
  document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " "));
});
main.addEventListener("focusout", (e) => {
  const el = e.target.closest("[data-ed]");
  if (!el) return;
  const before = pending.get(el)?.before ?? el.dataset.edBefore;
  const after = el.textContent.replace(/\s+/g, " ").trim();
  if (!after) { el.textContent = before; pending.delete(el); delete el.dataset.edChanged; toast("A line can’t be empty here. Ask Claude to remove it.", true); }
  else if (after === before.replace(/\s+/g, " ").trim()) { pending.delete(el); delete el.dataset.edChanged; }
  else { pending.set(el, { before, after }); el.dataset.edChanged = ""; }
  render();
});
// While editing, clicking text inside a link edits it instead of following the link
document.addEventListener("click", (e) => { if (root.classList.contains("ed-on") && e.target.closest("[data-ed], [data-ed-fixed]") && e.target.closest("a")) e.preventDefault(); }, true);
window.addEventListener("beforeunload", (e) => { if (pending.size) { e.preventDefault(); e.returnValue = ""; } });

render();
