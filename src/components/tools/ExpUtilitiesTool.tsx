"use client";

import { useState } from "react";

import { exp2Level, level2Exp, levelDifference } from "@/features/exp-utilities/core";

export function ExpUtilitiesTool() {
  const [levelInput, setLevelInput] = useState("");
  const [expInput, setExpInput] = useState("");
  const [levelInput1, setLevelInput1] = useState("");
  const [levelInput2, setLevelInput2] = useState("");

  const [levelExpOutput, setLevelExpOutput] = useState("");
  const [expLevelOutput, setExpLevelOutput] = useState("");
  const [levelDiffOutput, setLevelDiffOutput] = useState("");

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Utilities</div>
        <h1 className="page-title">TPPC Level & Experience Utilities</h1>
        <p className="page-subtitle">Quick reference calculators for TPPC training math.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div className="card" id="levelToExp">
            <h3>Level → Experience</h3>
            <input
              id="levelInput"
              type="number"
              className="field mono"
              value={levelInput}
              onChange={(e) => setLevelInput(e.target.value)}
              placeholder="Enter Level"
            />
            <div className="tool-actions">
              <button
                type="button"
                className="btn btn-primary btn-calc"
                onClick={() => {
                  setLevelExpOutput(String(level2Exp(Number(levelInput))));
                }}
              >
                =
              </button>
            </div>
            <input id="levelExpOutput" className="field mono" readOnly value={levelExpOutput} placeholder="Experience" />
          </div>

          <div className="card" id="expToLevel">
            <h3>Experience → Level</h3>
            <input
              id="expInput"
              type="number"
              className="field mono"
              value={expInput}
              onChange={(e) => setExpInput(e.target.value)}
              placeholder="Enter Experience"
            />
            <div className="tool-actions">
              <button
                type="button"
                className="btn btn-primary btn-calc"
                onClick={() => {
                  setExpLevelOutput(String(exp2Level(Number(expInput))));
                }}
              >
                =
              </button>
            </div>
            <input id="expLevelOutput" className="field mono" readOnly value={expLevelOutput} placeholder="Level" />
          </div>

          <div className="card" id="levelDiff">
            <h3>Level Difference</h3>
            <div className="stack">
              <input
                id="levelInput1"
                type="number"
                className="field mono"
                value={levelInput1}
                onChange={(e) => setLevelInput1(e.target.value)}
                placeholder="Level A"
              />
              <input
                id="levelInput2"
                type="number"
                className="field mono"
                value={levelInput2}
                onChange={(e) => setLevelInput2(e.target.value)}
                placeholder="Level B"
              />
            </div>
            <div className="tool-actions">
              <button
                type="button"
                className="btn btn-primary btn-calc"
                onClick={() => {
                  setLevelDiffOutput(String(levelDifference(Number(levelInput1), Number(levelInput2))));
                }}
              >
                =
              </button>
            </div>
            <input id="levelDiffOutput" className="field mono" readOnly value={levelDiffOutput} placeholder="Difference" />
          </div>
        </div>
      </section>
    </div>
  );
}

