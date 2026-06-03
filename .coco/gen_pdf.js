// Generate PDF backup of EMI 2026 deck using reveal's ?print-pdf mode
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PRINT_URL = 'http://127.0.0.1:8770/?print-pdf';
const PDF_OUT = path.join(__dirname, '..', 'backup', 'EMI2026_hypernetwork.pdf');

async function main() {
  fs.mkdirSync(path.dirname(PDF_OUT), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', function(m) {
    if (m.type() === 'error') errors.push('[error] ' + m.text());
  });
  page.on('pageerror', function(e) {
    errors.push('[pageerror] ' + e.message);
  });

  console.log('Loading print-pdf URL:', PRINT_URL);
  await page.goto(PRINT_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for Reveal to init and print-pdf layout to apply
  await page.waitForFunction(function() {
    return typeof window.Reveal !== 'undefined' && window.Reveal.isReady();
  }, { timeout: 15000 });

  // Wait for all slides to lay out in print mode
  await page.waitForTimeout(3000);

  // Count sections rendered
  const slideCount = await page.evaluate(function() {
    return document.querySelectorAll('.reveal .slides section.present, .reveal .slides section').length;
  });
  console.log('Sections found for print:', slideCount);

  if (errors.length > 0) {
    console.warn('Console errors encountered:', errors);
  }

  // Generate PDF
  await page.pdf({
    path: PDF_OUT,
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  const stat = fs.statSync(PDF_OUT);
  console.log('PDF written to:', PDF_OUT);
  console.log('PDF size:', (stat.size / 1024 / 1024).toFixed(2), 'MB');

  await browser.close();

  if (stat.size < 50000) {
    console.error('PDF seems too small — possible generation failure');
    process.exit(1);
  }
  process.exit(0);
}

main().catch(function(err) {
  console.error('PDF generation error:', err);
  process.exit(2);
});
