// The full address of the site. GitHub Actions sets SITE_URL automatically.
const url = (process.env.SITE_URL || "https://rancraycraft.com").replace(/\/$/, "");
export default { url, year: new Date().getFullYear() };
