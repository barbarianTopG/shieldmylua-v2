import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import url from "node:url"
import heartbeat from "./handlers/heartbeat.js"
import getInstructions from "./handlers/getInstructions.js"
import serversHandler from "./handlers/servers.js"
import setInstructions from "./handlers/setInstructions.js"
import { sendJson } from "./utils/sendJson.js"
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const PUBLIC_DIR = path.join(__dirname, "public")
const PORT = 3000
const server = http.createServer(async (req, res) => {
  try {
    const parsed = new URL(req.url, `http://${req.headers.host}`)
    const pathname = parsed.pathname
    if (req.method === "POST" && pathname === "/heartbeat") return await heartbeat(req, res)
    if (req.method === "POST" && pathname === "/getInstructions") return await getInstructions(req, res)
    if (req.method === "GET" && pathname === "/servers") return await serversHandler(req, res)
    if (req.method === "POST" && pathname === "/setInstructions") return await setInstructions(req, res)
    if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
      const file = path.join(PUBLIC_DIR, "index.html")
      if (fs.existsSync(file)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(fs.readFileSync(file))
        return
      }
    }
    const staticPath = path.join(PUBLIC_DIR, pathname)
    if (req.method === "GET" && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
      const ext = path.extname(staticPath).toLowerCase()
      const ct = ext === ".js" ? "application/javascript" : ext === ".css" ? "text/css" : "application/octet-stream"
      res.writeHead(200, { "Content-Type": ct })
      res.end(fs.readFileSync(staticPath))
      return
    }
    sendJson(res, 404, { error: "not found" })
  } catch (err) {
    sendJson(res, 500, { error: "internal", details: String(err) })
  }
})
server.listen(PORT, () => console.log(`listening http://localhost:${PORT}`))
