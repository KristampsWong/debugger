import { test, expect, type Page } from '@playwright/test';

async function seedSave(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('debugger-game-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
});

test.describe('Shop - Display', () => {
  test('shows all 6 shop items', async ({ page }) => {
    await page.goto('/#/shop');
    await expect(page.getByTestId('shop-card')).toHaveCount(6);
  });

  test('displays correct item names', async ({ page }) => {
    await page.goto('/#/shop');
    const names = ['Syntax Highlighter+', 'Bug Detector', 'Property Hint', 'Solution Peek', 'Client Call', 'Solution Preview'];
    for (const name of names) {
      await expect(page.getByTestId('shop-card').filter({ hasText: name }).locator('h3')).toBeVisible();
    }
  });

  test('displays correct prices', async ({ page }) => {
    await page.goto('/#/shop');
    const prices = ['$50', '$150', '$150', '$100', '$50', '$100'];
    const priceElements = page.getByTestId('item-price');
    for (let i = 0; i < prices.length; i++) {
      await expect(priceElements.nth(i)).toContainText(prices[i]);
    }
  });

  test('consumable item shows "each" label', async ({ page }) => {
    await page.goto('/#/shop');
    const solutionPeek = page.getByTestId('shop-card').nth(3);
    await expect(solutionPeek.getByTestId('item-price')).toContainText('each');
  });

  test('displays money balance', async ({ page }) => {
    await seedSave(page, {
      money: 300, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');
    await expect(page.getByTestId('money')).toHaveText('$300');
  });

  test('Back to Board link works', async ({ page }) => {
    await page.goto('/#/shop');
    await page.getByRole('link', { name: 'Back to Board' }).click();
    await expect(page).toHaveURL(/#\/board/);
  });
});

test.describe('Shop - Purchasing', () => {
  test('buy buttons disabled when insufficient funds', async ({ page }) => {
    await page.goto('/#/shop');
    const buyButtons = page.getByRole('button', { name: 'Buy' });
    const count = await buyButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(buyButtons.nth(i)).toBeDisabled();
    }
  });

  test('buy button enabled when enough money', async ({ page }) => {
    await seedSave(page, {
      money: 50, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');

    const firstBuyBtn = page.getByTestId('shop-card').first().getByRole('button', { name: 'Buy' });
    await expect(firstBuyBtn).toBeEnabled();

    const secondBuyBtn = page.getByTestId('shop-card').nth(1).getByRole('button', { name: 'Buy' });
    await expect(secondBuyBtn).toBeDisabled();
  });

  test('purchasing deducts money and shows Owned label', async ({ page }) => {
    await seedSave(page, {
      money: 200, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');

    await page.getByTestId('shop-card').first().getByRole('button', { name: 'Buy' }).click();

    await expect(page.getByTestId('money')).toHaveText('$150');

    const firstCard = page.getByTestId('shop-card').first();
    await expect(firstCard.getByTestId('owned-label')).toHaveText('Owned');
    await expect(firstCard.getByRole('button', { name: 'Buy' })).toHaveCount(0);
  });

  test('owned card has owned class', async ({ page }) => {
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['syntax-highlighter'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');

    await expect(page.getByTestId('shop-card').first()).toHaveClass(/border-green-500/);
  });

  test('can purchase multiple items in sequence', async ({ page }) => {
    await seedSave(page, {
      money: 500, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');

    await page.getByTestId('shop-card').first().getByRole('button', { name: 'Buy' }).click();
    await expect(page.getByTestId('money')).toHaveText('$450');

    await page.getByTestId('shop-card').nth(4).getByRole('button', { name: 'Buy' }).click();
    await expect(page.getByTestId('money')).toHaveText('$400');

    await page.getByTestId('shop-card').nth(1).getByRole('button', { name: 'Buy' }).click();
    await expect(page.getByTestId('money')).toHaveText('$250');
  });

  test('consumable item always shows buy button even if owned', async ({ page }) => {
    await seedSave(page, {
      money: 200, completedLevels: [], ownedTools: ['solution-peek'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/shop');

    const solutionCard = page.getByTestId('shop-card').nth(3);
    await expect(solutionCard.getByRole('button', { name: 'Buy' })).toBeVisible();
    await expect(solutionCard.getByTestId('owned-label')).toHaveCount(0);
  });
});
