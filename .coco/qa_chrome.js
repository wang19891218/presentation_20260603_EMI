// Quick check for dynamically injected chrome elements
const { chromium } = require('playwright');

async function check() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', function(m) { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8770', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(function() { return window.Reveal && window.Reveal.isReady(); }, { timeout: 15000 });
  await page.waitForTimeout(2000);
  const overviewBtn = await page.locator('.overview-toggle').count();
  const slideNumber = await page.locator('.slide-number').count();
  const progressBar = await page.locator('.progress').count();
  console.log('Overview button (.overview-toggle):', overviewBtn > 0);
  console.log('Slide number (.slide-number):', slideNumber > 0);
  console.log('Progress bar (.progress):', progressBar > 0);
  console.log('Console errors:', errors.length === 0 ? 'none' : errors.join(', '));
  await browser.close();
}

check().catch(function(e) { console.error(e); process.exit(1); });
