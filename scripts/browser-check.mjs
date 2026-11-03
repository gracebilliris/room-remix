import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : '@playwright/test');
const url = process.env.ROOM_REMIX_URL || 'http://127.0.0.1:5193/';
const label = url.includes('github.io') ? 'production' : 'local';
await mkdir('artifacts', { recursive: true });
const context = await chromium.launchPersistentContext(resolve(`artifacts/${label}-browser-profile`), {
  headless: true,
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
  downloadsPath: resolve('artifacts/downloads'),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = context.pages()[0];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const storage = () => page.evaluate(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')));
async function waitForLayout(predicate) {
  await page.waitForFunction(predicate, null, { timeout: 12_000 });
  return storage();
}
const checks = [];
async function check(name, run) {
  await run();
  checks.push(name);
  console.log(`PASS ${name}`);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('room-remix-layout-v1'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-webgl="ready"]');
  await page.waitForTimeout(1200);
  await check('WebGL room renders six procedural furniture pieces without errors', async () => {
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal((await storage()).items.length, 6);
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl && !gl.isContextLost();
    }), true);
  });
  await page.screenshot({ path: `artifacts/${label}-desktop.png`, fullPage: true });

  await check('Catalog adds an actual piece with accessible precise move and rotation', async () => {
    await page.getByRole('button', { name: 'Add Everyday desk', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.length === 7);
    await page.getByLabel('Piece X position', { exact: true }).fill('1.75');
    await page.getByLabel('Piece Z position', { exact: true }).fill('1.5');
    await page.getByRole('button', { name: 'Apply furniture position', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'desk').x === 1.75);
    await page.getByRole('button', { name: 'Rotate Everyday desk', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'desk').rotation === 90);
    await page.keyboard.press('r');
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'desk').rotation === 180);
  });

  await check('Save and reload retain furniture, coordinates and rotation', async () => {
    await page.getByRole('button', { name: 'Save room', exact: true }).click();
    const before = await storage();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-webgl="ready"]');
    assert.deepEqual(await storage(), before);
    assert.equal(await page.getByTestId('room-item-desk').count(), 1);
  });

  await check('Raycast dragging moves furniture on the grid and rejects an overlapping drop', async () => {
    await page.getByRole('button', { name: 'Top view', exact: true }).click();
    await page.waitForTimeout(900);
    const box = await page.locator('canvas').boundingBox();
    const layout = await storage();
    const distance = Math.max(layout.room.width, layout.room.depth) * 1.9;
    const floorScale = box.height / (2 * distance * Math.tan(20 * Math.PI / 180));
    const tableScale = box.height / (2 * (distance - .45) * Math.tan(20 * Math.PI / 180));
    let startX = box.x + box.width / 2 - .75 * tableScale;
    let startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY + 1.25 * floorScale, { steps: 14 });
    await page.mouse.up();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'table').z === 1.25);
    const before = await storage();
    assert.equal(before.items.find(item => item.kind === 'table').x, -.75);
    startY = box.y + box.height / 2 + 1.25 * tableScale;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX, startY - 2.75 * floorScale, { steps: 16 });
    await page.mouse.up();
    await page.getByRole('alert').filter({ hasText: /overlaps/ }).waitFor();
    assert.deepEqual(await storage(), before);
  });

  await check('Out-of-bounds moves and unsafe room shrinks preserve every piece', async () => {
    await page.getByLabel('Piece X position', { exact: true }).fill('100');
    await page.getByRole('button', { name: 'Apply furniture position', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: /wall/ }).waitFor();
    assert.equal((await storage()).items.find(item => item.kind === 'table').x, -.75);
    await page.getByLabel('Room width', { exact: true }).fill('3');
    await page.getByLabel('Room depth', { exact: true }).fill('3');
    await page.getByRole('button', { name: 'Apply size', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: /Nothing has been removed/ }).waitFor();
    assert.equal((await storage()).room.width, 6);
    assert.equal((await storage()).items.length, 7);
    await page.getByLabel('Room width', { exact: true }).fill('7');
    await page.getByLabel('Room depth', { exact: true }).fill('6');
    await page.getByRole('button', { name: 'Apply size', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).room.width === 7);
  });

  let exported;
  await check('JSON export contains the usable layout', async () => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    exported = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    assert.equal(exported.items.length, 7);
    assert.equal(exported.room.width, 7);
    await download.saveAs(resolve(`artifacts/${label}-export.json`));
  });

  await check('Two room presets and destructive confirmation work', async () => {
    await page.getByRole('button', { name: 'Sunday living', exact: true }).click();
    await page.getByRole('button', { name: /Slow mornings A restful little retreat/ }).click();
    await page.getByRole('button', { name: 'Keep my room', exact: true }).click();
    assert.equal((await storage()).items.length, 7);
    await page.getByRole('button', { name: 'Sunday living', exact: true }).click();
    await page.getByRole('button', { name: /Slow mornings A restful little retreat/ }).click();
    await page.getByRole('button', { name: 'Yes, make a fresh start', exact: false }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).name === 'Slow mornings');
    assert.equal((await storage()).items.length, 5);
    assert.equal(await page.getByTestId('room-item-bed').count(), 1);
  });

  await check('Import sanitization refuses corrupt JSON and restores a valid exported room', async () => {
    const before = await storage();
    await page.getByLabel('Import room JSON', { exact: true }).setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"items":[]}') });
    await page.getByRole('alert').filter({ hasText: /not valid/ }).waitFor();
    assert.deepEqual(await storage(), before);
    await page.getByLabel('Import room JSON', { exact: true }).setInputFiles({ name: 'my-room.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.getByRole('button', { name: 'Yes, make a fresh start', exact: false }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.length === 7);
    assert.deepEqual(await storage(), exported);
  });

  await check('Keyboard and mobile list controls move and remove selected pieces', async () => {
    await page.getByTestId('room-item-desk').click();
    await page.keyboard.press('ArrowLeft');
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'desk').x === 1.5);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: '3D view', exact: true }).click();
    await page.getByRole('button', { name: 'Move right', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.find(item => item.kind === 'desk').x === 1.75);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Mobile layout must not overflow');
    await page.getByRole('button', { name: 'Remove Everyday desk', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.length === 6);
    assert.equal(await page.getByTestId('room-item-desk').count(), 0);
    await page.getByRole('button', { name: 'Reset room', exact: true }).click();
    await page.getByRole('button', { name: 'Keep my room', exact: true }).click();
    assert.equal((await storage()).room.width, 7);
    await page.getByRole('button', { name: 'Reset room', exact: true }).click();
    await page.getByRole('button', { name: 'Yes, make a fresh start', exact: false }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).room.width === 6);
    await page.getByRole('button', { name: 'Toggle grid', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Toggle grid', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Reset camera', exact: true }).click();
    await page.locator('.notice').waitFor({ state: 'hidden' });
    await page.locator('.room-item-list').evaluate(element => { element.scrollTop = 0; });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `artifacts/${label}-mobile.png`, fullPage: true });
  });
  await check('Small-phone layout keeps room, catalog and named save controls inside the viewport', async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    const save = page.getByRole('button', { name: 'Save room', exact: true });
    const bounds = await save.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 320);
    await save.click();
    await page.getByRole('status').filter({ hasText: /Room saved/ }).waitFor();
    await page.getByLabel('Search furniture', { exact: true }).fill('desk');
    await page.getByRole('button', { name: 'Add Everyday desk', exact: true }).click();
    await waitForLayout(() => JSON.parse(localStorage.getItem('room-remix-layout-v1')).items.some(item => item.kind === 'desk'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `artifacts/${label}-small-phone.png`, fullPage: true });
  });
  await check('No browser console or runtime errors during the full interaction suite', async () => assert.deepEqual(errors, []));
  const report = { url, checkedAt: new Date().toISOString(), checks, errors, passed: true };
  await writeFile(`artifacts/${label}-browser-results.json`, JSON.stringify(report, null, 2));
  console.log(`Verified ${checks.length} browser checks at ${url}`);
} catch (error) {
  await page.screenshot({ path: `artifacts/${label}-failure.png`, fullPage: true }).catch(() => {});
  await writeFile(`artifacts/${label}-browser-results.json`, JSON.stringify({ url, checks, errors, passed: false, failure: String(error) }, null, 2));
  throw error;
} finally {
  await context.close();
}
