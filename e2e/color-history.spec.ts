import { expect, test, type Page } from '@playwright/test';

async function openSeriesControls(page: Page) {
  const edit = page.getByRole('button', { name: 'Edit', exact: true });
  if (await edit.isVisible()) await edit.click();
  const inspector = page
    .getByRole('dialog', { name: 'Refine your visualization' })
    .or(page.locator('.studio-inspector:visible'));
  await inspector.getByRole('tab', { name: 'Design', exact: true }).click();
  const section = inspector.locator('details').filter({
    has: page.locator('summary', { hasText: 'Series, labels & small multiples' }),
  });
  if ((await section.getAttribute('open')) === null)
    await section.locator('summary').first().click();
  return inspector.getByLabel('Color for Amazon', { exact: true });
}

async function closeInspector(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Refine your visualization' });
  if (await dialog.isVisible()) await dialog.getByRole('button', { name: /^Close / }).click();
}

test('a native color-picker interaction creates one undoable edit', async ({ page }, info) => {
  if (info.project.metadata.cpuThrottle) {
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Import data' })).toBeVisible();
  const undo = page.getByRole('button', { name: 'Undo', exact: true, includeHidden: true });
  const redo = page.getByRole('button', { name: 'Redo', exact: true, includeHidden: true });
  await expect(undo).toBeDisabled();
  let swatch = await openSeriesControls(page);
  const original = await swatch.inputValue();
  const finalColor = '#882244';
  await swatch.focus();
  for (const color of ['#1254a8', '#8452a1', finalColor]) {
    // Native pickers emit input repeatedly while dragging. Use the native
    // setter so React sees the same events instead of bypassing its value tracker.
    await swatch.evaluate((element, value) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }, color);
    await expect(swatch).toHaveValue(color);
    await expect(undo).toBeDisabled();
  }
  await swatch.dispatchEvent('change');
  await expect(undo).toBeDisabled();
  await swatch.press('Tab');
  await expect(undo).toBeEnabled();
  await expect(swatch).toHaveValue(finalColor);
  // Reopening and leaving the same swatch must not add another history entry.
  await swatch.focus();
  await swatch.press('Tab');
  await closeInspector(page);

  await undo.click();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeEnabled();
  swatch = await openSeriesControls(page);
  await expect(swatch).toHaveValue(original);
  await closeInspector(page);

  await redo.click();
  await expect(redo).toBeDisabled();
  swatch = await openSeriesControls(page);
  await expect(swatch).toHaveValue(finalColor);
});
