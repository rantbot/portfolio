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
