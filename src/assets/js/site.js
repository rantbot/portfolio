// Email links: unscramble the address and turn it into a mailto link.
document.querySelectorAll("a[data-e]").forEach((a) => {
  try {
    const address = atob(a.dataset.e).split("").reverse().join("");
    const params = [];
    if (a.dataset.subject) params.push("subject=" + encodeURIComponent(a.dataset.subject));
    if (a.dataset.body) params.push("body=" + encodeURIComponent(a.dataset.body.replace(/\\n/g, "\n")));
    a.href = "mailto:" + address + (params.length ? "?" + params.join("&") : "");
    if (!("keepLabel" in a.dataset)) a.textContent = address;
  } catch (e) {}
});

// Leading carousel: arrow buttons scroll by one card, and a counter shows where you are.
// Without JavaScript, the row still scrolls and swipes.
document.querySelectorAll(".carousel").forEach((track) => {
  const section = track.closest("section");
  const buttons = section.querySelectorAll(".carousel-btn");
  const count = section.querySelector(".carousel-count");
  const cards = track.querySelectorAll("li");
  const bar = section.querySelector(".carousel-progress span");
  const step = () => (cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth);
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    const s = step();
    const first = Math.min(cards.length, Math.round(track.scrollLeft / s) + 1);
    const visible = Math.max(1, Math.floor((track.clientWidth - 32) / s + 0.15));
    const last = track.scrollLeft >= max ? cards.length : Math.min(cards.length, first + visible - 1);
    buttons.forEach((b) => {
      b.hidden = max <= 0;
      b.disabled = Number(b.dataset.dir) < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
    if (bar) {
      const shown = Math.min(1, track.clientWidth / track.scrollWidth);
      bar.style.width = `${shown * 100}%`;
      bar.style.transform = `translateX(${max > 0 ? (track.scrollLeft / max) * ((1 - shown) / shown) * 100 : 0}%)`;
    }
    if (count) {
      count.hidden = max <= 0;
      count.textContent = (first === last ? first : `${first}–${last}`) + ` of ${cards.length}`;
    }
  };
  buttons.forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: Number(b.dataset.dir) * step(), behavior: "smooth" })));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});

// Skill panels: tabs for each way to install, and copy buttons for the commands.
document.querySelectorAll(".skill").forEach((skill) => {
  const tabs = skill.querySelector(".skill-tabs");
  const panels = skill.querySelectorAll(".skill-panel");
  if (tabs) {
    tabs.hidden = false;
    const show = (name) => {
      tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
      panels.forEach((p) => (p.hidden = p.dataset.panel !== name));
    };
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-tab]");
      if (b) show(b.dataset.tab);
    });
    show("npx");
  }
  skill.querySelectorAll(".copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.parentElement.querySelector("code").textContent;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        btn.dataset.copied = "";
        setTimeout(() => { btn.textContent = "Copy"; delete btn.dataset.copied; }, 1600);
      } catch (e) {}
    });
  });
});

// Feed: on a mouse or trackpad, a Making piece's picture appears in the empty rail
// beside the list, following the cursor up and down so it never covers the text.
if (window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 821px)").matches) {
  const peek = document.createElement("div");
  peek.className = "peek";
  peek.setAttribute("aria-hidden", "true");
  document.body.appendChild(peek);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let x = 0, y = 0, tx = 0, ty = 0, frame = 0;
  const move = () => {
    x += (tx - x) * (still ? 1 : 0.2);
    y += (ty - y) * (still ? 1 : 0.2);
    peek.style.translate = `${x}px ${y}px`;
    frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(move) : 0;
  };
  const place = (e, line) => {
    const rail = line.closest(".grid").querySelector(".rail").getBoundingClientRect();
    peek.style.width = `${Math.min(rail.width, 300)}px`;
    const h = peek.offsetHeight || 200;
    tx = rail.left;
    ty = Math.min(Math.max(e.clientY - h / 2, 16), window.innerHeight - h - 16);
    if (!frame) frame = requestAnimationFrame(move);
  };
  document.querySelectorAll(".line.has-thumb").forEach((line) => {
    const thumb = line.querySelector(".line-thumb");
    line.addEventListener("pointerenter", (e) => {
      const wasOn = peek.classList.contains("on");
      peek.innerHTML = thumb.innerHTML;
      peek.querySelectorAll("img").forEach((img) => (img.loading = "eager"));
      place(e, line);
      if (!wasOn) { x = tx; y = ty; peek.style.translate = `${x}px ${y}px`; }
      peek.classList.add("on");
    });
    line.addEventListener("pointermove", (e) => place(e, line));
    line.addEventListener("pointerleave", () => peek.classList.remove("on"));
  });
}

