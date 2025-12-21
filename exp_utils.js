// EXP Utilities (TPPC) — Darkness AKA Shiva
// NOTE: This file is intended to be loaded directly in the browser (non-module).
// All calculator functions are defined here so the HTML can call them via onclick.

function level2Exp(level) {
  return Math.pow(level, 3) + 1;
}

function level2ExpInBillion(level) {
  return (level2Exp(level) / 1e9).toFixed(2);
}

function exp2Level(exp) {
  return Math.pow(exp - 1, 1 / 3);
}

function expInBillion2Level(expB) {
  return exp2Level(expB * 1e9);
}

function levelDifference(level1, level2) {
  const smaller = level1 > level2 ? level2 : level1;
  const bigger = level1 > level2 ? level1 : level2;
  return exp2Level(level2Exp(bigger) - level2Exp(smaller));
}

function expAdd(exp, level) {
  return exp2Level(level2Exp(level) + exp);
}

function expInBillAdd(expB, level) {
  return exp2Level(level2Exp(level) + expB * 1e9);
}

/* -------------------- Single-field calculators -------------------- */

function calculateLevel2Exp() {
  const level = Number(document.getElementById("levelInput")?.value);
  document.getElementById("levelExpOutput").value = level2Exp(level);
}

function calculateLevel2ExpInBillion() {
  const level = Number(document.getElementById("levelInputBillion")?.value);
  document.getElementById("levelExpOutputBillion").value = level2ExpInBillion(level);
}

function calculateExp2Level() {
  const exp = Number(document.getElementById("expInput")?.value);
  document.getElementById("expLevelOutput").value = exp2Level(exp);
}

function calculateExpInBillion2Level() {
  const expB = Number(document.getElementById("expInputBillion")?.value);
  document.getElementById("expLevelOutputBillion").value = expInBillion2Level(expB);
}

function calculateLevelDifference() {
  const level1 = Number(document.getElementById("levelInput1")?.value);
  const level2 = Number(document.getElementById("levelInput2")?.value);
  document.getElementById("levelDiffOutput").value = levelDifference(level1, level2);
}

function calculateLevelTo4499() {
  const level = Number(document.getElementById("levelInput5")?.value);
  const output = (Number(level2ExpInBillion(level)) / Number(level2ExpInBillion(4499)));
  document.getElementById("LevelTo4499").value = output;
}

/* -------------------- Multi-field calculators (wired by UI) -------------------- */

function _num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function _sumFrom(selector) {
  return Array.from(document.querySelectorAll(selector))
    .map(el => _num(el.value))
    .reduce((a, b) => a + b, 0);
}

function calculateExpAdd() {
  const level = _num(document.getElementById("levelInput3")?.value);
  const totalExp = _sumFrom(".exp-add-item");
  document.getElementById("expLevelOutput2").value = expAdd(totalExp, level);

  const hint = document.getElementById("expAddSumHint");
  if (hint) hint.textContent = `Total EXP added: ${totalExp.toLocaleString()}`;
}

function calculateExpInBillAdd() {
  const level = _num(document.getElementById("levelInput4")?.value);
  const totalB = _sumFrom(".exp-bill-add-item");
  document.getElementById("expLevelOutput3").value = expInBillAdd(totalB, level);

  const hint = document.getElementById("expBillAddSumHint");
  if (hint) hint.textContent = `Total EXP (B) added: ${totalB}`;
}

function calculateAddLevels() {
  const levels = Array.from(document.querySelectorAll(".add-level-item")).map(el => _num(el.value));
  const totalExp = levels.reduce((acc, lv) => acc + level2Exp(lv), 0);
  document.getElementById("addLevelsOutput").value = exp2Level(totalExp);

  const hint = document.getElementById("addLevelsSumHint");
  if (hint) hint.textContent = `Total EXP summed: ${totalExp.toLocaleString()}`;
}

/* -------------------- Clear functions -------------------- */

function clearLevel2Exp() {
  document.getElementById("levelInput").value = "";
  document.getElementById("levelExpOutput").value = "";
}

function clearLevel2ExpBillion() {
  document.getElementById("levelInputBillion").value = "";
  document.getElementById("levelExpOutputBillion").value = "";
}

function clearExp2Level() {
  document.getElementById("expInput").value = "";
  document.getElementById("expLevelOutput").value = "";
}

function clearExpInBillion2Level() {
  document.getElementById("expInputBillion").value = "";
  document.getElementById("expLevelOutputBillion").value = "";
}

function clearLevelDiff() {
  document.getElementById("levelInput1").value = "";
  document.getElementById("levelInput2").value = "";
  document.getElementById("levelDiffOutput").value = "";
}

function clearExpAdd() {
  document.getElementById("levelInput3").value = "";
  const first = document.getElementById("expInput2");
  if (first) first.value = "";

  const box = document.getElementById("expAddList");
  if (box) Array.from(box.querySelectorAll(".input-group")).slice(1).forEach(n => n.remove());

  document.getElementById("expLevelOutput2").value = "";
  const hint = document.getElementById("expAddSumHint");
  if (hint) hint.textContent = "";

  if (window.__expAddRep) window.__expAddRep.sync();
}

function clearExpInBillAdd() {
  document.getElementById("levelInput4").value = "";
  const first = document.getElementById("expInput3");
  if (first) first.value = "";

  const box = document.getElementById("expBillAddList");
  if (box) Array.from(box.querySelectorAll(".input-group")).slice(1).forEach(n => n.remove());

  document.getElementById("expLevelOutput3").value = "";
  const hint = document.getElementById("expBillAddSumHint");
  if (hint) hint.textContent = "";

  if (window.__expBillAddRep) window.__expBillAddRep.sync();
}

