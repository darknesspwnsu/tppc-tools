import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

import { PARITY_SCENARIOS, installDeterministicNetwork, waitForToolRuntime } from "../tests/parity/scenarios";
import { withParityBasePath } from "../tests/parity/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outRoot = path.join(root, "tests", "parity", "golden");

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

async function waitForServer(url: string, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for dev server: ${url}`);
}

async function startDevServer(port = 4179) {
  const child = spawn(npmCommand(), ["run", "dev", "--", "--port", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_BASE_PATH: ""
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const logs: string[] = [];
  const onData = (buf: Buffer) => {
    logs.push(buf.toString("utf8"));
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);

  try {
    await waitForServer(`http://127.0.0.1:${port}/`);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Failed to start dev server.\n${logs.join("")}\n${String(error)}`);
  }

  return {
    port,
    close: async () => {
      if (child.killed) return;
      child.kill("SIGTERM");
      await new Promise<void>((resolve) => {
        child.once("exit", () => resolve());
        setTimeout(() => {
          if (!child.killed) child.kill("SIGKILL");
          resolve();
        }, 3000);
      });
    }
  };
}

async function ensureOutDir() {
  await fs.mkdir(outRoot, { recursive: true });
}

async function main() {
  await ensureOutDir();

  const server = await startDevServer(4179);
  const browser = await chromium.launch();

  try {
    for (const scenario of PARITY_SCENARIOS) {
      const page = await browser.newPage();
      await installDeterministicNetwork(page);

      const targetPath = withParityBasePath(scenario.canonicalPath);
      const url = `http://127.0.0.1:${server.port}${targetPath}`;
      console.log(`Capturing ${scenario.id} from ${url}`);

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitForToolRuntime(page);
      await scenario.run(page);
      const snapshot = await scenario.extract(page);

      const outFile = path.join(outRoot, `${scenario.id}.json`);
      await fs.writeFile(
        outFile,
        JSON.stringify(
          {
            id: scenario.id,
            slug: scenario.slug,
            source: scenario.canonicalPath,
            snapshot
          },
          null,
          2
        ) + "\n",
        "utf8"
      );

      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(`Captured ${PARITY_SCENARIOS.length} fixture(s) into tests/parity/golden/.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
