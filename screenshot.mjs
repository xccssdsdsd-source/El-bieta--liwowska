import puppeteer from 'puppeteer'
import fs from 'fs'

const url = process.argv[2] || 'http://localhost:3000'
const widths = [390, 430, 768, 1024, 1366, 1440, 1920]
const outDir = './temporary screenshots'
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

const browser = await puppeteer.launch()
for (const width of widths) {
  const page = await browser.newPage()
  await page.setViewport({ width, height: 1000 })
  await page.goto(`${url}${url.includes('?') ? '&' : '?'}screenshot`, { waitUntil: 'networkidle0' })
  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    const height = document.documentElement.scrollHeight
    for (let y = 0; y < height; y += innerHeight * 0.75) {
      scrollTo(0, y)
      await new Promise(resolve => setTimeout(resolve, 40))
    }
    scrollTo(0, 0)
  })
  await new Promise(r => setTimeout(r, 150))
  await page.screenshot({ path: `${outDir}/screenshot-${width}.png`, fullPage: true })
  await page.close()
  console.log(`saved screenshot-${width}.png`)
}
await browser.close()
