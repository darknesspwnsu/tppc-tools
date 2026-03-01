export type UserscriptSnippet = {
  id: string;
  title: string;
  description: string;
  code: string;
  language?: "javascript" | "plaintext";
};

const SELL_PAGE_DRAG_SELECT: UserscriptSnippet = {
    id: "sell-page-drag-select",
    title: "TPPC Sell Page Drag Select",
    description: "Click and drag to bulk check or uncheck Pokemon on the TPPC sell page.",
    code: `// ==UserScript==
// @name         TPPC Sell Page Drag Select
// @namespace    https://www.tppcrpg.net/
// @version      1.0
// @description  Click-drag to bulk check/uncheck Sell checkboxes on TPPC.
// @match        https://www.tppcrpg.net/sell.php*
// @match        https://tppcrpg.net/sell.php*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const tbody = document.querySelector("#sellPokes table.ranks tbody");
  if (!tbody) return;

  let isPointerDown = false;
  let isDragging = false;
  let dragValue = true; // true = check, false = uncheck
  let startCheckbox = null;
  let startX = 0;
  let startY = 0;
  let lastTouched = null;
  let suppressNextClick = false;

  function getRowCheckbox(target) {
    const row = target.closest("tr");
    if (!row) return null;
    return row.querySelector('input[type="checkbox"][name="Sell[]"]');
  }

  function applyToCheckbox(cb) {
    if (!cb || cb.disabled) return;
    if (lastTouched === cb) return;
    lastTouched = cb;

    if (cb.checked !== dragValue) {
      cb.checked = dragValue;
      cb.dispatchEvent(new Event("input", { bubbles: true }));
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function beginDrag() {
    if (isDragging || !startCheckbox) return;
    isDragging = true;
    dragValue = !startCheckbox.checked; // start checked = erase, unchecked = paint
    document.body.style.userSelect = "none";
    applyToCheckbox(startCheckbox);
  }

  function stopInteraction() {
    const dragged = isDragging;

    isPointerDown = false;
    isDragging = false;
    startCheckbox = null;
    lastTouched = null;
    document.body.style.userSelect = "";

    if (dragged) {
      suppressNextClick = true;
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
  }

  tbody.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // left click only
    const cb = e.target.closest('input[type="checkbox"][name="Sell[]"]');
    if (!cb || cb.disabled) return;

    isPointerDown = true;
    isDragging = false;
    startCheckbox = cb;
    startX = e.clientX;
    startY = e.clientY;
    lastTouched = null;
  });

  tbody.addEventListener("mousemove", (e) => {
    if (!isPointerDown || !startCheckbox) return;

    const movedEnough =
      Math.abs(e.clientX - startX) >= 4 || Math.abs(e.clientY - startY) >= 4;

    if (movedEnough) beginDrag();
  });

  tbody.addEventListener("mouseover", (e) => {
    if (!isDragging) return;
    applyToCheckbox(getRowCheckbox(e.target));
  });

  tbody.addEventListener(
    "click",
    (e) => {
      if (!suppressNextClick) return;
      const cb = e.target.closest('input[type="checkbox"][name="Sell[]"]');
      if (!cb) return;
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
    },
    true
  );

  document.addEventListener("mouseup", stopInteraction);
})();`
};

