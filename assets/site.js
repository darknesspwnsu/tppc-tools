(() => {
  const TOOL_DATA = window.TPPC_TOOLS || [];

  // Support both:
  // - User Pages: https://<user>.github.io/...
  // - Project Pages: https://<user>.github.io/<repo>/...
  // by deriving the site root from this script's URL.
  const scriptUrl = (() => {
    const cs = document.currentScript;
    if (cs && cs.src) return new URL(cs.src, window.location.href);

    // Fallback: look for a script tag that ends with assets/site.js
    const s = document.querySelector('script[src$="assets/site.js"]');
    if (s && s.src) return new URL(s.src, window.location.href);

    return new URL("assets/site.js", window.location.href);
  })();
  const SITE_ROOT = new URL("../", scriptUrl);

  const toAbsolute = (href) => {
    if (!href) return "";
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href;
    const clean = String(href).replace(/^\//, "");
    const u = new URL(clean, SITE_ROOT);
    return `${u.pathname}${u.search}${u.hash}`;
  };

  const NAV_ITEMS = TOOL_DATA.map((item) => ({
    name: item.name,
    href: toAbsolute(item.url)
  }));

  const nav = document.createElement("nav");
  nav.className = "site-nav";

	  nav.innerHTML = `
	    <div class="site-nav-inner">
	      <button class="site-hamburger" id="siteMenuBtn" type="button" aria-controls="site-drawer" aria-expanded="false" aria-label="Open menu">≡</button>
	      <a class="site-brand" href="${toAbsolute("index.html")}">
	        <span class="site-logo"></span>
	        <span class="site-title">TPPC Tools by Darkness</span>
	      </a>
	      <div class="site-actions">
	        <a class="site-action" href="https://github.com/darknesspwnsu/tppc-tools" target="_blank" rel="noopener">↗ GitHub</a>
	        <button id="themeBtn" class="site-action site-theme-btn" type="button">
	          <span id="themeIcon">☾</span>
	          <span id="themeText">Dark</span>
	        </button>
	      </div>
    </div>
  `;

  document.body.classList.add("site-standard");
  document.body.insertAdjacentElement("afterbegin", nav);

  const drawer = document.createElement("aside");
  drawer.className = "site-drawer";
  drawer.id = "site-drawer";
  drawer.setAttribute("aria-hidden", "true");
  drawer.innerHTML = `
    <div class="site-drawer-head">
      <div class="site-drawer-title">Tools</div>
      <button class="site-drawer-close" id="siteDrawerClose" type="button" aria-label="Close menu">×</button>
    </div>
    <div class="site-drawer-links">
      ${NAV_ITEMS.map((item) => `<a class="site-link" href="${item.href}">${item.name}</a>`).join("")}
    </div>
  `;
  const backdrop = document.createElement("div");
  backdrop.className = "site-drawer-backdrop";
  backdrop.id = "site-drawer-backdrop";

  nav.insertAdjacentElement("afterend", drawer);
  drawer.insertAdjacentElement("afterend", backdrop);

  const normalizePath = (p) => {
    const clean = (p || "").split("?")[0].split("#")[0];
    return clean.replace(/index\.html$/, "")
      .replace(/\.html$/, "")
      .replace(/^\//, "")
      .replace(/\/$/, "")
      .toLowerCase();
  };

  const current = normalizePath(window.location.pathname || "");
  const drawerLinks = drawer.querySelectorAll(".site-link");
  drawerLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const target = normalizePath(href);
    if (current && current === target) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
      link.setAttribute("tabindex", "-1");
      link.addEventListener("click", (e) => e.preventDefault());
    }
  });

  const menuBtn = document.getElementById("siteMenuBtn");
  const closeBtn = document.getElementById("siteDrawerClose");

  const openDrawer = () => {
    drawer.classList.add("open");
    backdrop.classList.add("show");
    drawer.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    drawer.classList.remove("open");
    backdrop.classList.remove("show");
    drawer.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  menuBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  const root = document.documentElement;
  const btn = document.getElementById("themeBtn");
  const icon = document.getElementById("themeIcon");
  const text = document.getElementById("themeText");
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const saved = localStorage.getItem("tppc_tools_theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");

  const setTheme = (mode) => {
    root.setAttribute("data-theme", mode);
    root.setAttribute("data-bs-theme", mode);
    document.body.classList.toggle("dark-mode", mode === "dark");
    localStorage.setItem("tppc_tools_theme", mode);
    const dark = mode === "dark";
    if (icon) icon.textContent = dark ? "☀" : "☾";
    if (text) text.textContent = dark ? "Light" : "Dark";
    if (metaTheme) metaTheme.setAttribute("content", dark ? "#0b1020" : "#eef2ff");
  };

  setTheme(initial);
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    setTheme(next);
  });

  if (!document.querySelector(".site-footer")) {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="site-footer-inner">
        © <span id="site-footer-year"></span> Darkness AKA Shiva — TPPC Tools
      </div>
    `;
    document.body.appendChild(footer);
    const y = footer.querySelector("#site-footer-year");
    if (y) y.textContent = String(new Date().getFullYear());
  }
})();
