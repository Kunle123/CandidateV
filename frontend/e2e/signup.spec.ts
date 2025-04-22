import { test, expect } from '@playwright/test';
import { FORM_IDS, VALIDATION_MESSAGES } from '../src/constants/formConstants';

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
    await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
    
    await Promise.all([
      page.waitForResponse(response => response.url().includes('/auth/v1/signup') && response.status() === 200),
      page.getByRole('button', { name: /sign up/i }).click()
    ]);

    await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: TIMEOUT });
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: TIMEOUT });
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill('invalid.email');
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
    
    // Try to submit the form
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for the error message under the email field
    const emailFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.EMAIL}`) });
    await expect(emailFormControl).toHaveAttribute('aria-invalid', 'true');
    
    const emailError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.EMAIL.INVALID });
    await expect(emailError).toBeVisible({ timeout: TIMEOUT });
    await expect(emailError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  });

  test('should show error for weak password', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('weak');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('weak');
    await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for the error message under the password field
    const passwordFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.PASSWORD}`) });
    await expect(passwordFormControl).toHaveAttribute('aria-invalid', 'true');

    const passwordError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH });
    await expect(passwordError).toBeVisible({ timeout: TIMEOUT });
    await expect(passwordError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('DifferentPassword123!');
    await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
    
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for the error message under the confirm password field
    const confirmPasswordFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`) });
    await expect(confirmPasswordFormControl).toHaveAttribute('aria-invalid', 'true');

    const confirmPasswordError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.PASSWORD.MISMATCH });
    await expect(confirmPasswordError).toBeVisible({ timeout: TIMEOUT });
    await expect(confirmPasswordError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  });

  test('should show error for terms not accepted', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@example.com`;

    // Fill in all fields except terms and conditions
    await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
    await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
    await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
    await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
    
    // Click sign up without accepting terms
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for the error message under the terms checkbox
    const termsFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.TERMS}`) });
    await expect(termsFormControl).toHaveAttribute('aria-invalid', 'true');

    const termsError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.TERMS });
    await expect(termsError).toBeVisible({ timeout: TIMEOUT });
    await expect(termsError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  });

  test('should show error for required fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign up/i }).click();

    // Check for required field errors
    const formControls = page.locator('form').getByRole('group');
    await expect(formControls.first()).toHaveAttribute('aria-invalid', 'true');

    const requiredError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.REQUIRED }).first();
    await expect(requiredError).toBeVisible({ timeout: TIMEOUT });
    await expect(requiredError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  });
}); 