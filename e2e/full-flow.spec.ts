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
  await page.click('text=New Game');
  await expect(page).toHaveURL(/#\/board/);
  await expect(page.getByTestId('money')).toHaveText('$0');

  await expect(page.getByTestId('level-card').first()).not.toHaveClass(/opacity-50/);
  await expect(page.getByTestId('level-card').nth(1)).toHaveClass(/opacity-50/);

  await seedSave(page, {
    money: 0,
    completedLevels: [],
    ownedTools: [],
    inProgressCSS: { 'level-01': LEVEL_01_SOLUTION },
    bestTimes: {},
  });
  await page.goto('/#/mission/level-01');
  await page.waitForTimeout(1500);

  await expect(page.locator('[data-testid="test-item"][data-status="passed"]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Level Complete!')).toBeVisible();
  await expect(page.getByTestId('payout')).toHaveText('+$100');

  await page.getByRole('link', { name: 'Back to Board' }).click();
  await expect(page).toHaveURL(/#\/board/);
  await expect(page.getByTestId('money')).toHaveText('$100');

  await expect(page.getByTestId('level-card').first()).toHaveClass(/border-green-500/);
  await expect(page.getByTestId('level-card').nth(1)).not.toHaveClass(/opacity-50/);

  await page.getByRole('link', { name: 'Shop' }).click();
  await expect(page).toHaveURL(/#\/shop/);
  await page.getByTestId('shop-card').first().getByRole('button', { name: 'Buy' }).click();
  await expect(page.getByTestId('money')).toHaveText('$50');
  await expect(page.getByTestId('shop-card').first().getByTestId('owned-label')).toBeVisible();

  await page.getByRole('link', { name: 'Back to Board' }).click();
  await expect(page).toHaveURL(/#\/board/);
});

test('state persists across page reload', async ({ page }) => {
  await seedSave(page, {
    money: 250,
    completedLevels: ['level-01', 'level-02'],
    ownedTools: ['syntax-highlighter'],
    inProgressCSS: {},
    bestTimes: { 'level-01': 15, 'level-02': 30 },
  });

  await page.goto('/#/board');
  await expect(page.getByTestId('money')).toHaveText('$250');
  await expect(page.getByTestId('level-card').first()).toHaveClass(/border-green-500/);
  await expect(page.getByTestId('level-card').nth(1)).toHaveClass(/border-green-500/);

  await page.reload();
  await expect(page.getByTestId('money')).toHaveText('$250');
  await expect(page.getByTestId('level-card').first()).toHaveClass(/border-green-500/);

  await page.getByRole('link', { name: 'Shop' }).click();
  await expect(page.getByTestId('shop-card').first().getByTestId('owned-label')).toBeVisible();
});

test('new game clears all saved progress', async ({ page }) => {
  await seedSave(page, {
    money: 500,
    completedLevels: ['level-01', 'level-02', 'level-03'],
    ownedTools: ['syntax-highlighter', 'bug-detector'],
    inProgressCSS: { 'level-04': '.some { css: rule; }' },
    bestTimes: { 'level-01': 10 },
  });

  await page.goto('/');
  const continueBtn = page.getByRole('link', { name: 'Continue' });
  await expect(continueBtn).not.toHaveAttribute('aria-disabled', 'true');

  await page.click('text=New Game');
  await expect(page.getByTestId('money')).toHaveText('$0');

  await expect(page.getByTestId('level-card').first()).not.toHaveClass(/opacity-50/);
  await expect(page.getByTestId('level-card').first()).not.toHaveClass(/border-green-500/);
  await expect(page.getByTestId('level-card').nth(1)).toHaveClass(/opacity-50/);
  await expect(page.getByTestId('level-card').nth(2)).toHaveClass(/opacity-50/);

  await page.getByRole('link', { name: 'Shop' }).click();
  await expect(page.getByTestId('owned-label')).toHaveCount(0);
});
