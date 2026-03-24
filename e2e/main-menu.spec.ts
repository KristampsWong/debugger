import { test, expect, type Page } from '@playwright/test';

async function clearGameSave(page: Page) {
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearGameSave(page);
  await page.reload();
});

test('displays game title and subtitle', async ({ page }) => {
  await expect(page.locator('h1')).toHaveText('Debugger');
  await expect(page.locator('.subtitle')).toHaveText('Fix bugs. Get paid. Buy better tools.');
});

test('shows New Game and Continue buttons', async ({ page }) => {
  await expect(page.locator('text=New Game')).toBeVisible();
  await expect(page.locator('text=Continue')).toBeVisible();
});

test('Continue button is disabled when no save exists', async ({ page }) => {
  const continueBtn = page.locator('.menu-btn', { hasText: 'Continue' });
  await expect(continueBtn).toHaveClass(/disabled/);
});

test('New Game navigates to board', async ({ page }) => {
  await page.click('text=New Game');
  await expect(page).toHaveURL(/\/board/);
});

test('New Game resets game state', async ({ page }) => {
  // Seed a save with money
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 500, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();

  // Click New Game
  await page.click('text=New Game');

  // Money should be reset to 0
  await expect(page.locator('.money')).toHaveText('$0');
});

test('Continue button enabled when save exists', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 100, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();

  const continueBtn = page.locator('.menu-btn', { hasText: 'Continue' });
  await expect(continueBtn).not.toHaveClass(/disabled/);
});

test('Continue preserves game state', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 250, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();

  await page.click('text=Continue');
  await expect(page).toHaveURL(/\/board/);
  await expect(page.locator('.money')).toHaveText('$250');
});
