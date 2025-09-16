import https from "node:https"
export function postWebhook(urlString, payload) {
  try {
    const u = new URL(urlString)
    const body = JSON.stringify(payload)
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }
    const req = https.request(opts, res => res.on("data", ()=>{}))
    req.on("error", ()=>{})
    req.write(body)
    req.end()
  } catch {}
}
