"use client";

import { useState } from "react";

import { USER_SCRIPTS } from "@/data/userscripts";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback below
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(ta);
  return copied;
}

export function UserscriptsRepository() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  const copyScript = async (id: string, code: string) => {
    const ok = await copyText(code);
    if (!ok) {
      setFailedId(id);
      window.setTimeout(() => {
        setFailedId((current) => (current === id ? null : current));
      }, 1200);
      return;
    }

    setFailedId(null);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 1200);
  };

  return (
    <div className="tool-template">
      <section className="surface hero tool-template-header">
        <div className="kicker">Repository</div>
        <h1 className="page-title">TPPC Userscripts</h1>
        <p className="page-subtitle">
          Small quality-of-life scripts for common TPPC actions. Copy and paste as needed.
        </p>
      </section>

      <section className="surface tool-pane userscripts-pane">
        <div className="userscripts-list">
          {USER_SCRIPTS.map((script, index) => (
            <div key={script.id}>
              <article className="userscript-entry">
                <h2 className="userscript-title">{script.title}</h2>
                <p className="userscript-description">{script.description}</p>

                <pre className="userscript-code" aria-label={`${script.title} code`}>
                  <code>{script.code}</code>
                </pre>

                <div className="userscript-actions">
                  <button
                    type="button"
                    className="userscript-copy-btn"
                    onClick={() => {
                      void copyScript(script.id, script.code);
                    }}
                  >
                    {copiedId === script.id ? "Copied!" : failedId === script.id ? "Copy failed" : "Copy code"}
                  </button>
                </div>
              </article>

              {index < USER_SCRIPTS.length - 1 ? (
                <hr className="userscript-divider" aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
