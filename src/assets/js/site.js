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

// Stories carousel: arrow buttons scroll by one card. Without JavaScript, it still scrolls.
document.querySelectorAll(".carousel").forEach((track) => {
  const buttons = track.closest("section").querySelectorAll(".carousel-btn");
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    buttons.forEach((b) => {
      b.hidden = max <= 0;
      b.disabled = Number(b.dataset.dir) < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= max;
    });
  };
  buttons.forEach((b) =>
    b.addEventListener("click", () => {
      const card = track.querySelector("li");
      const step = card ? card.getBoundingClientRect().width + 32 : track.clientWidth;
      track.scrollBy({ left: Number(b.dataset.dir) * step, behavior: "smooth" });
    })
  );
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});
