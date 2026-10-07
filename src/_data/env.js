// The full address of the site. GitHub Actions sets SITE_URL automatically.
const url = (process.env.SITE_URL || "https://rantbot.github.io").replace(/\/$/, "");
export default { url, year: new Date().getFullYear() };
