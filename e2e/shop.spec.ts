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
  test('shows all 5 shop items', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('.shop-card')).toHaveCount(5);
  });

  test('displays correct item names', async ({ page }) => {
    await page.goto('/shop');
    const names = ['Syntax Highlighter+', 'Bug Detector', 'Property Hint', 'Solution Peek', 'Client Call'];
    for (const name of names) {
      await expect(page.locator('.shop-card h3', { hasText: name })).toBeVisible();
    }
  });

  test('displays correct prices', async ({ page }) => {
    await page.goto('/shop');
    const prices = ['$50', '$150', '$150', '$100', '$50'];
    const priceElements = page.locator('.item-price');
    for (let i = 0; i < prices.length; i++) {
      await expect(priceElements.nth(i)).toContainText(prices[i]);
    }
  });

  test('consumable item shows "each" label', async ({ page }) => {
    await page.goto('/shop');
    // Solution Peek is consumable (4th item)
    const solutionPeek = page.locator('.shop-card').nth(3);
    await expect(solutionPeek.locator('.item-price')).toContainText('each');
  });

  test('displays money balance', async ({ page }) => {
    await seedSave(page, {
      money: 300, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');
    await expect(page.locator('.money')).toHaveText('$300');
  });

  test('Back to Board link works', async ({ page }) => {
    await page.goto('/shop');
    await page.locator('.back-link').click();
    await expect(page).toHaveURL(/\/board/);
  });
});

test.describe('Shop - Purchasing', () => {
  test('buy buttons disabled when insufficient funds', async ({ page }) => {
    await page.goto('/shop');
    // $0 money, all buttons should be disabled
    const buyButtons = page.locator('.buy-btn');
    const count = await buyButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(buyButtons.nth(i)).toBeDisabled();
    }
  });

  test('buy button enabled when enough money', async ({ page }) => {
    await seedSave(page, {
      money: 50, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');

    // Syntax Highlighter+ costs $50 - should be enabled
    const firstBuyBtn = page.locator('.shop-card').first().locator('.buy-btn');
    await expect(firstBuyBtn).toBeEnabled();

    // Bug Detector costs $150 - should be disabled
    const secondBuyBtn = page.locator('.shop-card').nth(1).locator('.buy-btn');
    await expect(secondBuyBtn).toBeDisabled();
  });

  test('purchasing deducts money and shows Owned label', async ({ page }) => {
    await seedSave(page, {
      money: 200, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');

    // Buy Syntax Highlighter+ ($50)
    await page.locator('.shop-card').first().locator('.buy-btn').click();

    // Money should decrease
    await expect(page.locator('.money')).toHaveText('$150');

    // Should show Owned label instead of Buy button
    const firstCard = page.locator('.shop-card').first();
    await expect(firstCard.locator('.owned-label')).toHaveText('Owned');
    await expect(firstCard.locator('.buy-btn')).toHaveCount(0);
  });

  test('owned card has owned class', async ({ page }) => {
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['syntax-highlighter'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');

    await expect(page.locator('.shop-card').first()).toHaveClass(/owned/);
  });

  test('can purchase multiple items in sequence', async ({ page }) => {
    await seedSave(page, {
      money: 500, completedLevels: [], ownedTools: [], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');

    // Buy Syntax Highlighter+ ($50) → $450
    await page.locator('.shop-card').first().locator('.buy-btn').click();
    await expect(page.locator('.money')).toHaveText('$450');

    // Buy Client Call ($50) → $400
    await page.locator('.shop-card').nth(4).locator('.buy-btn').click();
    await expect(page.locator('.money')).toHaveText('$400');

    // Buy Bug Detector ($150) → $250
    await page.locator('.shop-card').nth(1).locator('.buy-btn').click();
    await expect(page.locator('.money')).toHaveText('$250');
  });

  test('consumable item always shows buy button even if owned', async ({ page }) => {
    await seedSave(page, {
      money: 200, completedLevels: [], ownedTools: ['solution-peek'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/shop');

    // Solution Peek (4th item) is consumable - should still have Buy button
    const solutionCard = page.locator('.shop-card').nth(3);
    await expect(solutionCard.locator('.buy-btn')).toBeVisible();
    await expect(solutionCard.locator('.owned-label')).toHaveCount(0);
  });
});
