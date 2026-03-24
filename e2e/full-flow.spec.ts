import { test, expect, type Page } from '@playwright/test';

const LEVEL_01_SOLUTION = `.bakery {
  font-family: Georgia, serif;
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  background-color: rgb(255, 248, 240);
}

.title {
  color: rgb(139, 90, 43);
  text-align: center;
  margin-bottom: 16px;
}

.menu {
  list-style: none;
  padding: 0;
}

.menu-item {
  padding: 8px 0;
  color: rgb(51, 51, 51);
  border-bottom: 1px solid rgb(221, 204, 187);
}

.footer {
  text-align: center;
  color: rgb(153, 119, 85);
  margin-top: 16px;
  font-size: 14px;
}`;

async function seedSave(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('debugger-game-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
});

test('full flow: new game → complete level 1 → earn money → buy tool → use tool', async ({ page }) => {
  // Start new game
  await page.click('text=New Game');
  await expect(page).toHaveURL(/\/board/);
  await expect(page.locator('.money')).toHaveText('$0');

  // Level 1 should be unlocked, level 2 locked
  await expect(page.locator('.level-card').first()).not.toHaveClass(/locked/);
  await expect(page.locator('.level-card').nth(1)).toHaveClass(/locked/);

  // Enter level 1 with pre-loaded solution
  await seedSave(page, {
    money: 0,
    completedLevels: [],
    ownedTools: [],
    inProgressCSS: { 'level-01': LEVEL_01_SOLUTION },
    bestTimes: {},
  });
  await page.goto('/mission/level-01');
  await page.waitForTimeout(1500);

  // All tests should pass
  await expect(page.locator('.test-item.passed')).toHaveCount(2);

  // Submit
  await page.locator('.submit-btn').click();
  await expect(page.locator('.modal h2')).toHaveText('Level Complete!');
  await expect(page.locator('.payout')).toHaveText('+$100');

  // Go back to board
  await page.locator('.modal-btn', { hasText: 'Back to Board' }).click();
  await expect(page).toHaveURL(/\/board/);
  await expect(page.locator('.money')).toHaveText('$100');

  // Level 1 completed, level 2 now unlocked
  await expect(page.locator('.level-card').first()).toHaveClass(/completed/);
  await expect(page.locator('.level-card').nth(1)).not.toHaveClass(/locked/);

  // Go to shop and buy Syntax Highlighter+ ($50)
  await page.locator('.shop-link').click();
  await expect(page).toHaveURL(/\/shop/);
  await page.locator('.shop-card').first().locator('.buy-btn').click();
  await expect(page.locator('.money')).toHaveText('$50');
  await expect(page.locator('.shop-card').first().locator('.owned-label')).toBeVisible();

  // Go back to board
  await page.locator('.back-link').click();
  await expect(page).toHaveURL(/\/board/);
});

test('state persists across page reload', async ({ page }) => {
  // Set up game state
  await seedSave(page, {
    money: 250,
    completedLevels: ['level-01', 'level-02'],
    ownedTools: ['syntax-highlighter'],
    inProgressCSS: {},
    bestTimes: { 'level-01': 15, 'level-02': 30 },
  });

  // Navigate to board and verify
  await page.goto('/board');
  await expect(page.locator('.money')).toHaveText('$250');
  await expect(page.locator('.level-card').first()).toHaveClass(/completed/);
  await expect(page.locator('.level-card').nth(1)).toHaveClass(/completed/);

  // Reload page - state should persist
  await page.reload();
  await expect(page.locator('.money')).toHaveText('$250');
  await expect(page.locator('.level-card').first()).toHaveClass(/completed/);

  // Check shop reflects owned tool
  await page.locator('.shop-link').click();
  await expect(page.locator('.shop-card').first().locator('.owned-label')).toBeVisible();
});

test('new game clears all saved progress', async ({ page }) => {
  // Set up existing progress
  await seedSave(page, {
    money: 500,
    completedLevels: ['level-01', 'level-02', 'level-03'],
    ownedTools: ['syntax-highlighter', 'bug-detector'],
    inProgressCSS: { 'level-04': '.some { css: rule; }' },
    bestTimes: { 'level-01': 10 },
  });

  // Go to main menu and click New Game
  await page.goto('/');
  const continueBtn = page.locator('.menu-btn', { hasText: 'Continue' });
  await expect(continueBtn).not.toHaveClass(/disabled/);

  await page.click('text=New Game');
  await expect(page.locator('.money')).toHaveText('$0');

  // All levels except level 1 should be locked
  await expect(page.locator('.level-card').first()).not.toHaveClass(/locked/);
  await expect(page.locator('.level-card').first()).not.toHaveClass(/completed/);
  await expect(page.locator('.level-card').nth(1)).toHaveClass(/locked/);
  await expect(page.locator('.level-card').nth(2)).toHaveClass(/locked/);

  // Shop should have no owned tools
  await page.locator('.shop-link').click();
  await expect(page.locator('.owned-label')).toHaveCount(0);
});
