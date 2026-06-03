// Playwright headless QA for EMI 2026 deck
// Usage: node .coco/qa_slides.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:8770';
const SCREENSHOTS_DIR = path.join(__dirname, '..', '.coco', 'screenshots');

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const errors = [];
  const consoleLogs = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[error] ${msg.text()}`);
    }
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}`);
  });

  console.log('Loading deck...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for Reveal to init
  await page.waitForFunction(() => typeof window.Reveal !== 'undefined' && window.Reveal.isReady(), { timeout: 15000 });
  console.log('Reveal is ready');

  // Check window.EMI_DATA
  const emiDataPresent = await page.evaluate(() => typeof window.EMI_DATA !== 'undefined');
  console.log('window.EMI_DATA present:', emiDataPresent);

  // Check chrome elements
  const progressBar = await page.$('.progress');
  const overviewBtn = await page.$('#overview-btn');
  console.log('Progress bar:', !!progressBar);
  console.log('Overview button:', !!overviewBtn);

  // Get total slide count
  const totalSlides = await page.evaluate(() => window.Reveal.getTotalSlides());
  console.log('Total slides:', totalSlides);

  // Navigate through all slides and screenshot
  const slideChecks = [];
  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx) => window.Reveal.slide(idx, 0, 0), i);
    await page.waitForTimeout(800); // let animations settle
    const screenshotPath = path.join(SCREENSHOTS_DIR, `slide_${String(i+1).padStart(2,'0')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    // Check page number display
    const pageNum = await page.evaluate(() => {
      const el = document.querySelector('#page-num');
      return el ? el.textContent : null;
    });

    // Check for any slide-specific component elements
    const hasCanvas = await page.evaluate(() => !!document.querySelector('.reveal .present canvas'));
    const hasSvg = await page.evaluate(() => !!document.querySelector('.reveal .present svg'));
    const slideTitle = await page.evaluate(() => {
      const h = document.querySelector('.reveal .present h1, .reveal .present h2');
      return h ? h.textContent.trim().substring(0, 60) : '(no heading)';
    });

    slideChecks.push({
      slide: i + 1,
      title: slideTitle,
      pageNum,
      hasCanvas,
      hasSvg,
      screenshot: `slide_${String(i+1).padStart(2,'0')}.png`,
    });
    console.log(`Slide ${i+1}: "${slideTitle}" | pageNum=${pageNum} | canvas=${hasCanvas} | svg=${hasSvg}`);
  }

  // Check specific components by navigating to expected slides
  // Slide 8 should have EMI.overlay (overlay chart)
  // Slide 5 should have EMI.architecture (SVG)
  // Slide 10 should have EMI.speedup
  // Slide 12 should have EMI.bars
  const componentChecks = {};

  await page.evaluate(() => window.Reveal.slide(4, 0, 0)); // slide 5
  await page.waitForTimeout(1000);
  componentChecks['slide5_architecture_svg'] = await page.evaluate(() => {
    const el = document.querySelector('.reveal .present [data-component="architecture"], .reveal .present .emi-architecture, .reveal .present svg');
    return !!el;
  });

  await page.evaluate(() => window.Reveal.slide(7, 0, 0)); // slide 8
  await page.waitForTimeout(1000);
  componentChecks['slide8_overlay_canvas'] = await page.evaluate(() => {
    const el = document.querySelector('.reveal .present canvas, .reveal .present .emi-overlay');
    return !!el;
  });

  await page.evaluate(() => window.Reveal.slide(9, 0, 0)); // slide 10
  await page.waitForTimeout(1000);
  componentChecks['slide10_speedup'] = await page.evaluate(() => {
    const el = document.querySelector('.reveal .present .emi-speedup, .reveal .present canvas, .reveal .present svg');
    return !!el;
  });

  await page.evaluate(() => window.Reveal.slide(11, 0, 0)); // slide 12
  await page.waitForTimeout(1000);
  componentChecks['slide12_bars'] = await page.evaluate(() => {
    const el = document.querySelector('.reveal .present canvas, .reveal .present .emi-bars, .reveal .present svg');
    return !!el;
  });

  console.log('\n=== COMPONENT CHECKS ===');
  for (const [k, v] of Object.entries(componentChecks)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('  none');
  } else {
    errors.forEach(e => console.log(' ', e));
  }

  // Write report
  const report = {
    emiDataPresent,
    totalSlides,
    progressBarPresent: !!progressBar,
    overviewBtnPresent: !!overviewBtn,
    slides: slideChecks,
    componentChecks,
    consoleErrors: errors,
    allConsoleLogs: consoleLogs.slice(0, 50),
  };
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'qa_report.json'), JSON.stringify(report, null, 2));
  console.log('\nQA report written to .coco/screenshots/qa_report.json');

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('QA script error:', err);
  process.exit(2);
});
