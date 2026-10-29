const FIXTURES = Object.freeze({
  "192.0.2.10": { family: "IPv4", network: "Documentation network A", location: "Example region" },
  "198.51.100.20": { family: "IPv4", network: "Documentation network B", location: "Example region" },
  "2001:db8::10": { family: "IPv6", network: "Documentation IPv6 network", location: "Example region" }
});

const PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edge IP Inspector Demo</title><link rel="stylesheet" href="/style.css"></head>
<body><main><h1>Edge IP Inspector</h1><p>Inspect synthetic network context for documentation addresses.</p>
<form id="lookup"><label for="ip">IP address</label><input id="ip" name="ip" value="192.0.2.10" maxlength="45" required>
<button type="submit">Inspect</button></form><p id="message" role="status" aria-live="polite"></p>
<dl id="result"></dl><p class="note">Sample data only. No live lookup or account token.</p></main>
<script src="/app.js" defer></script></body></html>`;

const STYLE = `:root{font-family:system-ui,sans-serif;color-scheme:light dark}body{margin:0;padding:2rem;line-height:1.5}main{max-width:42rem;margin:auto}form{display:flex;flex-wrap:wrap;gap:.7rem;align-items:end}label{width:100%}input{font:inherit;padding:.5rem;min-width:16rem}button{font:inherit;padding:.5rem 1rem}dl{display:grid;grid-template-columns:max-content 1fr;gap:.5rem 1rem}dt{font-weight:bold}.note{opacity:.75}`;

const CLIENT = `const form=document.querySelector('#lookup');
const message=document.querySelector('#message');
const result=document.querySelector('#result');
form.addEventListener('submit',async event=>{
  event.preventDefault(); result.replaceChildren(); message.textContent='Checking sample data…';
  try {
    const ip=document.querySelector('#ip').value.trim();
    const response=await fetch('/inspect?ip='+encodeURIComponent(ip));
    const data=await response.json();
    if(!response.ok){message.textContent=data.error||'Inspection failed';return;}
    message.textContent=data.found?'Fixture found':'No fixture for this address';
    for(const [key,value] of Object.entries(data.context||{})){
      const term=document.createElement('dt');term.textContent=key;
      const detail=document.createElement('dd');detail.textContent=String(value);
      result.append(term,detail);
    }
  } catch {message.textContent='Unable to inspect this address';}
});`;

function response(body, type, status = 200, extra = {}) {
  return new Response(body, { status, headers: { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra } });
}
function json(body, status = 200) { return response(JSON.stringify(body), "application/json; charset=utf-8", status); }

export function isValidIp(value) {
  if (typeof value !== "string" || value.length > 45 || value !== value.trim()) return false;
  if (value.includes(":")) {
    if (!/^[0-9a-fA-F:]+$/.test(value) || value.includes(":::")) return false;
    const parts = value.split("::");
    if (parts.length > 2) return false;
    const groups = parts.flatMap(part => part ? part.split(":") : []);
    if (groups.some(group => !/^[0-9a-fA-F]{1,4}$/.test(group))) return false;
    return parts.length === 2 ? groups.length < 8 : groups.length === 8;
  }
  const groups = value.split(".");
  return groups.length === 4 && groups.every(part => /^(0|[1-9][0-9]{0,2})$/.test(part) && Number(part) <= 255);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
    if (url.pathname === "/health") return json({ ok: true });
    if (url.pathname === "/") return response(PAGE, "text/html; charset=utf-8", 200, { "Content-Security-Policy": "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'" });
    if (url.pathname === "/style.css") return response(STYLE, "text/css; charset=utf-8");
    if (url.pathname === "/app.js") return response(CLIENT, "application/javascript; charset=utf-8");
    if (url.pathname !== "/inspect") return json({ error: "not_found" }, 404);
    const ip = url.searchParams.get("ip");
    if (!isValidIp(ip)) return json({ error: "A valid IP address is required" }, 400);
    return json({ ip, found: Object.hasOwn(FIXTURES, ip), context: FIXTURES[ip] || null, data_source: "synthetic_documentation_fixtures" });
  }
};
