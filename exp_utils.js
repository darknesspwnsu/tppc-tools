function level2Exp(level) {
  return Math.pow(level, 3) + 1;
}

function level2ExpInBillion(level) {
  return (level2Exp(level) / 1e9).toFixed(2);
}

function exp2Level(exp) {
  return Math.pow(exp - 1, 1 / 3);
}

function expInBillion2Level(exp) {
  return exp2Level(exp * 1e9);
}

function levelDifference(level1, level2) {
  const smaller = level1 > level2 ? level2 : level1;
  const bigger = level1 > level2 ? level1 : level2;
  return exp2Level(level2Exp(bigger) - level2Exp(smaller));
}

function expAdd(exp, level) {
  return exp2Level(level2Exp(level) + exp);
}

function expInBillAdd(exp, level) {
  return exp2Level(level2Exp(level) + exp * 1e9);
}

function calculateLevel2Exp() {
  const level = Number(document.getElementById("levelInput").value);
  const exp = level2Exp(level);
  document.getElementById("levelExpOutput").value = exp;
}

function calculateLevel2ExpInBillion() {
  const level = Number(document.getElementById("levelInputBillion").value);
  const exp = level2ExpInBillion(level);
  document.getElementById("levelExpOutputBillion").value = exp;
}

function calculateExp2Level() {
  const exp = Number(document.getElementById("expInput").value);
  const level = exp2Level(exp);
  document.getElementById("expLevelOutput").value = level;
}

function calculateExpInBillion2Level() {
  const exp = Number(document.getElementById("expInputBillion").value);
  const level = expInBillion2Level(exp);
  document.getElementById("expLevelOutputBillion").value = level;
}

function calculateLevelDifference() {
  const level1 = Number(document.getElementById("levelInput1").value);
  const level2 = Number(document.getElementById("levelInput2").value);
  const levelDiff = levelDifference(level1, level2);
  document.getElementById("levelDiffOutput").value = levelDiff;
}

function calculateExpAdd() {
  const exp = Number(document.getElementById("expInput2").value);
  const level = Number(document.getElementById("levelInput3").value);
  const newLevel = expAdd(exp, level);
  document.getElementById("expLevelOutput2").value = newLevel;
}

function calculateExpInBillAdd() {
  const exp = Number(document.getElementById("expInput3").value);
  const level = Number(document.getElementById("levelInput4").value);
  const newLevel = expInBillAdd(exp, level);
  document.getElementById("expLevelOutput3").value = newLevel;
}

function calculateLevelTo4499() {
  const level = document.getElementById("levelInput5").value;
  const output = level2ExpInBillion(level) / level2ExpInBillion(4499);
  document.getElementById("LevelTo4499").value = output;
}

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
  document.getElementById("expInput2").value = "";
  document.getElementById("levelInput3").value = "";
  document.getElementById("expLevelOutput2").value = "";
}

function clearExpInBillAdd() {
  document.getElementById("expInput3").value = "";
  document.getElementById("levelInput4").value = "";
  document.getElementById("expLevelOutput3").value = "";
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
  clearLevelTo4499();
}

const scrollToTopBtn = document.getElementById("scroll-to-top");

scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  if (window.pageYOffset > 100) {
    scrollToTopBtn.classList.add("show");
  } else {
    scrollToTopBtn.classList.remove("show");
  }
});

// Optional Node/CommonJS exports (safe in browser)
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
    calculateLevelTo4499,
    clearAll
  };
}
