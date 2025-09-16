import parseBody from "../utils/parseBody.js"
import { loadDB, saveDB } from "../database.js"
import { sendJson } from "../utils/sendJson.js"
export default async function getInstructions(req, res) {
  try {
    const body = await parseBody(req)
    const { placeId, jobId } = body
    if (!placeId || !jobId) return sendJson(res, 400, { error: "missing placeId or jobId" })
    const db = loadDB()
    const key = `${placeId}:${jobId}`
    const row = db.servers[key]
    if (!row) return sendJson(res, 200, { code: null })
    const code = row.instructions || null
    row.instructions = null
    db.servers[key] = row
    saveDB(db)
    sendJson(res, 200, { code })
  } catch (err) {
    sendJson(res, 400, { error: String(err) })
  }
}

