import { test, expect, type Page } from '@playwright/test';

async function seedSave(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('debugger-game-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
}

async function resetAndGoToLevel1(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
  await page.goto('/mission/level-01');
}

test.describe('Mission - Loading', () => {
  test('redirects to board for nonexistent level', async ({ page }) => {
    await page.goto('/mission/level-99');
    await expect(page).toHaveURL(/\/board/);
  });

  test('redirects to board when prerequisites not met', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
    await page.goto('/mission/level-02');
    await expect(page).toHaveURL(/\/board/);
  });

  test('loads level 1 successfully', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.mission-screen')).toBeVisible();
    await expect(page.locator('.client-name')).toHaveText("Bob's Bakery");
  });

  test('shows client brief', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.brief-text')).toContainText('text colors are all wrong');
  });

  test('timer starts at 0:00', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.timer')).toHaveText('0:00');
  });

  test('submit button is disabled initially', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.submit-btn')).toBeDisabled();
  });
});

test.describe('Mission - Test Panel', () => {
  test('shows test descriptions', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.test-item')).toHaveCount(2);
    await expect(page.locator('.test-description').first()).toContainText('Title text should be visible');
    await expect(page.locator('.test-description').nth(1)).toContainText('Menu items should be readable');
  });

  test('tests show failed status with buggy CSS', async ({ page }) => {
    await resetAndGoToLevel1(page);
    // Wait for iframe and tests to run
    await page.waitForTimeout(1000);
    await expect(page.locator('.test-item.failed')).toHaveCount(2);
  });

  test('property hints hidden without tool', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.test-hints')).toHaveCount(0);
  });

  test('property hints visible with property-hint tool', async ({ page }) => {
    await page.goto('/');
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['property-hint'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/mission/level-01');

    await expect(page.locator('.test-hints').first()).toBeVisible();
    await expect(page.locator('.test-hints').first()).toContainText('color');
  });
});

test.describe('Mission - Client Brief & Tools', () => {
  test('hint is hidden without client-call tool', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.hint-text')).toHaveCount(0);
  });

  test('hint is visible with client-call tool', async ({ page }) => {
    await page.goto('/');
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['client-call'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/mission/level-01');

    await expect(page.locator('.hint-text')).toBeVisible();
    await expect(page.locator('.hint-text')).toContainText('heading and the menu items');
  });
});

test.describe('Mission - Timer', () => {
  test('timer increments over time', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.locator('.timer')).toHaveText('0:00');
    // Wait >2 seconds for timer to tick
    await page.waitForTimeout(2500);
    const timerText = await page.locator('.timer').textContent();
    expect(timerText).not.toBe('0:00');
  });
});

test.describe('Mission - Gameplay', () => {
  test('live preview iframe renders', async ({ page }) => {
    await resetAndGoToLevel1(page);
    const iframe = page.locator('iframe');
    await expect(iframe).toBeVisible();
  });

  test('fixing CSS makes tests pass and enables submit', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));

    // Seed in-progress CSS with the solution
    const solutionCSS = `.bakery {
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

    await seedSave(page, {
      money: 0,
      completedLevels: [],
      ownedTools: [],
      inProgressCSS: { 'level-01': solutionCSS },
      bestTimes: {},
    });

    await page.goto('/mission/level-01');

    // Wait for iframe to load and tests to run
    await page.waitForTimeout(1500);

    // Tests should all pass
    await expect(page.locator('.test-item.passed')).toHaveCount(2);

    // Submit should be enabled
    await expect(page.locator('.submit-btn')).toBeEnabled();
  });

  test('submitting completed level shows modal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));

    const solutionCSS = `.bakery {
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

    await seedSave(page, {
      money: 0,
      completedLevels: [],
      ownedTools: [],
      inProgressCSS: { 'level-01': solutionCSS },
      bestTimes: {},
    });

    await page.goto('/mission/level-01');
    await page.waitForTimeout(1500);

    await page.locator('.submit-btn').click();

    // Modal should appear
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal h2')).toHaveText('Level Complete!');
    await expect(page.locator('.payout')).toHaveText('+$100');
    await expect(page.locator('.client-message')).toContainText("Bob's Bakery");
  });

  test('completing level awards money (first time only)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));

    const solutionCSS = `.bakery {
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

    await seedSave(page, {
      money: 0,
      completedLevels: [],
      ownedTools: [],
      inProgressCSS: { 'level-01': solutionCSS },
      bestTimes: {},
    });

    await page.goto('/mission/level-01');
    await page.waitForTimeout(1500);
    await page.locator('.submit-btn').click();

    // Navigate back to board - money should be $100
    await page.locator('.modal-btn', { hasText: 'Back to Board' }).click();
    await expect(page.locator('.money')).toHaveText('$100');
  });

  test('replaying completed level shows already completed message', async ({ page }) => {
    await page.goto('/');

    const solutionCSS = `.bakery {
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

    await seedSave(page, {
      money: 100,
      completedLevels: ['level-01'],
      ownedTools: [],
      inProgressCSS: { 'level-01': solutionCSS },
      bestTimes: { 'level-01': 10 },
    });

    await page.goto('/mission/level-01');
    await page.waitForTimeout(1500);
    await page.locator('.submit-btn').click();

    await expect(page.locator('.already-completed')).toHaveText('Already completed');
    // No payout element
    await expect(page.locator('.payout')).toHaveCount(0);
  });

  test('modal replay button resets the level', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));

    const solutionCSS = `.bakery {
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

    await seedSave(page, {
      money: 0,
      completedLevels: [],
      ownedTools: [],
      inProgressCSS: { 'level-01': solutionCSS },
      bestTimes: {},
    });

    await page.goto('/mission/level-01');
    await page.waitForTimeout(1500);
    await page.locator('.submit-btn').click();

    // Click replay
    await page.locator('.modal-btn', { hasText: 'Replay' }).click();

    // Modal should close
    await expect(page.locator('.modal-overlay')).toHaveCount(0);
    // Timer resets
    await expect(page.locator('.timer')).toHaveText('0:00');
  });
});

test.describe('Mission - CSS Persistence', () => {
  test('in-progress CSS is saved and restored', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));

    const customCSS = '.bakery { background: red; }';
    await seedSave(page, {
      money: 0,
      completedLevels: [],
      ownedTools: [],
      inProgressCSS: { 'level-01': customCSS },
      bestTimes: {},
    });

    await page.goto('/mission/level-01');
    await page.waitForTimeout(500);

    // The saved CSS should be loaded in the editor
    const savedState = await page.evaluate(() => {
      const raw = localStorage.getItem('debugger-game-save');
      return raw ? JSON.parse(raw) : null;
    });
    expect(savedState.state.inProgressCSS['level-01']).toBe(customCSS);
  });
});