function clearAddLevels() {
  const box = document.getElementById("addLevelsList");
  if (box) {
    const rows = Array.from(box.querySelectorAll(".input-group"));
    rows.forEach(r => { const inp = r.querySelector("input"); if (inp) inp.value = ""; });
    rows.slice(2).forEach(r => r.remove());
  }

  document.getElementById("addLevelsOutput").value = "";
  const hint = document.getElementById("addLevelsSumHint");
  if (hint) hint.textContent = "";

  if (window.__addLevelsRep) window.__addLevelsRep.sync();
}

function clearLevelTo4499() {
  document.getElementById("levelInput5").value = "";
  document.getElementById("LevelTo4499").value = "";
}

function clearAll() {
  clearLevel2Exp();
  clearLevel2ExpBillion();
  clearExp2Level();
  clearExpInBillion2Level();
  clearLevelDiff();
  clearExpAdd();
  clearExpInBillAdd();
  clearAddLevels();
  clearLevelTo4499();
}

/* -------------------- UI wiring -------------------- */

function _copySetup() {
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.setAttribute("readonly", "");
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
  }

  function setCopiedUI(btn, ok) {
    const i = btn.querySelector("i");
    const prev = i ? i.className : "";
    if (i) i.className = ok ? "bi bi-clipboard-check" : "bi bi-clipboard-x";
    btn.classList.toggle("btn-outline-secondary", !ok);
    btn.classList.toggle("btn-outline-success", ok);
    window.setTimeout(() => {
      if (i) i.className = prev || "bi bi-clipboard";
      btn.classList.remove("btn-outline-success");
      btn.classList.add("btn-outline-secondary");
    }, 1100);
  }

  document.querySelectorAll("[data-copy-target]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-copy-target");
      const el = document.getElementById(id);
      const text = (el && "value" in el) ? (el.value ?? "") : "";
      const ok = await copyText(String(text));
      setCopiedUI(btn, ok);
    });
  });
}

function _scrollTopSetup() {
  const btn = document.getElementById("scroll-to-top");
  if (!btn) return;

  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 100) btn.classList.add("show");
    else btn.classList.remove("show");
  });
}

function _enterKeySetup() {
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.tagName !== "INPUT") return;
      const eqBtn = card.querySelector(".btn.btn-primary.btn-calc");
      if (eqBtn && eqBtn instanceof HTMLButtonElement) {
        e.preventDefault();
        eqBtn.click();
      }
    });
  });
}

function _wireRepeater(containerId, inputClass, minRows, label) {
  const box = document.getElementById(containerId);

  function sync() {
    if (!box) return;
    const rows = box.querySelectorAll(".input-group");
    rows.forEach(row => {
      const rm = row.querySelector("button[data-remove]");
      if (!rm) return;
      const disable = rows.length <= minRows;
      rm.disabled = disable;
      rm.title = disable ? `At least ${minRows} row(s) are required` : "Remove row";
    });
  }

  function addRow() {
    if (!box) return;
    const row = document.createElement("div");
    row.className = "input-group";
    row.innerHTML = `
      <span class="input-group-text">${label}</span>
      <input type="number" class="form-control ${inputClass}" placeholder="${label === "Lv" ? "Enter Level" : (label === "B" ? "Enter Exp (B)" : "Enter Exp")}">
      <button class="btn btn-outline-secondary" type="button" data-remove><i class="bi bi-x-lg"></i></button>
    `;
    box.appendChild(row);
    sync();
    row.querySelector("input")?.focus();
  }

  if (box) {
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-remove]");
      if (!btn || btn.disabled) return;
      btn.closest(".input-group")?.remove();
      sync();
    });
  }

  sync();
  return { addRow, sync };
}

function _repeatersSetup() {
  window.__expAddRep = _wireRepeater("expAddList", "exp-add-item", 1, "EXP");
  window.__expBillAddRep = _wireRepeater("expBillAddList", "exp-bill-add-item", 1, "B");
  window.__addLevelsRep = _wireRepeater("addLevelsList", "add-level-item", 2, "Lv");

  const addExpBtn = document.getElementById("expAddMoreBtn");
  if (addExpBtn) addExpBtn.addEventListener("click", () => window.__expAddRep.addRow());

  const addBBtn = document.getElementById("expBillAddMoreBtn");
  if (addBBtn) addBBtn.addEventListener("click", () => window.__expBillAddRep.addRow());

  const addLvBtn = document.getElementById("addLevelsMoreBtn");
  if (addLvBtn) addLvBtn.addEventListener("click", () => window.__addLevelsRep.addRow());
}

function _footerYearSetup() {
  const el = document.getElementById("copyright-year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function __expUtilsInit() {
  // whatever you already do inside DOMContentLoaded
  _footerYearSetup?.();
  _copySetup?.();
  _scrollTopSetup?.();
  _enterKeySetup?.();
  _repeatersSetup?.();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", __expUtilsInit);
} else {
  __expUtilsInit();
}

/* -------------------- Optional Node/CommonJS exports -------------------- */
/* Fixes: "ReferenceError: module is not defined" in browser */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    level2Exp,
    level2ExpInBillion,
    exp2Level,
    expInBillion2Level,
    levelDifference,
    expAdd,
    expInBillAdd,
    calculateLevel2Exp,
    calculateLevel2ExpInBillion,
    calculateExp2Level,
    calculateExpInBillion2Level,
    calculateLevelDifference,
    calculateExpAdd,
    calculateExpInBillAdd,
    calculateAddLevels,
    calculateLevelTo4499,
    clearAll
  };
}
