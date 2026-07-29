import puppeteer from 'puppeteer'

const url = process.argv[2] || 'http://localhost:3100'
const widths = [390, 430, 768, 1024, 1366, 1440, 1920]
const browser = await puppeteer.launch()
const results = []

for (const width of widths) {
  const page = await browser.newPage()
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))
  await page.setViewport({ width, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle0' })

  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    missingTargets: [...document.querySelectorAll('a[href^="#"]')]
      .map(link => link.getAttribute('href'))
      .filter(href => href !== '#' && !document.querySelector(href)),
    hiddenHeadings: [...document.querySelectorAll('h1,h2,h3')]
      .filter(heading => heading.getBoundingClientRect().width === 0)
      .map(heading => heading.textContent.trim())
  }))

  results.push({ width, ...layout, errors })
  await page.close()
}

const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.setRequestInterception(true)
let chatMode = 'success'
page.on('request', request => {
  if (!request.url().endsWith('/api/chat')) return request.continue()
  if (chatMode === 'error') {
    return request.respond({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Testowy błąd połączenia.' })
    })
  }
  return request.respond({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      reply: '**Najważniejsze:**\n- Dokument pierwszy\n- Dokument drugi\n\n' + 'Długa odpowiedź testowa. '.repeat(80)
    })
  })
})
await page.goto(url, { waitUntil: 'networkidle0' })
await page.click('.faq-prompts button')
await page.waitForFunction(() => document.querySelectorAll('.chat-message.bot').length > 1)
const success = await page.evaluate(() => ({
  strong: Boolean(document.querySelector('.chat-message.bot:last-child strong')),
  list: Boolean(document.querySelector('.chat-message.bot:last-child ul')),
  contained: document.querySelector('.chat-messages').scrollHeight > document.querySelector('.chat-messages').clientHeight,
  inputVisible: document.querySelector('.chat-input').getBoundingClientRect().width > 0
}))

chatMode = 'error'
await page.type('#chat-input', 'Test błędu')
await page.click('.chat-send')
await page.waitForFunction(() => document.querySelector('.chat-message.error'))
const errorState = await page.$eval('.chat-message.error', element => element.textContent.includes('Testowy błąd'))

await page.click('.service:nth-child(2) .service-toggle')
const serviceExpanded = await page.$eval('.service:nth-child(2) .service-toggle', element => element.getAttribute('aria-expanded'))

console.log(JSON.stringify({ viewports: results, chat: { success, errorState }, serviceExpanded }, null, 2))
await browser.close()
