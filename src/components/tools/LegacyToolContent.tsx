"use client";

import { useEffect, useRef } from "react";

import type { LegacyToolPage, LegacyToolScript } from "@/lib/legacy-tools";

function appendScript(host: HTMLElement, scriptData: LegacyToolScript) {
  return new Promise<void>((resolve) => {
    const script = document.createElement("script");
    for (const [key, value] of Object.entries(scriptData.attrs || {})) {
      if (value === true) {
        script.setAttribute(key, "");
      } else {
        script.setAttribute(key, String(value));
      }
    }
    if (scriptData.code) {
      script.text = scriptData.code;
    }

    const hasSrc = Object.prototype.hasOwnProperty.call(scriptData.attrs || {}, "src");
    if (hasSrc) {
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => resolve(), { once: true });
    }

    host.appendChild(script);
    if (!hasSrc) resolve();
  });
}

async function injectContent(host: HTMLElement, html: string, fetchShim: string, scripts: LegacyToolScript[]) {
  (window as { __TPPC_TOOL_READY?: boolean }).__TPPC_TOOL_READY = false;
  host.innerHTML = "";

  const template = document.createElement("template");
  template.innerHTML = html;
  host.appendChild(template.content.cloneNode(true));

  if (fetchShim.trim()) {
    const shim = document.createElement("script");
    shim.text = fetchShim;
    host.appendChild(shim);
  }

  for (const scriptData of scripts) {
    await appendScript(host, scriptData);
  }

  (window as { __TPPC_TOOL_READY?: boolean }).__TPPC_TOOL_READY = true;
}

export function LegacyToolContent({ page, className = "" }: { page: LegacyToolPage; className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    void injectContent(host, page.html, page.fetchShim, page.scripts || []).then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
      (window as { __TPPC_TOOL_READY?: boolean }).__TPPC_TOOL_READY = false;
      host.innerHTML = "";
    };
  }, [page.html, page.fetchShim, page.scripts]);

  return (
    <>
      {page.styles.map((css, i) => (
        <style key={`legacy-style-${i}`} dangerouslySetInnerHTML={{ __html: css }} />
      ))}
      <div ref={hostRef} className={className} />
    </>
  );
}
