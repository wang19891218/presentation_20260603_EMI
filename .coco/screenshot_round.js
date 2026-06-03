// Render all 14 slides to PNG (all fragments expanded) into a named round dir.
// Usage: NODE_PATH=... node .coco/screenshot_round.js <roundDir>
// e.g.:  NODE_PATH=... node .coco/screenshot_round.js qa/round2
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

var roundDir = process.argv[2] || 'qa/round2';
var OUT_DIR = path.join(__dirname, '..', roundDir);
var BASE_URL = 'http://127.0.0.1:8770';

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  var browser = await chromium.launch({ headless: true });
  var context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  var page = await context.newPage();
  var errors = [];
  page.on('console', function(m) { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', function(e) { errors.push(e.message); });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForFunction(function() { return window.Reveal && window.Reveal.isReady(); }, { timeout: 15000 });
  await page.waitForTimeout(1500);

  var total = await page.evaluate(function() { return window.Reveal.getTotalSlides(); });
  console.log('Total slides:', total);

  for (var i = 0; i < total; i++) {
    await page.evaluate(function(idx) { window.Reveal.slide(idx, 0, 0); }, i);
    await page.waitForTimeout(600);
    // Advance all fragments
    for (var f = 0; f < 30; f++) {
      var ok = await page.evaluate(function() { return window.Reveal.nextFragment(); });
      if (!ok) break;
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(800);
    var pad = String(i + 1).padStart(2, '0');
    var out = path.join(OUT_DIR, 'slide_' + pad + '.png');
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    var sz = fs.statSync(out).size;
    console.log('slide ' + (i+1) + ': ' + sz + ' bytes');
  }
  if (errors.length) console.warn('JS errors:', errors);
  else console.log('No console errors.');
  await browser.close();
}
main().catch(function(e) { console.error(e); process.exit(1); });
