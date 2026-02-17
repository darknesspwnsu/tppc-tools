"use client";

import { useState } from "react";

import { runUngenderedDiff } from "@/features/ungendered-diff/core";

export function UngenderedDiffTool() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [output1, setOutput1] = useState("");
  const [output2, setOutput2] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Diff</div>
        <h1 className="page-title">TPPC (?) List Diffchecker</h1>
        <p className="page-subtitle">Compare two ungendered lists and spot uniques fast.</p>
      </section>

      <section className="surface tool-pane">
        <div className="tool-template-grid">
          <div>
            <label htmlFor="input1" className="mono" style={{ fontSize: "0.78rem" }}>
              Input Box 1
            </label>
            <textarea
              id="input1"
              className="field-area mono"
              rows={14}
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="input2" className="mono" style={{ fontSize: "0.78rem" }}>
              Input Box 2
            </label>
            <textarea
              id="input2"
              className="field-area mono"
              rows={14}
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
            />
          </div>
        </div>

        <div className="tool-actions">
          <button
            id="runButton"
            type="button"
            className="btn-primary-soft"
            disabled={isRunning}
            onClick={() => {
              if (!input1.trim() && !input2.trim()) {
                setStatus("Please paste a list into at least one box.");
                return;
              }

              setIsRunning(true);
              setStatus("Parsing & comparing...");
              try {
                const out = runUngenderedDiff(input1, input2);
                setOutput1(out.output1);
                setOutput2(out.output2);
                setStatus("Done.");
              } catch (error) {
                console.error(error);
                setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                setIsRunning(false);
              }
            }}
          >
            Compare Lists
          </button>
          <span id="status" className="chip">
            {status}
          </span>
        </div>

        <div id="output-section" className={output1 || output2 ? "" : "d-none"} style={{ marginTop: "0.8rem" }}>
          <div className="tool-template-grid">
            <div>
              <label htmlFor="output1" className="mono" style={{ fontSize: "0.78rem" }}>
                Results for Box 1
              </label>
              <textarea id="output1" className="field-area mono" rows={16} readOnly value={output1} />
            </div>
            <div>
              <label htmlFor="output2" className="mono" style={{ fontSize: "0.78rem" }}>
                Results for Box 2
              </label>
              <textarea id="output2" className="field-area mono" rows={16} readOnly value={output2} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

