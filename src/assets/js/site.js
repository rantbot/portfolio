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
