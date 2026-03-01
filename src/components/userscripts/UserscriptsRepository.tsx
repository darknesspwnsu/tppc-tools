"use client";

import { useMemo, useState } from "react";

import { USER_SCRIPTS } from "@/data/userscripts";

type CodeLanguage = "javascript" | "plaintext";
type TokenKind = "plain" | "comment" | "string" | "keyword" | "number" | "literal" | "meta";
type HighlightToken = { kind: TokenKind; value: string };

const JS_KEYWORDS = new Set([
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "return",
  "switch",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
  "async",
  "await"
]);

const JS_LITERALS = new Set(["true", "false", "null", "undefined", "Infinity", "NaN"]);

function isIdentifierStart(char: string) {
  return /^[A-Za-z_$]$/.test(char);
}

function isIdentifierPart(char: string) {
  return /^[A-Za-z0-9_$]$/.test(char);
}

function isDigit(char: string) {
  return /^[0-9]$/.test(char);
}

function pushToken(tokens: HighlightToken[], kind: TokenKind, value: string) {
  if (!value) return;
  const last = tokens[tokens.length - 1];
  if (last && last.kind === kind && kind === "plain") {
    last.value += value;
    return;
  }
  tokens.push({ kind, value });
}

function tokenizeJavaScript(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let i = 0;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (ch === "/" && next === "/") {
      let end = i + 2;
      while (end < code.length && code[end] !== "\n") end += 1;
      const value = code.slice(i, end);
      pushToken(tokens, /^\/\/\s*@/.test(value) ? "meta" : "comment", value);
      i = end;
      continue;
    }

    if (ch === "/" && next === "*") {
      let end = i + 2;
      while (end < code.length - 1 && !(code[end] === "*" && code[end + 1] === "/")) end += 1;
      end = end < code.length - 1 ? end + 2 : code.length;
      pushToken(tokens, "comment", code.slice(i, end));
      i = end;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      let end = i + 1;
      while (end < code.length) {
        const current = code[end];
        if (current === "\\") {
          end += 2;
          continue;
        }
        end += 1;
        if (current === quote) break;
      }
      pushToken(tokens, "string", code.slice(i, end));
      i = end;
      continue;
    }

    if (isDigit(ch)) {
      let end = i + 1;
      while (end < code.length && /[0-9_]/.test(code[end])) end += 1;

      if (code[end] === "." && isDigit(code[end + 1] || "")) {
        end += 1;
        while (end < code.length && /[0-9_]/.test(code[end])) end += 1;
      }

      if (/[eE]/.test(code[end] || "")) {
        let expEnd = end + 1;
        if (/[+-]/.test(code[expEnd] || "")) expEnd += 1;
        if (isDigit(code[expEnd] || "")) {
          end = expEnd + 1;
          while (end < code.length && /[0-9_]/.test(code[end])) end += 1;
        }
      }

      pushToken(tokens, "number", code.slice(i, end));
      i = end;
      continue;
    }

    if (isIdentifierStart(ch)) {
      let end = i + 1;
      while (end < code.length && isIdentifierPart(code[end])) end += 1;
      const word = code.slice(i, end);

      if (JS_KEYWORDS.has(word)) {
        pushToken(tokens, "keyword", word);
      } else if (JS_LITERALS.has(word)) {
        pushToken(tokens, "literal", word);
      } else {
        pushToken(tokens, "plain", word);
      }

      i = end;
      continue;
    }

    pushToken(tokens, "plain", ch);
    i += 1;
  }

  return tokens;
}

function tokenizeCode(code: string, language: CodeLanguage): HighlightToken[] {
  if (language === "plaintext") return [{ kind: "plain", value: code }];
  return tokenizeJavaScript(code);
}

function UserscriptCodeBlock({ title, code, language }: { title: string; code: string; language: CodeLanguage }) {
  const tokens = useMemo(() => tokenizeCode(code, language), [code, language]);

  return (
    <pre className="userscript-code" aria-label={`${title} code`}>
      <code>
        {tokens.map((token, index) =>
          token.kind === "plain" ? (
            token.value
          ) : (
            <span key={`${token.kind}-${index}`} className={`token-${token.kind}`}>
              {token.value}
            </span>
          )
        )}
      </code>
    </pre>
  );
}

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

                <UserscriptCodeBlock
                  title={script.title}
                  code={script.code}
                  language={script.language ?? "javascript"}
                />

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
