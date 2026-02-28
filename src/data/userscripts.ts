export type UserscriptSnippet = {
  id: string;
  title: string;
  description: string;
  code: string;
};

export const USER_SCRIPTS: readonly UserscriptSnippet[] = [
  {
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
  },
  {
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
  },
  {
    id: "global-dark-mode",
    title: "TPPC Global Dark Mode (No Sprite Inversion)",
    description: "Applies a non-inverting dark theme across all TPPC pages with a persistent on/off toggle.",
    code: `// ==UserScript==
// @name         TPPC Global Dark Mode
// @namespace    https://www.tppcrpg.net/
// @version      1.1
// @description  Dracula-inspired non-inverting dark mode for TPPC with a per-browser persistent toggle.
// @match        https://www.tppcrpg.net/*
// @match        https://tppcrpg.net/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const STORAGE_KEY = "tppc_dark_mode_enabled_v1";
  const ROOT_CLASS = "tppc-dark-mode";
  const STYLE_ID = "tppc-dark-mode-style";
  const TOGGLE_ID = "tppc-dark-mode-toggle";
  const DEFAULT_ENABLED = true;

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

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ":root." + ROOT_CLASS + " {",
      "  color-scheme: dark;",
      "  --tppc-bg: #282a36;",
      "  --tppc-surface: #303341;",
      "  --tppc-surface-2: #373b4b;",
      "  --tppc-surface-3: #44475a;",
      "  --tppc-border: #535a72;",
      "  --tppc-text: #f3f4fb;",
      "  --tppc-muted: #ccd2e7;",
      "  --tppc-link: #8be9fd;",
      "  --tppc-link-visited: #bd93f9;",
      "  --tppc-header-chip: #5a3b4f;",
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
      "  border-color: var(--tppc-border) !important;",
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
      "  background-color: #d8d6d1 !important;",
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

  function refreshToggleButton(enabled) {
    const btn = document.getElementById(TOGGLE_ID);
    if (!btn) return;
    btn.textContent = enabled ? "Dark: On" : "Dark: Off";
    btn.setAttribute("aria-pressed", enabled ? "true" : "false");
    btn.style.opacity = enabled ? "1" : "0.72";
  }

  function setDarkModeEnabled(enabled) {
    document.documentElement.classList.toggle(ROOT_CLASS, enabled);
    setStoredEnabled(enabled);
    refreshToggleButton(enabled);
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
    btn.style.background = "linear-gradient(135deg, #44475a, #3a3d4d)";
    btn.style.color = "#f8f8f2";
    btn.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.32)";

    btn.addEventListener("click", () => {
      setDarkModeEnabled(!document.documentElement.classList.contains(ROOT_CLASS));
    });

    document.body.appendChild(btn);
    refreshToggleButton(document.documentElement.classList.contains(ROOT_CLASS));
  }

  const initialEnabled = getStoredEnabled();
  if (initialEnabled) {
    document.documentElement.classList.add(ROOT_CLASS);
  }
  injectStyle();

  const initUI = () => {
    buildToggleButton();
    refreshToggleButton(document.documentElement.classList.contains(ROOT_CLASS));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUI, { once: true });
  } else {
    initUI();
  }
})();`
  },
  {
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
  }
] as const;
