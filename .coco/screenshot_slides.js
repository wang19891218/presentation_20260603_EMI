// Render all 14 slides to PNG with ALL fragments expanded.
// Saves to qa/round1/slide_01.png ... slide_14.png at 1280x720.
// Usage: NODE_PATH=... node .coco/screenshot_slides.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://127.0.0.1:8770';
const OUT_DIR = path.join(__dirname, '..', 'qa', 'round1');

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', function(m) {
    if (m.type() === 'error') errors.push('[' + m.type() + '] ' + m.text());
  });
  page.on('pageerror', function(e) {
    errors.push('[pageerror] ' + e.message);
  });

  console.log('Loading deck...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(function() {
    return typeof window.Reveal !== 'undefined' && window.Reveal.isReady();
  }, { timeout: 15000 });
  await page.waitForTimeout(1500);

  const totalSlides = await page.evaluate(function() {
    return window.Reveal.getTotalSlides();
  });
  console.log('Total slides reported by Reveal:', totalSlides);

  // Reveal.getTotalSlides() counts horizontal slides only (not fragment states).
  // We navigate 0..N-1 by horizontal index, advance ALL fragments, then screenshot.
  var saved = [];
  for (var i = 0; i < totalSlides; i++) {
    // Navigate to slide i, fragment 0
    await page.evaluate(function(idx) {
      window.Reveal.slide(idx, 0, 0);
    }, i);
    await page.waitForTimeout(600);

    // Advance all fragments on this slide to show everything
    var advanced = 0;
    for (var f = 0; f < 30; f++) {
      var changed = await page.evaluate(function() {
        return window.Reveal.nextFragment();
      });
      if (!changed) break;
      advanced++;
      await page.waitForTimeout(200);
    }

    // Extra settle time for canvas/SVG components
    await page.waitForTimeout(700);

    var paddedIdx = String(i + 1).padStart(2, '0');
    var outPath = path.join(OUT_DIR, 'slide_' + paddedIdx + '.png');
    await page.screenshot({ path: outPath, fullPage: false, clip: { x: 0, y: 0, width: 1280, height: 720 } });

    var stat = fs.statSync(outPath);
    console.log('Slide ' + (i + 1) + ': fragments advanced=' + advanced + ', size=' + stat.size + ' bytes -> ' + outPath);
    saved.push({ slide: i + 1, path: outPath, size: stat.size, fragmentsAdvanced: advanced });
  }

  if (errors.length > 0) {
    console.warn('Console errors during session:', errors);
  } else {
    console.log('No console errors.');
  }

  // Verify all files are non-trivial (>10 KB)
  var blanks = saved.filter(function(s) { return s.size < 10240; });
  if (blanks.length > 0) {
    console.error('WARNING: possibly blank slides:', blanks.map(function(s) { return s.slide; }));
  }

  console.log('\nDone. ' + saved.length + ' PNGs in ' + OUT_DIR);
  await browser.close();
  process.exit(blanks.length > 0 ? 1 : 0);
}

main().catch(function(err) {
  console.error('Screenshot script error:', err);
  process.exit(2);
});
