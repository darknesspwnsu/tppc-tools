export function applyDarkMode(isDark) {
  document.body.classList.toggle("dark-mode", !!isDark);
}

export function initDarkMode(darkModeToggleEl) {
  try {
    const saved = localStorage.getItem("tppc_dexsorter_darkmode");
    if (saved === "1") {
      darkModeToggleEl.checked = true;
      applyDarkMode(true);
    }
  } catch (_) {}

  darkModeToggleEl.addEventListener("change", () => {
    const isDark = !!darkModeToggleEl.checked;
    applyDarkMode(isDark);
    try {
      localStorage.setItem("tppc_dexsorter_darkmode", isDark ? "1" : "0");
    } catch (_) {}
  });
}