const TRADE_INTEREST_DRAG_SELECT: UserscriptSnippet = {
    id: "trade-interest-drag-select",
    title: "TPPC Trade Interest Drag Select",
    description: "Click and drag to bulk check or uncheck Pokemon on the TPPC Trade Interest page.",
    code: `// ==UserScript==
// @name         TPPC Trade Interest Drag Select
// @namespace    https://www.tppcrpg.net/
// @version      1.0
// @description  Click-drag to bulk check/uncheck Trade Interest checkboxes on TPPC.
// @match        https://www.tppcrpg.net/trade.php*
// @match        https://www.tppcrpg.net/trade_interest.php*
// @match        https://www.tppcrpg.net/tradeinterest.php*
// @match        https://tppcrpg.net/trade.php*
// @match        https://tppcrpg.net/trade_interest.php*
// @match        https://tppcrpg.net/tradeinterest.php*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const tbody = [
    "#tradeInterest table.ranks tbody",
    "#interestPokes table.ranks tbody",
    "#tradePokes table.ranks tbody",
    "#interestedPokes table.ranks tbody",
    "table.ranks tbody"
  ]
    .map((selector) => document.querySelector(selector))
    .find(Boolean);

  if (!tbody) return;

  let isPointerDown = false;
  let isDragging = false;
  let dragValue = true; // true = check, false = uncheck
  let startCheckbox = null;
  let startX = 0;
  let startY = 0;
  let lastTouched = null;
  let suppressNextClick = false;

  function getRowCheckbox(target) {
    const row = target.closest("tr");
    if (!row) return null;
    return (
      row.querySelector('input[type="checkbox"][name*="Interest"]') ||
      row.querySelector('input[type="checkbox"][name*="interest"]') ||
      row.querySelector('input[type="checkbox"]')
    );
  }

  function applyToCheckbox(cb) {
    if (!cb || cb.disabled) return;
    if (lastTouched === cb) return;
    lastTouched = cb;

    if (cb.checked !== dragValue) {
      cb.checked = dragValue;
      cb.dispatchEvent(new Event("input", { bubbles: true }));
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function beginDrag() {
    if (isDragging || !startCheckbox) return;
    isDragging = true;
    dragValue = !startCheckbox.checked; // start checked = erase, unchecked = paint
    document.body.style.userSelect = "none";
    applyToCheckbox(startCheckbox);
  }

  function stopInteraction() {
    const dragged = isDragging;

    isPointerDown = false;
    isDragging = false;
    startCheckbox = null;
    lastTouched = null;
    document.body.style.userSelect = "";

    if (dragged) {
      suppressNextClick = true;
      window.setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
  }

  tbody.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // left click only
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb || cb.disabled || !tbody.contains(cb)) return;

    isPointerDown = true;
    isDragging = false;
    startCheckbox = cb;
    startX = e.clientX;
    startY = e.clientY;
    lastTouched = null;
  });

  tbody.addEventListener("mousemove", (e) => {
    if (!isPointerDown || !startCheckbox) return;

    const movedEnough =
      Math.abs(e.clientX - startX) >= 4 || Math.abs(e.clientY - startY) >= 4;

    if (movedEnough) beginDrag();
  });

  tbody.addEventListener("mouseover", (e) => {
    if (!isDragging) return;
    applyToCheckbox(getRowCheckbox(e.target));
  });

  tbody.addEventListener(
    "click",
    (e) => {
      if (!suppressNextClick) return;
      const cb = e.target.closest('input[type="checkbox"]');
      if (!cb) return;
      e.preventDefault();
      e.stopPropagation();
      suppressNextClick = false;
    },
    true
  );

  document.addEventListener("mouseup", stopInteraction);
})();`
};

