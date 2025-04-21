import { test, expect } from '@playwright/test';
import { FORM_IDS } from '../src/constants/formConstants';

const TIMEOUT = 10000;

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should create account successfully', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;
    
    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
    await page.getByText('I accept the terms and conditions').click();
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/v1/signup') && response.status() === 200),
      page.getByRole('button', { name: /sign up/i }).click()
    ]);

    await expect(page.getByRole('alert')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for invalid email', async ({ page }) => {
    const timestamp = Date.now();
    
    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill('invalid.email');
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
    await page.getByText('I accept the terms and conditions').click();
    
    // Submit form and wait for validation
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/v1/signup')),
      page.getByRole('button', { name: /sign up/i }).click()
    ]);

    await expect(page.getByText(/please enter a valid email address/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for weak password', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('weak');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('weak');
    await page.getByText('I accept the terms and conditions').click();
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('DifferentPassword123!');
    await page.getByText('I accept the terms and conditions').click();
    
    // Submit form and wait for validation
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/v1/signup')),
      page.getByRole('button', { name: /sign up/i }).click()
    ]);

    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for terms not accepted', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/you must accept the terms and conditions/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for required fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(/this field is required/i)).toBeVisible({ timeout: TIMEOUT });
  });
}); 