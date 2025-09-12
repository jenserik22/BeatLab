const { test, expect } = require('@playwright/test');

test.describe('BeatLab E2E Tests', () => {
  test('should load the app, start the audio, and check for visualizer logs', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Start the audio context
    await page.click('button:has-text("Click to Start")');

    // Wait for the main app to be visible
    await expect(page.locator('.app-container')).toBeVisible();

    // Check if the pattern controls are visible
    await expect(page.locator('.pattern-controls')).toBeVisible();

    // Play a beat
    await page.click('button:has-text("Play")');

    // Listen for console logs
    let visualizerLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Visualizer dataArray:')) {
        console.log(msg.text());
        visualizerLogs.push(msg.text());
      }
    });

    // Wait for a few seconds to see if the visualizer logs anything
    await page.waitForTimeout(3000);

    // Take a screenshot
    await page.screenshot({ path: 'tests/visualizer_test.png' });

    // Assert that we have received some visualizer logs
    expect(visualizerLogs.length).toBeGreaterThan(0);
  });
});
