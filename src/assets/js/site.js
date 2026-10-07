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