const GLOBAL_DARK_MODE: UserscriptSnippet = {
    id: "global-dark-mode",
    title: "TPPC Global Dark Mode (No Sprite Inversion)",
    description:
      "Applies a non-inverting dark theme across all TPPC pages with persistent Dracula/Monokai theme support.",
    code: `// ==UserScript==
// @name         TPPC Global Dark Mode
// @namespace    https://www.tppcrpg.net/
// @version      1.7
// @description  Non-inverting dark mode for TPPC with persistent Dracula/Monokai theme toggle.
// @match        https://www.tppcrpg.net/*
// @match        https://tppcrpg.net/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "tppc_dark_mode_enabled_v1";
  const THEME_STORAGE_KEY = "tppc_dark_mode_theme_v1";
  const ROOT_CLASS = "tppc-dark-mode";
  const READY_CLASS = "tppc-dark-ready";
  const THEME_ATTR = "data-tppc-dark-theme";
  const STYLE_ID = "tppc-dark-mode-style";
  const TOGGLE_ID = "tppc-dark-mode-toggle";
  const THEME_TOGGLE_ID = "tppc-dark-mode-theme-toggle";
  const DEFAULT_ENABLED = true;
  const THEMES = ["dracula", "monokai"];
  const THEME_LABELS = {
    dracula: "Dracula",
    monokai: "Monokai"
  };
  const LEGACY_BG_ATTR_BY_RGB = {
    "rgb(243, 240, 233)": "data-tppc-bg-f3f0e9",
    "rgb(238, 255, 187)": "data-tppc-bg-eeffbb"
  };
  let observerStarted = false;

  function getStoredEnabled() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return DEFAULT_ENABLED;
      return raw === "1";
    } catch {
      return DEFAULT_ENABLED;
    }
  }

  function setStoredEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function normalizeTheme(theme) {
    return THEMES.includes(theme) ? theme : "dracula";
  }

  function getStoredTheme() {
    try {
      return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY) || "dracula");
    } catch {
      return "dracula";
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalizeTheme(theme));
    } catch {
      // ignore
    }
  }

  function getCurrentTheme() {
    return normalizeTheme(document.documentElement.getAttribute(THEME_ATTR) || "");
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ":root." + ROOT_CLASS + " {",
      "  color-scheme: dark;",
      "}",
      ":root." + ROOT_CLASS + "[" + THEME_ATTR + "='dracula'] {",
      "  --tppc-bg: #282a36; /* Background */",
      "  --tppc-current-line: #44475a; /* Current line */",
      "  --tppc-text: #f8f8f2; /* Foreground */",
      "  --tppc-comment: #6272a4; /* Comment */",
      "  --tppc-cyan: #8be9fd;",
      "  --tppc-green: #50fa7b;",
      "  --tppc-orange: #ffb86c;",
      "  --tppc-pink: #ff79c6;",
      "  --tppc-purple: #bd93f9;",
      "  --tppc-red: #ff5555;",
      "  --tppc-yellow: #f1fa8c;",
      "  --tppc-surface: #343746;",
      "  --tppc-surface-2: #3a3d4d;",
      "  --tppc-surface-3: #44475a;",
      "  --tppc-border: #6272a4;",
      "  --tppc-muted: #d2d7eb;",
      "  --tppc-link: var(--tppc-cyan);",
      "  --tppc-link-visited: var(--tppc-purple);",
      "  --tppc-header-chip: #5b3f6a;",
      "  --tppc-side-link: #c9d6ff;",
      "  --tppc-side-link-hover: #f8f8f2;",
      "}",
      ":root." + ROOT_CLASS + "[" + THEME_ATTR + "='monokai'] {",
      "  --tppc-bg: #272822;",
      "  --tppc-current-line: #3e3d32;",
      "  --tppc-text: #f8f8f2;",
      "  --tppc-comment: #75715e;",
      "  --tppc-cyan: #66d9ef;",
      "  --tppc-green: #a6e22e;",
      "  --tppc-orange: #fd971f;",
      "  --tppc-pink: #f92672;",
      "  --tppc-purple: #ae81ff;",
      "  --tppc-red: #f44747;",
      "  --tppc-yellow: #e6db74;",
      "  --tppc-surface: #2f3129;",
      "  --tppc-surface-2: #363830;",
      "  --tppc-surface-3: #49483e;",
      "  --tppc-border: #75715e;",
      "  --tppc-muted: #cdcfbf;",
      "  --tppc-link: var(--tppc-cyan);",
      "  --tppc-link-visited: var(--tppc-purple);",
      "  --tppc-header-chip: #5f3e2b;",
      "  --tppc-side-link: #d6f598;",
      "  --tppc-side-link-hover: #f8f8f2;",
      "}",
      ":root." + ROOT_CLASS + ":not(." + READY_CLASS + ") {",
      "  background: var(--tppc-bg) !important;",
      "}",
      ":root." + ROOT_CLASS + ":not(." + READY_CLASS + ") body {",
      "  visibility: hidden !important;",
      "}",
      ":root." + ROOT_CLASS + ", :root." + ROOT_CLASS + " body {",
      "  background: var(--tppc-bg) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #body,",
      ":root." + ROOT_CLASS + " #inner,",
      ":root." + ROOT_CLASS + " #left > ul,",
      ":root." + ROOT_CLASS + " #right > ul,",
      ":root." + ROOT_CLASS + " #footer,",
      ":root." + ROOT_CLASS + " #footer p {",
      "  background: var(--tppc-surface) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #tAoDp,",
      ":root." + ROOT_CLASS + " #tAoDp2,",
      ":root." + ROOT_CLASS + " #footer_clear {",
      "  background: var(--tppc-surface-2) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " :is(#tAoDp, #tAoDp2) ins.adsbygoogle {",
      "  background: transparent !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner,",
      ":root." + ROOT_CLASS + " #left > ul,",
      ":root." + ROOT_CLASS + " #right > ul {",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.h,",
      ":root." + ROOT_CLASS + " #right li.h,",
      ":root." + ROOT_CLASS + " #left li.h2,",
      ":root." + ROOT_CLASS + " #right li.h2 {",
      "  background: var(--tppc-header-chip) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.r0,",
      ":root." + ROOT_CLASS + " #right li.r0 {",
      "  background: var(--tppc-surface) !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.r1,",
      ":root." + ROOT_CLASS + " #right li.r1 {",
      "  background: var(--tppc-surface-2) !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li,",
      ":root." + ROOT_CLASS + " #right li {",
      "  border-color: transparent !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li :is(a, span),",
      ":root." + ROOT_CLASS + " #right li :is(a, span) {",
      "  color: var(--tppc-side-link) !important;",
      "  background: transparent !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.r0 a,",
      ":root." + ROOT_CLASS + " #right li.r0 a {",
      "  display: block !important;",
      "  background: var(--tppc-surface) !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.r1 a,",
      ":root." + ROOT_CLASS + " #right li.r1 a {",
      "  display: block !important;",
      "  background: var(--tppc-surface-2) !important;",
      "  border-left: none !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li.r2 a,",
      ":root." + ROOT_CLASS + " #right li.r2 a {",
      "  border-left: none !important;",
      "}",
      ":root." + ROOT_CLASS + " #left li a:hover,",
      ":root." + ROOT_CLASS + " #right li a:hover {",
      "  color: var(--tppc-side-link-hover) !important;",
      "  text-decoration: underline;",
      "}",
      ":root." + ROOT_CLASS + " #inner .r0 {",
      "  background-color: var(--tppc-surface) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner .r1 {",
      "  background-color: var(--tppc-surface-2) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner :is(.r0, .r1) :is(td, th, div, span, p, strong, b, a, label) {",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner table.ranks thead th,",
      ":root." + ROOT_CLASS + " #inner table.ranks thead td {",
      "  background: #5b2437 !important;",
      "  color: var(--tppc-text) !important;",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner table.ranks tbody td {",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner :is(.notice, .error, .success, .account_note, .maintenance, #cBox) {",
      "  background-color: var(--tppc-surface-2) !important;",
      "  color: var(--tppc-text) !important;",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner :is(.notice div, .error div, .success div, .account_note div, .maintenance div) {",
      "  background-color: var(--tppc-current-line) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " [data-tppc-bg-f3f0e9='1'],",
      ":root." + ROOT_CLASS + " [data-tppc-bg-eeffbb='1'] {",
      "  background-color: var(--tppc-surface-2) !important;",
      "  color: var(--tppc-text) !important;",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner .disabled {",
      "  color: var(--tppc-comment) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner .green {",
      "  color: var(--tppc-green) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner .red {",
      "  color: var(--tppc-red) !important;",
      "}",
      ":root." + ROOT_CLASS + " #inner hr,",
      ":root." + ROOT_CLASS + " #footer hr,",
      ":root." + ROOT_CLASS + " hr {",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #profile > li {",
      "  background: #2e3240 !important;",
      "  border: 1px solid var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #profile > li .i {",
      "  background-color: #c5c2bc !important;",
      "}",
      ":root." + ROOT_CLASS + " #allPoke {",
      "  background: #2d3140 !important;",
      "  border: 1px solid var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " #allPoke li {",
      "  border-color: color-mix(in srgb, var(--tppc-border), transparent 35%) !important;",
      "}",
      ":root." + ROOT_CLASS + " :is(table, thead, tbody, tfoot, tr, td, th) {",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " table {",
      "  background: var(--tppc-surface) !important;",
      "}",
      ":root." + ROOT_CLASS + " th,",
      ":root." + ROOT_CLASS + " td {",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " :is(input, textarea, select, button) {",
      "  background-color: var(--tppc-surface-3) !important;",
      "  color: var(--tppc-text) !important;",
      "  border-color: var(--tppc-border) !important;",
      "}",
      ":root." + ROOT_CLASS + " :is(input, textarea)::placeholder {",
      "  color: var(--tppc-muted) !important;",
      "}",
      ":root." + ROOT_CLASS + " [bgcolor] {",
      "  background-color: var(--tppc-surface) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " [style*='background:#fff'],",
      ":root." + ROOT_CLASS + " [style*='background: #fff'],",
      ":root." + ROOT_CLASS + " [style*='background-color:#fff'],",
      ":root." + ROOT_CLASS + " [style*='background-color: #fff'],",
      ":root." + ROOT_CLASS + " [style*='background:white'],",
      ":root." + ROOT_CLASS + " [style*='background: white'],",
      ":root." + ROOT_CLASS + " [style*='background-color:white'],",
      ":root." + ROOT_CLASS + " [style*='background-color: white'] {",
      "  background-color: var(--tppc-surface) !important;",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " [style*='color:#000'],",
      ":root." + ROOT_CLASS + " [style*='color: #000'],",
      ":root." + ROOT_CLASS + " [style*='color:black'],",
      ":root." + ROOT_CLASS + " [style*='color: black'] {",
      "  color: var(--tppc-text) !important;",
      "}",
      ":root." + ROOT_CLASS + " a {",
      "  color: var(--tppc-link) !important;",
      "}",
      ":root." + ROOT_CLASS + " a:visited {",
      "  color: var(--tppc-link-visited) !important;",
      "}",
      ":root." + ROOT_CLASS + " a:hover {",
      "  filter: brightness(1.08);",
      "}",
      ":root." + ROOT_CLASS + " img,",
      ":root." + ROOT_CLASS + " video,",
      ":root." + ROOT_CLASS + " canvas,",
      ":root." + ROOT_CLASS + " svg,",
      ":root." + ROOT_CLASS + " iframe {",
      "  filter: none !important;",
      "  mix-blend-mode: normal !important;",
      "}"
    ].join("\\n");

    (document.head || document.documentElement).appendChild(style);
  }

  function tagElementIfLegacyBg(el) {
    if (!(el instanceof HTMLElement)) return;
    if (el.hasAttribute("data-tppc-bg-f3f0e9") || el.hasAttribute("data-tppc-bg-eeffbb")) return;

    const attr = LEGACY_BG_ATTR_BY_RGB[getComputedStyle(el).backgroundColor];
    if (!attr) return;
    el.setAttribute(attr, "1");
  }

  function tagLegacyLightBackgrounds(rootNode) {
    const scope = rootNode instanceof HTMLElement ? rootNode : document.body;
    if (!scope) return;

    tagElementIfLegacyBg(scope);
    const all = scope.querySelectorAll("*");
    for (const el of all) tagElementIfLegacyBg(el);
  }

  function startBackgroundObserver() {
    if (observerStarted || !document.documentElement) return;
    observerStarted = true;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          tagLegacyLightBackgrounds(node);
        }
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function refreshToggleButton(enabled) {
    const btn = document.getElementById(TOGGLE_ID);
    if (!btn) return;
    btn.textContent = enabled ? "Dark: On" : "Dark: Off";
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    btn.style.opacity = enabled ? "1" : "0.72";
  }

  function refreshThemeButton(theme, enabled) {
    const btn = document.getElementById(THEME_TOGGLE_ID);
    if (!btn) return;
    const safeTheme = normalizeTheme(theme);
    const label = THEME_LABELS[safeTheme] || "Dracula";

    btn.textContent = "Theme: " + label;
    btn.setAttribute("aria-label", "Cycle dark theme");
    btn.style.opacity = enabled ? "1" : "0.78";
    btn.style.background =
      safeTheme === "monokai"
        ? "linear-gradient(135deg, #49483e, #272822)"
        : "linear-gradient(135deg, #44475a, #282a36)";
  }

  function applyTheme(theme) {
    const nextTheme = normalizeTheme(theme);
    document.documentElement.setAttribute(THEME_ATTR, nextTheme);
    setStoredTheme(nextTheme);
    refreshThemeButton(nextTheme, document.documentElement.classList.contains(ROOT_CLASS));
  }

  function cycleTheme() {
    const current = getCurrentTheme();
    const idx = THEMES.indexOf(current);
    const next = THEMES[(idx + 1) % THEMES.length];
    applyTheme(next);
  }

  function setDarkModeEnabled(enabled) {
    if (enabled) tagLegacyLightBackgrounds();
    document.documentElement.classList.toggle(ROOT_CLASS, enabled);
    if (enabled) document.documentElement.classList.add(READY_CLASS);
    setStoredEnabled(enabled);
    refreshToggleButton(enabled);
    refreshThemeButton(getCurrentTheme(), enabled);
  }

  function buildToggleButton() {
    if (document.getElementById(TOGGLE_ID) || !document.body) return;

    const btn = document.createElement("button");
    btn.id = TOGGLE_ID;
    btn.type = "button";
    btn.title = "Toggle TPPC dark mode";
    btn.style.position = "fixed";
    btn.style.right = "14px";
    btn.style.bottom = "14px";
    btn.style.zIndex = "2147483647";
    btn.style.border = "1px solid #6272a4";
    btn.style.borderRadius = "999px";
    btn.style.padding = "7px 12px";
    btn.style.fontFamily = "Verdana, Arial, sans-serif";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "700";
    btn.style.lineHeight = "1";
    btn.style.cursor = "pointer";
    btn.style.background = "linear-gradient(135deg, #44475a, #282a36)";
    btn.style.color = "#f8f8f2";
    btn.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.32)";

    btn.addEventListener("click", () => {
      setDarkModeEnabled(!document.documentElement.classList.contains(ROOT_CLASS));
    });

    document.body.appendChild(btn);
    refreshToggleButton(document.documentElement.classList.contains(ROOT_CLASS));
  }

  function buildThemeButton() {
    if (document.getElementById(THEME_TOGGLE_ID) || !document.body) return;

    const btn = document.createElement("button");
    btn.id = THEME_TOGGLE_ID;
    btn.type = "button";
    btn.title = "Cycle dark theme";
    btn.style.position = "fixed";
    btn.style.right = "14px";
    btn.style.bottom = "52px";
    btn.style.zIndex = "2147483647";
    btn.style.border = "1px solid #6272a4";
    btn.style.borderRadius = "999px";
    btn.style.padding = "7px 12px";
    btn.style.fontFamily = "Verdana, Arial, sans-serif";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "700";
    btn.style.lineHeight = "1";
    btn.style.cursor = "pointer";
    btn.style.color = "#f8f8f2";
    btn.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.32)";

    btn.addEventListener("click", () => {
      cycleTheme();
      if (document.documentElement.classList.contains(ROOT_CLASS)) {
        tagLegacyLightBackgrounds();
      }
    });

    document.body.appendChild(btn);
    refreshThemeButton(
      getCurrentTheme(),
      document.documentElement.classList.contains(ROOT_CLASS)
    );
  }

  const initialTheme = getStoredTheme();
  document.documentElement.setAttribute(THEME_ATTR, initialTheme);
  const initialEnabled = getStoredEnabled();
  if (initialEnabled) {
    document.documentElement.classList.add(ROOT_CLASS);
  }
  injectStyle();
  startBackgroundObserver();

  const initUI = () => {
    tagLegacyLightBackgrounds(document.body || undefined);
    document.documentElement.classList.add(READY_CLASS);
    buildThemeButton();
    buildToggleButton();
    refreshToggleButton(document.documentElement.classList.contains(ROOT_CLASS));
    refreshThemeButton(getCurrentTheme(), document.documentElement.classList.contains(ROOT_CLASS));
    window.setTimeout(() => tagLegacyLightBackgrounds(document.body || undefined), 0);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI, { once: true });
  } else {
    initUI();
  }
})();`
};