// Posts: the left and right arrow keys move to the older and newer post.
// Ignored while typing, with a modifier key held, or inside something that scrolls sideways.
const postNav = { ArrowLeft: document.querySelector('a[data-nav="older"]'), ArrowRight: document.querySelector('a[data-nav="newer"]') };
if (postNav.ArrowLeft || postNav.ArrowRight) {
  const tip = document.querySelector(".post-nav-keys");
  if (tip && window.matchMedia("(hover: hover) and (pointer: fine)").matches) tip.hidden = false;
  document.addEventListener("keydown", (e) => {
    const link = postNav[e.key];
    if (!link || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target;
    if (t.isContentEditable || t.closest("input, textarea, select, pre, [role=tablist], .carousel")) return;
    link.click();
  });
}

// Recent dates in lists and cards read as "Yesterday" or "3 days ago", worked out in the reader's own time zone
// so they never go stale. Anything a month or older, or dated ahead, keeps the date. The full date shows on hover.
(() => {
  const times = document.querySelectorAll("time[data-relative]");
  if (!times.length) return;
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  times.forEach((t) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t.getAttribute("datetime") || "");
    if (!m) return;
    const days = Math.round((today - Date.UTC(+m[1], m[2] - 1, +m[3])) / 86400000);
    let label = "";
    if (days === 0) label = "Today";
    else if (days === 1) label = "Yesterday";
    else if (days > 1 && days < 7) label = `${days} days ago`;
    else if (days >= 7 && days < 14) label = "Last week";
    else if (days >= 14 && days < 30) label = `${Math.floor(days / 7)} weeks ago`;
    if (!label) return;
    t.title = new Date(Date.UTC(+m[1], m[2] - 1, +m[3])).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    t.textContent = label;
  });
})();

