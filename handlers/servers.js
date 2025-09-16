import { loadDB, saveDB } from "../database.js"
import { sendJson } from "../utils/sendJson.js"
export default async function serversHandler(req, res) {
  try {
    const db = loadDB()
    const now = Date.now()
    const out = []
    for (const [key, data] of Object.entries(db.servers)) {
      if (!data || !data.heartbeat) {
        delete db.servers[key]
        continue
      }
      if (now - data.heartbeat > 15 * 60 * 1000) {
        delete db.servers[key]
        continue
      }
      out.push({ placeId: data.placeId, jobId: data.jobId, players: data.players })
    }
    saveDB(db)
    sendJson(res, 200, { servers: out })
  } catch (err) {
    sendJson(res, 500, { error: String(err) })
  }
}