const CHECK_ALL_UNOWN_CONSOLE: UserscriptSnippet = {
    id: "check-all-unown-console",
    title: "TPPC Sell Page: Check All Unown (Dev Console)",
    description: "One-time developer console snippet to check every Unown variant on the sell page.",
    code: `(() => {
  let checked = 0;
  const unownRe = /\\bunown(?:[a-z]|[!?]|\\b)/i; // Unown, UnownA..Z, Unown!, Unown?

  document.querySelectorAll('input[type="checkbox"][name="Sell[]"]').forEach((cb) => {
    if (!(cb instanceof HTMLInputElement) || cb.disabled) return;

    const row = cb.closest("tr");
    const rowText = [
      row?.innerText || "",
      row?.querySelector("img")?.getAttribute("alt") || "",
      row?.querySelector("img")?.getAttribute("title") || ""
    ].join(" ");

    if (!unownRe.test(rowText)) return;

    if (!cb.checked) {
      cb.checked = true;
      cb.dispatchEvent(new Event("input", { bubbles: true }));
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }

    checked += 1;
  });

  console.log("Checked " + checked + " Unown entries.");
})();`
};

export const USER_SCRIPTS: readonly UserscriptSnippet[] = [
  GLOBAL_DARK_MODE,
  SELL_PAGE_DRAG_SELECT,
  TRADE_INTEREST_DRAG_SELECT,
  CHECK_ALL_UNOWN_CONSOLE
] as const;
