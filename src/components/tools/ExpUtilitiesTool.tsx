"use client";

import { useEffect, useMemo, useState } from "react";

import {
  addLevels,
  exp2Level,
  expAdd,
  expInBillAdd,
  expInBillion2Level,
  level2Exp,
  level2ExpInBillion,
  levelDifference,
  levelTo4499Equivalents,
  sumInputs
} from "@/features/exp-utilities/core";

function toNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function copyText(text: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    // fall through
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    // noop
  }
  document.body.removeChild(ta);
}

type FieldRow = {
  id: string;
  value: string;
};

function newRow() {
  return { id: Math.random().toString(36).slice(2), value: "" };
}

export function ExpUtilitiesTool() {
  const [levelInput, setLevelInput] = useState("");
  const [levelInputBillion, setLevelInputBillion] = useState("");
  const [expInput, setExpInput] = useState("");
  const [expInputBillion, setExpInputBillion] = useState("");
  const [levelInput1, setLevelInput1] = useState("");
  const [levelInput2, setLevelInput2] = useState("");
  const [levelInput3, setLevelInput3] = useState("");
  const [levelInput4, setLevelInput4] = useState("");
  const [levelInput5, setLevelInput5] = useState("");

  const [expAddRows, setExpAddRows] = useState<FieldRow[]>([{ id: "expInput2", value: "" }]);
  const [expBillAddRows, setExpBillAddRows] = useState<FieldRow[]>([{ id: "expInput3", value: "" }]);
  const [addLevelRows, setAddLevelRows] = useState<FieldRow[]>([newRow(), newRow()]);

  const [levelExpOutput, setLevelExpOutput] = useState("");
  const [levelExpOutputBillion, setLevelExpOutputBillion] = useState("");
  const [expLevelOutput, setExpLevelOutput] = useState("");
  const [expLevelOutputBillion, setExpLevelOutputBillion] = useState("");
  const [levelDiffOutput, setLevelDiffOutput] = useState("");
  const [expLevelOutput2, setExpLevelOutput2] = useState("");
  const [expLevelOutput3, setExpLevelOutput3] = useState("");
  const [addLevelsOutput, setAddLevelsOutput] = useState("");
  const [levelTo4499Output, setLevelTo4499Output] = useState("");

  const [expAddSumHint, setExpAddSumHint] = useState("");
  const [expBillAddSumHint, setExpBillAddSumHint] = useState("");
  const [addLevelsSumHint, setAddLevelsSumHint] = useState("");

  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.pageYOffset > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const expAddItems = useMemo(() => expAddRows.map((row) => toNum(row.value)), [expAddRows]);
  const expBillAddItems = useMemo(() => expBillAddRows.map((row) => toNum(row.value)), [expBillAddRows]);
  const addLevelItems = useMemo(() => addLevelRows.map((row) => toNum(row.value)).filter((value) => value > 0), [addLevelRows]);

  const clearAll = () => {
    setLevelInput("");
    setLevelInputBillion("");
    setExpInput("");
    setExpInputBillion("");
    setLevelInput1("");
    setLevelInput2("");
    setLevelInput3("");
    setLevelInput4("");
    setLevelInput5("");
    setExpAddRows([{ id: "expInput2", value: "" }]);
    setExpBillAddRows([{ id: "expInput3", value: "" }]);
    setAddLevelRows([newRow(), newRow()]);

    setLevelExpOutput("");
    setLevelExpOutputBillion("");
    setExpLevelOutput("");
    setExpLevelOutputBillion("");
    setLevelDiffOutput("");
    setExpLevelOutput2("");
    setExpLevelOutput3("");
    setAddLevelsOutput("");
    setLevelTo4499Output("");

    setExpAddSumHint("");
    setExpBillAddSumHint("");
    setAddLevelsSumHint("");
  };

  const removeRow = (
    rows: FieldRow[],
    setRows: (updater: (prev: FieldRow[]) => FieldRow[]) => void,
    targetId: string,
    min: number
  ) => {
    if (rows.length <= min) return;
    setRows((prev) => prev.filter((row) => row.id !== targetId));
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Utilities</div>
        <h1 className="page-title">TPPC Level & Experience Utilities</h1>
        <p className="page-subtitle">Quick reference calculators for TPPC training math.</p>
      </section>

      <section className="surface tool-pane">
        <div className="jump-bar">
          <div className="jump-title mono">Quick Jump</div>
          <div className="jump-links">
            <a className="jump-link" href="#levelToExp">Lv → Exp</a>
            <a className="jump-link" href="#levelToExpBillion">Lv → Exp (B)</a>
            <a className="jump-link" href="#expToLevel">Exp → Lv</a>
            <a className="jump-link" href="#expToLevelBillion">Exp (B) → Lv</a>
            <a className="jump-link" href="#levelDiff">Diff</a>
            <a className="jump-link" href="#expAdd">Add</a>
            <a className="jump-link" href="#expInBillAdd">Add (B)</a>
            <a className="jump-link" href="#addLevels">Add Lv</a>
            <a className="jump-link" href="#level24499s">4499s</a>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-2">
          <button type="button" className="btn btn-outline-danger" onClick={clearAll}>
            Clear All
          </button>
        </div>

        <div className="masonry">
          <div className="card" id="levelToExp">
            <div className="card-header">Level → Experience</div>
            <div className="card-body">
              <input
                id="levelInput"
                type="number"
                className="form-control"
                placeholder="Enter Level"
                value={levelInput}
                onChange={(event) => setLevelInput(event.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setLevelExpOutput(String(level2Exp(toNum(levelInput))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInput("");
                    setLevelExpOutput("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="input-group mt-2">
                <input id="levelExpOutput" className="form-control mono" value={levelExpOutput} readOnly placeholder="Experience" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(levelExpOutput)}
                  data-copy-target="levelExpOutput"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="card" id="levelToExpBillion">
            <div className="card-header">Level → Exp (Billion)</div>
            <div className="card-body">
              <input
                id="levelInputBillion"
                type="number"
                className="form-control"
                placeholder="Enter Level"
                value={levelInputBillion}
                onChange={(event) => setLevelInputBillion(event.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setLevelExpOutputBillion(String(level2ExpInBillion(toNum(levelInputBillion))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInputBillion("");
                    setLevelExpOutputBillion("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="input-group mt-2">
                <input id="levelExpOutputBillion" className="form-control mono" value={levelExpOutputBillion} readOnly placeholder="Exp (B)" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(levelExpOutputBillion)}
                  data-copy-target="levelExpOutputBillion"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="card" id="expToLevel">
            <div className="card-header">Experience → Level</div>
            <div className="card-body">
              <input
                id="expInput"
                type="number"
                className="form-control"
                placeholder="Enter Experience"
                value={expInput}
                onChange={(event) => setExpInput(event.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setExpLevelOutput(String(exp2Level(toNum(expInput))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setExpInput("");
                    setExpLevelOutput("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="input-group mt-2">
                <input id="expLevelOutput" className="form-control mono" value={expLevelOutput} readOnly placeholder="Level" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(expLevelOutput)}
                  data-copy-target="expLevelOutput"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="card" id="expToLevelBillion">
            <div className="card-header">Exp (Billion) → Level</div>
            <div className="card-body">
              <input
                id="expInputBillion"
                type="number"
                className="form-control"
                placeholder="Enter Exp (Billion)"
                value={expInputBillion}
                onChange={(event) => setExpInputBillion(event.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setExpLevelOutputBillion(String(expInBillion2Level(toNum(expInputBillion))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setExpInputBillion("");
                    setExpLevelOutputBillion("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="input-group mt-2">
                <input
                  id="expLevelOutputBillion"
                  className="form-control mono"
                  value={expLevelOutputBillion}
                  readOnly
                  placeholder="Level"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(expLevelOutputBillion)}
                  data-copy-target="expLevelOutputBillion"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="card" id="levelDiff">
            <div className="card-header">Level Difference</div>
            <div className="card-body">
              <div className="input-group">
                <input
                  id="levelInput1"
                  type="number"
                  className="form-control"
                  placeholder="Level 1"
                  value={levelInput1}
                  onChange={(event) => setLevelInput1(event.target.value)}
                />
                <span className="input-group-text">−</span>
                <input
                  id="levelInput2"
                  type="number"
                  className="form-control"
                  placeholder="Level 2"
                  value={levelInput2}
                  onChange={(event) => setLevelInput2(event.target.value)}
                />
              </div>

              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setLevelDiffOutput(String(levelDifference(toNum(levelInput1), toNum(levelInput2))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInput1("");
                    setLevelInput2("");
                    setLevelDiffOutput("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="input-group mt-2">
                <input id="levelDiffOutput" className="form-control mono" value={levelDiffOutput} readOnly placeholder="Difference" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(levelDiffOutput)}
                  data-copy-target="levelDiffOutput"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="card" id="expAdd">
            <div className="card-header">Add Experience</div>
            <div className="card-body">
              <label className="form-label" htmlFor="levelInput3">Starting Level</label>
              <input
                id="levelInput3"
                type="number"
                className="form-control"
                placeholder="Level"
                value={levelInput3}
                onChange={(event) => setLevelInput3(event.target.value)}
              />

              <label className="form-label mt-2">EXP to add (one or more)</label>
              <div id="expAddList" className="vstack gap-2">
                {expAddRows.map((row, index) => (
                  <div className="input-group" key={row.id}>
                    <span className="input-group-text">EXP</span>
                    <input
                      id={index === 0 ? "expInput2" : undefined}
                      type="number"
                      className="form-control exp-add-item"
                      placeholder="Enter Exp"
                      value={row.value}
                      onChange={(event) => {
                        setExpAddRows((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item))
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-remove
                      disabled={expAddRows.length <= 1}
                      onClick={() => removeRow(expAddRows, setExpAddRows, row.id, 1)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button
                  id="expAddMoreBtn"
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setExpAddRows((prev) => [...prev, newRow()])}
                >
                  Add another EXP
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => {
                    const total = sumInputs(expAddItems);
                    setExpLevelOutput2(String(expAdd(total, toNum(levelInput3))));
                    setExpAddSumHint(`Total EXP added: ${total.toLocaleString("en-US")}`);
                  }}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInput3("");
                    setExpAddRows([{ id: "expInput2", value: "" }]);
                    setExpLevelOutput2("");
                    setExpAddSumHint("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="input-group mt-2">
                <input id="expLevelOutput2" className="form-control mono" value={expLevelOutput2} readOnly placeholder="Level" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(expLevelOutput2)}
                  data-copy-target="expLevelOutput2"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
              <div className="form-text mono" id="expAddSumHint">
                {expAddSumHint}
              </div>
            </div>
          </div>

          <div className="card" id="expInBillAdd">
            <div className="card-header">Add Exp (Billion)</div>
            <div className="card-body">
              <label className="form-label" htmlFor="levelInput4">Starting Level</label>
              <input
                id="levelInput4"
                type="number"
                className="form-control"
                placeholder="Level"
                value={levelInput4}
                onChange={(event) => setLevelInput4(event.target.value)}
              />

              <label className="form-label mt-2">EXP (Billions) to add</label>
              <div id="expBillAddList" className="vstack gap-2">
                {expBillAddRows.map((row, index) => (
                  <div className="input-group" key={row.id}>
                    <span className="input-group-text">B</span>
                    <input
                      id={index === 0 ? "expInput3" : undefined}
                      type="number"
                      className="form-control exp-bill-add-item"
                      placeholder="Enter Exp (B)"
                      value={row.value}
                      onChange={(event) => {
                        setExpBillAddRows((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item))
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-remove
                      disabled={expBillAddRows.length <= 1}
                      onClick={() => removeRow(expBillAddRows, setExpBillAddRows, row.id, 1)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button
                  id="expBillAddMoreBtn"
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setExpBillAddRows((prev) => [...prev, newRow()])}
                >
                  Add another (B)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => {
                    const total = sumInputs(expBillAddItems);
                    setExpLevelOutput3(String(expInBillAdd(total, toNum(levelInput4))));
                    setExpBillAddSumHint(`Total EXP (B) added: ${total}`);
                  }}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInput4("");
                    setExpBillAddRows([{ id: "expInput3", value: "" }]);
                    setExpLevelOutput3("");
                    setExpBillAddSumHint("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="input-group mt-2">
                <input id="expLevelOutput3" className="form-control mono" value={expLevelOutput3} readOnly placeholder="Level" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(expLevelOutput3)}
                  data-copy-target="expLevelOutput3"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
              <div className="form-text mono" id="expBillAddSumHint">
                {expBillAddSumHint}
              </div>
            </div>
          </div>

          <div className="card" id="addLevels">
            <div className="card-header">Add Levels</div>
            <div className="card-body">
              <label className="form-label">Levels to add (two or more)</label>
              <div id="addLevelsList" className="vstack gap-2">
                {addLevelRows.map((row) => (
                  <div className="input-group" key={row.id}>
                    <span className="input-group-text">Lv</span>
                    <input
                      type="number"
                      className="form-control add-level-item"
                      placeholder="Enter Level"
                      value={row.value}
                      onChange={(event) => {
                        setAddLevelRows((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item))
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      data-remove
                      disabled={addLevelRows.length <= 2}
                      onClick={() => removeRow(addLevelRows, setAddLevelRows, row.id, 2)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-2 flex-wrap">
                <button
                  id="addLevelsMoreBtn"
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setAddLevelRows((prev) => [...prev, newRow()])}
                >
                  Add another level
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => {
                    const out = addLevels(addLevelItems);
                    setAddLevelsOutput(String(out));
                    const totalExp = addLevelItems.reduce((sum, level) => sum + level2Exp(level), 0);
                    setAddLevelsSumHint(`Total EXP summed: ${totalExp.toLocaleString("en-US")}`);
                  }}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setAddLevelRows([newRow(), newRow()]);
                    setAddLevelsOutput("");
                    setAddLevelsSumHint("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="input-group mt-2">
                <input id="addLevelsOutput" className="form-control mono" value={addLevelsOutput} readOnly placeholder="Level" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(addLevelsOutput)}
                  data-copy-target="addLevelsOutput"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
              <div className="form-text mono" id="addLevelsSumHint">
                {addLevelsSumHint}
              </div>
            </div>
          </div>

          <div className="card" id="level24499s">
            <div className="card-header">Level → # of 4499s</div>
            <div className="card-body">
              <input
                id="levelInput5"
                type="number"
                className="form-control"
                placeholder="Level"
                value={levelInput5}
                onChange={(event) => setLevelInput5(event.target.value)}
              />
              <div className="d-flex gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-primary btn-calc"
                  onClick={() => setLevelTo4499Output(String(levelTo4499Equivalents(toNum(levelInput5))))}
                >
                  =
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setLevelInput5("");
                    setLevelTo4499Output("");
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="input-group mt-2">
                <input id="LevelTo4499" className="form-control mono" value={levelTo4499Output} readOnly placeholder="# of 4499s" />
                <button
                  type="button"
                  className="btn btn-outline-secondary copy-btn"
                  onClick={() => copyText(levelTo4499Output)}
                  data-copy-target="LevelTo4499"
                  aria-label="Copy output"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <button
        id="scroll-to-top"
        type="button"
        className={`btn btn-primary scroll-top${showTopButton ? " show" : ""}`}
        aria-label="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>
    </div>
  );
}
