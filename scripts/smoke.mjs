import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";
import path from "node:path";

const port = 31377;
const base = "http://127.0.0.1:" + port;
const executable = path.resolve("node_modules", "next", "dist", "bin", "next");
const app = spawn(process.execPath, [executable, "start", "-H", "127.0.0.1", "-p", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, GEMINI_API_KEY: "", NEXT_TELEMETRY_DISABLED: "1" },
  windowsHide: true,
});
let output = "";
app.stdout.on("data", chunk => { output += chunk.toString(); });
app.stderr.on("data", chunk => { output += chunk.toString(); });
async function request(body) {
  return fetch(base + "/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
}
try {
  let ready = false;
  for (let n = 0; n < 90; n += 1) {
    if (app.exitCode !== null) throw new Error("Server exited: " + output);
    try {
      const r = await fetch(base, { signal: AbortSignal.timeout(2000) });
      if (r.status === 200) { ready = true; break; }
    } catch {}
    await sleep(500);
  }
  assert.ok(ready, "Server not ready: " + output);
  const root = await fetch(base);
  assert.equal(root.status, 200);
  assert.ok((await root.text()).length > 300);
  assert.equal((await request({ mode: "message", content: " " })).status, 400);
  assert.equal((await request({ mode: "message", content: "A".repeat(6001) })).status, 413);
  for (const mode of ["message", "url"]) {
    const text = mode === "url" ? "https://example.com/login" : "Tin nhắn yêu cầu cung cấp mã OTP ngân hàng.";
    const response = await request({ mode, content: text });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.result?.demoMode, true);
    assert.equal(payload.result?.inputType, mode);
    assert.ok(typeof payload.result?.summary === "string");
    assert.ok(Array.isArray(payload.result?.redFlags));
    assert.ok(Number.isFinite(payload.result?.riskScore));
  }
  const malformed = await fetch(base + "/api/analyze", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: '{"mode":"url",', signal: AbortSignal.timeout(5000),
  });
  assert.equal(malformed.status, 400);
  console.log("PASS: production homepage and offline API HTTP smoke cases.");
} finally {
  app.kill();
  await sleep(300);
}
