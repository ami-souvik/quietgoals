import { test, expect } from '@playwright/test';

test.describe('Quiet Goals Web - Happy Path', () => {
  test('sign-in (mocked) → create → edit → reorder → complete → restore', async ({ page }) => {
    // 1. Sign-in (mocked via dev provider)
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Quiet Goals' })).toBeVisible();

    const githubButton = page.getByRole('button', { name: /continue with github/i });
    await githubButton.click();

    // Verify redirected to dashboard
    await page.waitForURL('/');
    await expect(page.getByRole('button', { name: /active/i })).toBeVisible();

    // Generate unique names for test isolation
    const timestamp = Date.now();
    const titleA = `Alpha ${timestamp}`;
    const titleAEdited = `Alpha ${timestamp} Edited`;
    const titleB = `Beta ${timestamp}`;

    // 2. Create Goal A
    await page.getByRole('button', { name: /\+ new goal/i }).click();
    const inputA = page.getByPlaceholder(/type a goal and press enter/i);
    await expect(inputA).toBeVisible();
    await inputA.fill(titleA);
    await inputA.press('Enter');

    await expect(page.getByText(titleA, { exact: true })).toBeVisible();

    // Create Goal B
    await page.getByRole('button', { name: /\+ new goal/i }).click();
    const inputB = page.getByPlaceholder(/type a goal and press enter/i);
    await expect(inputB).toBeVisible();
    await inputB.fill(titleB);
    await inputB.press('Enter');

    await expect(page.getByText(titleB, { exact: true })).toBeVisible();

    // 3. Edit Goal A inline
    const goalTitleSpan = page.getByText(titleA, { exact: true });
    await goalTitleSpan.click();

    // The inline editing input should appear
    const editInput = page.locator('input.border-b');
    await expect(editInput).toBeVisible();
    await editInput.fill(titleAEdited);
    await editInput.press('Enter');

    // Verify title has been updated
    await expect(page.getByText(titleAEdited, { exact: true })).toBeVisible();
    await expect(page.getByText(titleA, { exact: true })).not.toBeVisible();

    // 4. Reorder: move Goal B up using keyboard shortcut Alt+ArrowUp
    const goalBItem = page.getByRole('listitem', { name: new RegExp(titleB) });
    await goalBItem.click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Alt+ArrowUp');

    // Confirm both are visible and Goal B precedes Goal A Edited in the active list
    await expect(page.getByText(titleB, { exact: true })).toBeVisible();
    await expect(page.getByText(titleAEdited, { exact: true })).toBeVisible();

    const allTitles = await page.locator('[title="Click or press Enter/E to edit"]').allInnerTexts();
    const idxB = allTitles.indexOf(titleB);
    const idxA = allTitles.indexOf(titleAEdited);
    expect(idxB).toBeGreaterThanOrEqual(0);
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeLessThan(idxA);

    // 5. Complete Goal B
    const completeBtn = page.getByRole('button', { name: `Complete goal: ${titleB}` });
    await completeBtn.click({ force: true });

    // Exit animation completes and Goal B collapses out of active list
    await expect(page.getByText(titleB, { exact: true })).not.toBeVisible({ timeout: 5000 });

    // 6. View Archive & Restore Goal B
    const archiveTab = page.getByRole('button', { name: /archive/i });
    await archiveTab.click();

    // Verify Goal B is in the Archive under Completed
    await expect(page.getByText(titleB, { exact: true })).toBeVisible();

    // Click Restore
    const restoreBtn = page.getByRole('button', { name: `Restore: ${titleB}` });
    await restoreBtn.click();

    // Switch back to Active view
    const activeTab = page.getByRole('button', { name: /active/i });
    await activeTab.click();

    // Verify Goal B is back in the Active list
    await expect(page.getByText(titleB, { exact: true })).toBeVisible();
  });
});
