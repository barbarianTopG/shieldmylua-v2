import parseBody from "../utils/parseBody.js"
import { loadDB, saveDB } from "../database.js"
import { sendJson } from "../utils/sendJson.js"
export default async function setInstructions(req, res) {
  try {
    const body = await parseBody(req)
    const { username, code } = body
    if (!username || !code) return sendJson(res, 400, { error: "missing username or code" })
    const db = loadDB()
    const now = Date.now()
    let updated = 0
    for (const [key, data] of Object.entries(db.servers)) {
      if (!data || !data.heartbeat) {
        delete db.servers[key]
        continue
      }
      if (now - data.heartbeat > 15 * 60 * 1000) {
        delete db.servers[key]
        continue
      }
      if (Array.isArray(data.players) && data.players.includes(username)) {
        data.instructions = code
        db.servers[key] = data
        updated++
      }
    }
    saveDB(db)
    sendJson(res, 200, { ok: true, serversUpdated: updated })
  } catch (err) {
    sendJson(res, 400, { error: String(err) })
  }
}
