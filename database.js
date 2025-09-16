import fs from "node:fs"
const DB_FILE = "database.txt"
function ensure() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ servers: {} }))
}
export function loadDB() {
  ensure()
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"))
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify({ servers: {} }))
    return { servers: {} }
  }
}
export function saveDB(obj) {
  fs.writeFileSync(DB_FILE, JSON.stringify(obj))
}
