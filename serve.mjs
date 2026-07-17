import http from 'http'
import fs from 'fs'
import path from 'path'

const port = 3000
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  let filePath = urlPath === '/' ? '/index.html' : urlPath
  filePath = path.join(process.cwd(), filePath)
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return }
    res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' })
    res.end(data)
  })
}).listen(port, () => console.log(`http://localhost:${port}`))