// Phone menu. The button opens a full-screen menu, Escape or Close shuts it, and focus stays inside while it's open.
// Without JavaScript the button jumps to #menu and CSS shows it with :target.
(() => {
  const menu = document.getElementById("menu");
  const open = document.querySelector(".menu-btn");
  if (!menu || !open) return;
  const close = menu.querySelector(".menu-close");
  const root = document.documentElement;
  menu.setAttribute("role", "dialog");
  menu.setAttribute("aria-modal", "true");
  menu.hidden = true;
  menu.dataset.js = "";
  const focusables = () => [...menu.querySelectorAll("a[href], button")].filter((el) => el.offsetParent !== null);
  const show = () => {
    menu.hidden = false;
    requestAnimationFrame(() => root.classList.add("menu-open"));
    open.setAttribute("aria-expanded", "true");
    setTimeout(() => close.focus({ preventScroll: true }), 50);
  };
  const hide = (returnFocus = true) => {
    root.classList.remove("menu-open");
    open.setAttribute("aria-expanded", "false");
    const done = () => { if (!root.classList.contains("menu-open")) menu.hidden = true; };
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? done() : setTimeout(done, 320);
    if (returnFocus) open.focus({ preventScroll: true });
  };
  open.addEventListener("click", (e) => { e.preventDefault(); show(); });
  close.addEventListener("click", (e) => { e.preventDefault(); hide(); });
  menu.addEventListener("click", (e) => { if (e.target.closest("a[href]") && e.target.closest("a") !== close) hide(false); });
  document.addEventListener("keydown", (e) => {
    if (!root.classList.contains("menu-open")) return;
    if (e.key === "Escape") hide();
    if (e.key === "Tab") {
      const els = focusables();
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia("(min-width: 821px)").addEventListener("change", (m) => { if (m.matches && root.classList.contains("menu-open")) hide(false); });
})();

// Phone header: a hairline appears under the sticky header once the page scrolls.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => header.classList.toggle("is-stuck", !e.isIntersecting)).observe(sentinel);
})();

// Search. A small index (/search.json) loads the first time someone searches, then every keystroke filters it here.
// The header icon opens a panel; "/" or Cmd/Ctrl+K open it from anywhere. /search/ uses the same code on a full page.
(() => {
  let index = null;
  const load = () => (index ||= fetch("/search.json").then((r) => r.json()).catch(() => []));
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’‘]/g, "'");
  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Short words (three letters or fewer) only match at the start of a word, so "ai" finds AI but not "again".
  const pattern = (t) => (t.length <= 3 ? `(?<![\\p{L}\\p{N}])${reEsc(t)}` : reEsc(t));
  const has = (field, t) => (t.length <= 3 ? new RegExp(pattern(t), "u").test(field) : field.includes(t));
  const mark = (text, terms) => {
    const out = esc(text);
    if (!terms.length) return out;
    const re = new RegExp(`(${terms.map((t) => pattern(esc(t))).join("|")})`, "giu");
    return out.replace(re, "<mark>$1</mark>");
  };
  const when = (y) => (y ? new Date(y + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "");
  const snippet = (item, terms) => {
    if (item.d && terms.some((t) => has(fold(item.d), t))) return item.d;
    const body = item.x || "";
    const at = terms.map((t) => fold(body).search(new RegExp(pattern(t), "u"))).filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (at === undefined) return item.d || body.slice(0, 150);
    const start = Math.max(0, body.lastIndexOf(" ", Math.max(0, at - 60)) + 1);
    return (start > 0 ? "… " : "") + body.slice(start, start + 170).replace(/\s\S*$/, "") + " …";
  };
  const search = (items, q) => {
    const terms = fold(q).split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t));
    if (!terms.length) return { terms, hits: [] };
    const hits = [];
    for (const it of items) {
      const f = { t: fold(it.t), m: fold(it.m + " " + it.k), d: fold(it.d), x: fold(it.x) };
      let score = 0;
      for (const t of terms) {
        const word = new RegExp(`(^|[^a-z0-9])${reEsc(t)}`);
        const s = (word.test(f.t) ? 12 : has(f.t, t) ? 7 : 0) + (has(f.m, t) ? 4 : 0) + (word.test(f.d) ? 4 : has(f.d, t) ? 2 : 0) + (has(f.x, t) ? 1 : 0);
        if (!s) { score = 0; break; }
        score += s;
      }
      if (score) hits.push({ it, score: score + (it.y ? Number(it.y.slice(0, 4)) / 10000 : 0) });
    }
    hits.sort((a, b) => b.score - a.score);
    return { terms, hits: hits.slice(0, 12).map((h) => h.it) };
  };

  // The same drawings as src/_includes/icons.njk
  const KIND_ICONS = {
    Leading: '<circle cx="10" cy="10" r="7.25"/><path d="M10 5.5 12 10l-2 4.5L8 10z"/>',
    Writing: '<path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h7.5"/>',
    Making: '<path d="M10 2.75 16.5 6.5v7L10 17.25 3.5 13.5v-7z"/><path d="M3.5 6.5 10 10l6.5-3.5M10 10v7.25"/>',
  };
  const ideas = ["AI", "thoughtbot", "Ruby Central", "cookbook", "Slack", "neighborhood"];
  const setup = (root, { onPick } = {}) => {
    const input = root.querySelector(".search-input");
    const list = root.querySelector(".search-results");
    const status = root.querySelector(".search-status");
    let active = -1;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    list.id ||= input.id + "-results";
    input.setAttribute("aria-controls", list.id);
    const setActive = (i) => {
      const opts = [...list.querySelectorAll(".search-hit")];
      opts.forEach((o, n) => o.setAttribute("aria-selected", String(n === i)));
      active = opts.length ? Math.max(-1, Math.min(i, opts.length - 1)) : -1;
      if (active >= 0) { input.setAttribute("aria-activedescendant", opts[active].id); opts[active].scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
    };
    const hint = () => {
      list.innerHTML = "";
      input.setAttribute("aria-expanded", "false");
      status.innerHTML = "Try " + ideas.map((w) => `<button type="button" class="search-idea">${esc(w)}</button>`).join(" ");
    };
    const render = async () => {
      const q = input.value.trim();
      if (!q) return hint();
      const { terms, hits } = search(await load(), q);
      if (input.value.trim() !== q) return;
      list.innerHTML = hits.map((it, n) => {
        const meta = [it.k, it.y ? when(it.y) : it.m].filter(Boolean).join(" · ");
        const glyph = KIND_ICONS[it.k] ? `<svg class="icon kind-icon" viewBox="0 0 20 20" aria-hidden="true">${KIND_ICONS[it.k]}</svg>` : "";
        return `<li><a class="search-hit" id="${list.id}-${n}" role="option" aria-selected="false" href="${esc(it.u)}"${it.o ? ' rel="noopener"' : ""}>
          <span class="search-hit-title">${mark(it.t, terms)}${it.o ? ' <span class="search-out" aria-label="on another site">↗</span>' : ""}</span>
          <span class="search-hit-meta">${glyph}${esc(meta)}</span>
          <span class="search-hit-text">${mark(snippet(it, terms), terms)}</span></a></li>`;
      }).join("");
      input.setAttribute("aria-expanded", String(hits.length > 0));
      status.textContent = hits.length ? `${hits.length === 12 ? "Top 12" : hits.length} result${hits.length === 1 ? "" : "s"}` : `Nothing yet for “${q}”. Try fewer or different words.`;
      setActive(-1);
      onPick && onPick(q);
    };
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      const n = list.querySelectorAll(".search-hit").length;
      if (e.key === "ArrowDown" && n) { e.preventDefault(); setActive(active + 1 >= n ? 0 : active + 1); }
      else if (e.key === "ArrowUp" && n) { e.preventDefault(); setActive(active <= 0 ? n - 1 : active - 1); }
      else if (e.key === "Enter") {
        const target = list.querySelectorAll(".search-hit")[active >= 0 ? active : 0];
        if (target) { e.preventDefault(); target.click(); }
      }
    });
    root.querySelector(".search-form").addEventListener("submit", (e) => e.preventDefault());
    status.addEventListener("click", (e) => {
      const b = e.target.closest(".search-idea");
      if (b) { input.value = b.textContent; render(); input.focus(); }
    });
    return { input, render, hint };
  };

  // The panel
  const dialog = document.querySelector(".search-dialog");
  if (dialog && typeof dialog.showModal === "function" && !document.querySelector(".search-page")) {
    const ui = setup(dialog);
    let opener = null;
    const open = () => {
      if (dialog.open) return;
      opener = document.activeElement;
      load();
      if (!ui.input.value) ui.hint();
      dialog.showModal();
      document.documentElement.classList.add("search-open");
      ui.input.focus();
      ui.input.select();
    };
    const close = () => dialog.open && dialog.close();
    dialog.addEventListener("close", () => {
      document.documentElement.classList.remove("search-open");
      opener && opener.focus && opener.focus({ preventScroll: true });
    });
    document.querySelectorAll("[data-search]").forEach((a) => a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (document.documentElement.classList.contains("menu-open")) document.querySelector(".menu-close")?.click();
      open();
    }));
    dialog.querySelector(".search-close").addEventListener("click", close);
    // A search box clears itself on the first Escape; here Escape should always close the panel.
    dialog.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } });
    dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
    document.addEventListener("keydown", (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        dialog.open ? close() : open();
      }
    });
  }

  // The /search/ page
  const page = document.querySelector(".search-page");
  if (page) {
    const ui = setup(page, { onPick: (q) => history.replaceState(null, "", "?q=" + encodeURIComponent(q)) });
    const q = new URLSearchParams(location.search).get("q");
    if (q) { ui.input.value = q; ui.render(); } else ui.hint();
    ui.input.focus();
    document.addEventListener("keydown", (e) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement !== ui.input)) { e.preventDefault(); ui.input.focus(); ui.input.select(); }
    });
  }
})();

// Inline editing, for Ran. Add ?edit to any address to turn it on in this browser, ?edit=off to turn it off.
// Only then does the editor load, so visitors never download it.
(() => {
  const KEY = "show-edit-links";
  const param = new URLSearchParams(location.search).get("edit");
  let on = false;
  try {
    if (param === "off") localStorage.removeItem(KEY);
    else if (param !== null) localStorage.setItem(KEY, "1");
    on = localStorage.getItem(KEY) === "1";
  } catch { on = param !== null && param !== "off"; }
  if (on) import("/assets/js/edit.js");
})();
