export default function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", chunk => body += chunk)
    req.on("end", () => {
      if (!body) return resolve({})
      try {
        resolve(JSON.parse(body))
      } catch (err) {
        reject(new Error("invalid json"))
      }
    })
    req.on("error", reject)
  })
}