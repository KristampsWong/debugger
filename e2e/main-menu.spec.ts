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
  await expect(page.getByText('Fix bugs. Get paid. Buy better tools.')).toBeVisible();
});

test('shows New Game and Continue buttons', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'New Game' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue' })).toBeVisible();
});

test('Continue button is disabled when no save exists', async ({ page }) => {
  const continueBtn = page.getByRole('link', { name: 'Continue' });
  await expect(continueBtn).toHaveAttribute('aria-disabled', 'true');
});

test('New Game navigates to board', async ({ page }) => {
  await page.getByRole('link', { name: 'New Game' }).click();
  await expect(page).toHaveURL(/#\/board/);
});

test('New Game resets game state', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 500, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();
  await page.getByRole('link', { name: 'New Game' }).click();
  await expect(page.getByTestId('money')).toHaveText('$0');
});

test('Continue button enabled when save exists', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 100, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();
  const continueBtn = page.getByRole('link', { name: 'Continue' });
  await expect(continueBtn).not.toHaveAttribute('aria-disabled', 'true');
});

test('Continue preserves game state', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('debugger-game-save', JSON.stringify({
      state: { money: 250, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {} },
      version: 0,
    }));
  });
  await page.reload();
  await page.getByRole('link', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/#\/board/);
  await expect(page.getByTestId('money')).toHaveText('$250');
});
