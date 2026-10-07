// Homepage filter: All, Writing, Making. Without JavaScript, everything shows.
document.querySelectorAll(".filter").forEach((group) => {
  const feed = group.closest("section").querySelector(".feed");
  if (!feed) return;
  group.hidden = false;
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    const kind = btn.dataset.filter;
    group.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    feed.querySelectorAll("li").forEach((li) => {
      li.hidden = kind !== "all" && li.dataset.kind !== kind;
    });
  });
});

// Email links: unscramble the address and turn it into a mailto link.
document.querySelectorAll("a[data-e]").forEach((a) => {
  try {
    const address = atob(a.dataset.e).split("").reverse().join("");
    a.href = "mailto:" + address;
    a.textContent = address;
  } catch (e) {}
});

// Stories carousel: arrow buttons scroll by one card, and a counter shows where you are.
// Without JavaScript, the row still scrolls and swipes.
document.querySelectorAll(".carousel").forEach((track) => {
  const section = track.closest("section");
  const buttons = section.querySelectorAll(".carousel-btn");
  const count = section.querySelector(".carousel-count");
  const cards = track.querySelectorAll("li");
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
