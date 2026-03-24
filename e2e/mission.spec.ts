import { test, expect, type Page } from '@playwright/test';

async function seedSave(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    localStorage.setItem('debugger-game-save', JSON.stringify({ state: s, version: 0 }));
  }, state);
}

async function resetAndGoToLevel1(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
  await page.goto('/#/mission/level-01');
}

test.describe('Mission - Loading', () => {
  test('redirects to board for nonexistent level', async ({ page }) => {
    await page.goto('/#/mission/level-99');
    await expect(page).toHaveURL(/#\/board/);
  });

  test('redirects to board when prerequisites not met', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('debugger-game-save'));
    await page.goto('/#/mission/level-02');
    await expect(page).toHaveURL(/#\/board/);
  });

  test('loads level 1 successfully', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('mission-screen')).toBeVisible();
    await expect(page.getByText("Bob's Bakery")).toBeVisible();
  });

  test('shows client brief', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('client-brief')).toContainText('text colors are all wrong');
  });

  test('timer starts at 0:00', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('timer')).toHaveText('0:00');
  });

  test('submit button is disabled initially', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});

test.describe('Mission - Test Panel', () => {
  test('shows test descriptions', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('test-item')).toHaveCount(2);
    await expect(page.getByTestId('test-description').first()).toContainText('Title text should be visible');
    await expect(page.getByTestId('test-description').nth(1)).toContainText('Menu items should be readable');
  });

  test('tests show failed status with buggy CSS', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid="test-item"][data-status="failed"]')).toHaveCount(2);
  });

  test('property hints hidden without tool', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('test-hints')).toHaveCount(0);
  });

  test('property hints visible with property-hint tool', async ({ page }) => {
    await page.goto('/');
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['property-hint'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/mission/level-01');

    await expect(page.getByTestId('test-hints').first()).toBeVisible();
    await expect(page.getByTestId('test-hints').first()).toContainText('color');
  });
});

test.describe('Mission - Client Brief & Tools', () => {
  test('hint is hidden without client-call tool', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('hint-text')).toHaveCount(0);
  });

  test('hint is visible with client-call tool', async ({ page }) => {
    await page.goto('/');
    await seedSave(page, {
      money: 0, completedLevels: [], ownedTools: ['client-call'], inProgressCSS: {}, bestTimes: {},
    });
    await page.goto('/#/mission/level-01');

    await expect(page.getByTestId('hint-text')).toBeVisible();
    await expect(page.getByTestId('hint-text')).toContainText('heading and the menu items');
  });
});

test.describe('Mission - Timer', () => {
  test('timer increments over time', async ({ page }) => {
    await resetAndGoToLevel1(page);
    await expect(page.getByTestId('timer')).toHaveText('0:00');
    await page.waitForTimeout(2500);
    const timerText = await page.getByTestId('timer').textContent();
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(1500);

    await expect(page.locator('[data-testid="test-item"][data-status="passed"]')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByTestId('level-complete-modal')).toBeVisible();
    await expect(page.getByText('Level Complete!')).toBeVisible();
    await expect(page.getByTestId('payout')).toHaveText('+$100');
    await expect(page.getByText("Bob's Bakery:")).toBeVisible();
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.getByRole('link', { name: 'Back to Board' }).click();
    await expect(page.getByTestId('money')).toHaveText('$100');
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByTestId('already-completed')).toHaveText('Already completed');
    await expect(page.getByTestId('payout')).toHaveCount(0);
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Submit' }).click();

    await page.getByRole('button', { name: 'Replay' }).click();

    await expect(page.getByTestId('level-complete-modal')).toHaveCount(0);
    await expect(page.getByTestId('timer')).toHaveText('0:00');
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

    await page.goto('/#/mission/level-01');
    await page.waitForTimeout(500);

    const savedState = await page.evaluate(() => {
      const raw = localStorage.getItem('debugger-game-save');
      return raw ? JSON.parse(raw) : null;
    });
    expect(savedState.state.inProgressCSS['level-01']).toBe(customCSS);
  });
});
