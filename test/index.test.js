import test from "node:test";
import assert from "node:assert/strict";
import worker, { isValidIp } from "../src/index.js";

const call = path => worker.fetch(new Request(`https://example.invalid${path}`));

test("serves the browser application with a strict policy", async () => {
  const response = await call("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /script-src 'self'/);
  assert.match(await response.text(), /Sample data only/);
});

test("returns only synthetic fixture data", async () => {
  const result = await (await call("/inspect?ip=192.0.2.10")).json();
  assert.equal(result.context.network, "Documentation network A");
  assert.equal((await (await call("/inspect?ip=203.0.113.7")).json()).context, null);
});

test("rejects invalid addresses and methods", async () => {
  assert.equal(isValidIp("2001:db8::10"), true);
  assert.equal(isValidIp("2001:::10"), false);
  assert.equal((await call("/inspect?ip=127.0.0.999")).status, 400);
  assert.equal((await worker.fetch(new Request("https://example.invalid/inspect", { method: "POST" }))).status, 405);
});
