import { test, expect, type Page } from '@playwright/test';

async function seedSave(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('debugger-game-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
  await page.reload();
  await page.click('text=New Game');
});

test('displays all 8 level cards', async ({ page }) => {
  await expect(page.getByTestId('level-card')).toHaveCount(8);
});

test('shows header with money, shop link, and menu link', async ({ page }) => {
  await expect(page.getByTestId('money')).toHaveText('$0');
  await expect(page.getByRole('link', { name: 'Shop' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Menu' })).toBeVisible();
});

test('level 1 is unlocked initially', async ({ page }) => {
  const firstCard = page.getByTestId('level-card').first();
  await expect(firstCard).not.toHaveClass(/opacity-50/);
  await expect(firstCard.getByRole('link')).toHaveText('Accept Contract');
});

test('level 2 is locked initially', async ({ page }) => {
  const secondCard = page.getByTestId('level-card').nth(1);
  await expect(secondCard).toHaveClass(/opacity-50/);
  await expect(secondCard.getByTestId('locked-label')).toHaveText('Locked');
});

test('level cards show title, client name, brief, difficulty, and payout', async ({ page }) => {
  const firstCard = page.getByTestId('level-card').first();
  await expect(firstCard.locator('h3')).toHaveText('Fix the Menu Colors');
  await expect(firstCard.getByTestId('client-name')).toHaveText("Bob's Bakery");
  await expect(firstCard.getByTestId('brief')).toBeVisible();
  await expect(firstCard.getByTestId('difficulty')).toHaveText('★');
  await expect(firstCard.getByTestId('payout')).toHaveText('$100');
});

test('level 2 unlocks after completing level 1', async ({ page }) => {
  await seedSave(page, {
    money: 100, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  const secondCard = page.getByTestId('level-card').nth(1);
  await expect(secondCard).not.toHaveClass(/opacity-50/);
  await expect(secondCard.getByRole('link')).toHaveText('Accept Contract');
});

test('completed level shows Replay button and completed class', async ({ page }) => {
  await seedSave(page, {
    money: 100, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  const firstCard = page.getByTestId('level-card').first();
  await expect(firstCard).toHaveClass(/border-green-500/);
  await expect(firstCard.getByRole('link')).toHaveText('Replay');
});

test('money displays correctly after earning', async ({ page }) => {
  await seedSave(page, {
    money: 350, completedLevels: ['level-01', 'level-02'], ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  await expect(page.getByTestId('money')).toHaveText('$350');
});

test('levels 7 and 8 require both level 5 and level 6', async ({ page }) => {
  await seedSave(page, {
    money: 1000,
    completedLevels: ['level-01', 'level-02', 'level-03', 'level-05'],
    ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  const card7 = page.getByTestId('level-card').nth(6);
  const card8 = page.getByTestId('level-card').nth(7);
  await expect(card7).toHaveClass(/opacity-50/);
  await expect(card8).toHaveClass(/opacity-50/);
});

test('levels 7 and 8 unlock when both 5 and 6 are completed', async ({ page }) => {
  await seedSave(page, {
    money: 1000,
    completedLevels: ['level-01', 'level-02', 'level-03', 'level-05', 'level-06'],
    ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  const card7 = page.getByTestId('level-card').nth(6);
  const card8 = page.getByTestId('level-card').nth(7);
  await expect(card7).not.toHaveClass(/opacity-50/);
  await expect(card8).not.toHaveClass(/opacity-50/);
});

test('Shop link navigates to shop', async ({ page }) => {
  await page.getByRole('link', { name: 'Shop' }).click();
  await expect(page).toHaveURL(/#\/shop/);
});

test('Menu link navigates back to main menu', async ({ page }) => {
  await page.getByRole('link', { name: 'Menu' }).click();
  await expect(page).toHaveURL(/#\//);
});

test('level cards 3 and 4 both require level 2', async ({ page }) => {
  await seedSave(page, {
    money: 100, completedLevels: ['level-01'], ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  await expect(page.getByTestId('level-card').nth(2)).toHaveClass(/opacity-50/);
  await expect(page.getByTestId('level-card').nth(3)).toHaveClass(/opacity-50/);

  await seedSave(page, {
    money: 250, completedLevels: ['level-01', 'level-02'], ownedTools: [], inProgressCSS: {}, bestTimes: {},
  });
  await page.goto('/#/board');

  await expect(page.getByTestId('level-card').nth(2)).not.toHaveClass(/opacity-50/);
  await expect(page.getByTestId('level-card').nth(3)).not.toHaveClass(/opacity-50/);
});
