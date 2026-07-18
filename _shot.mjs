import puppeteer from 'puppeteer'

const url = process.argv[2] || 'http://localhost:3100'
const out = process.argv[3] || './temporary screenshots'
const targets = [
  ['hero', 1440, 900, 0],
  ['hero-m', 375, 780, 0],
  ['about', 1440, 900, '#o-mnie'],
  ['contact', 1440, 1000, '#kontakt'],
  ['contact-m', 375, 900, '#kontakt'],
  ['props', 1440, 900, '#nieruchomosci']
]

const browser = await puppeteer.launch()
for (const [name, width, height, anchor] of targets) {
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.goto(`${url}?screenshot`, { waitUntil: 'networkidle0' })
  if (anchor) await page.evaluate(a => document.querySelector(a).scrollIntoView(), anchor)
  await new Promise(r => setTimeout(r, 400))
  await page.screenshot({ path: `${out}/sec-${name}.png` })
  await page.close()
  console.log(name)
}
await browser.close()
