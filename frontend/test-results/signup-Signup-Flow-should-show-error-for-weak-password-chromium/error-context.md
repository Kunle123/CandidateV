# Test info

- Name: Signup Flow >> should show error for weak password
- Location: /Users/admin/Documents/KunleDevFolder/CandidateV/frontend/e2e/signup.spec.ts:49:3

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#auth-terms')
    - locator resolved to <input value="" type="checkbox" id="auth-terms" name="acceptTerms" aria-invalid="false" aria-checked="false" aria-disabled="false" class="chakra-checkbox__input"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span aria-hidden="true" class="chakra-checkbox__control css-1dnp747"></span> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span aria-hidden="true" class="chakra-checkbox__control css-1dnp747"></span> intercepts pointer events
    - retrying click action
      - waiting 100ms
    51 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span aria-hidden="true" class="chakra-checkbox__control css-1dnp747"></span> intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling

    at /Users/admin/Documents/KunleDevFolder/CandidateV/frontend/e2e/signup.spec.ts:57:51
```

# Page snapshot

```yaml
- link "CandidateV":
  - /url: /
  - paragraph: CandidateV
- paragraph: Build Your Professional CV
- paragraph: Create, optimize and manage professional CVs with AI assistance.
- heading "Create your account" [level=2]
- paragraph: to start building your professional CV
- group:
  - text: Name
  - textbox "Name": Test User
- group:
  - text: Email
  - textbox "Email": testuser1745348346817@example.com
- group:
  - text: Password
  - textbox "Password": weak
  - button "Show password"
- group:
  - text: Confirm Password
  - textbox "Confirm Password": weak
  - button "Show password"
- group:
  - checkbox "I accept the terms and conditions"
  - text: I accept the terms and conditions
- button "Sign Up"
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
- region "Notifications Alt+T"
- region "Notifications-top"
- region "Notifications-top-left"
- region "Notifications-top-right"
- region "Notifications-bottom-left"
- region "Notifications-bottom"
- region "Notifications-bottom-right"
- region "Notifications-top"
- region "Notifications-top-left"
- region "Notifications-top-right"
- region "Notifications-bottom-left"
- region "Notifications-bottom"
- region "Notifications-bottom-right"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { FORM_IDS, VALIDATION_MESSAGES } from '../src/constants/formConstants';
   3 |
   4 | const TIMEOUT = 10000;
   5 |
   6 | test.describe('Signup Flow', () => {
   7 |   test.beforeEach(async ({ page }) => {
   8 |     await page.goto('/register');
   9 |   });
   10 |
   11 |   test('should create account successfully', async ({ page }) => {
   12 |     const timestamp = Date.now();
   13 |     const email = `testuser${timestamp}@example.com`;
   14 |     
   15 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
   16 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
   17 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
   18 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
   19 |     await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
   20 |     
   21 |     await Promise.all([
   22 |       page.waitForResponse(response => response.url().includes('/auth/v1/signup') && response.status() === 200),
   23 |       page.getByRole('button', { name: /sign up/i }).click()
   24 |     ]);
   25 |
   26 |     await expect(page.locator('.Toastify__toast--success')).toBeVisible({ timeout: TIMEOUT });
   27 |     await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: TIMEOUT });
   28 |   });
   29 |
   30 |   test('should show error for invalid email', async ({ page }) => {
   31 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
   32 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill('invalid.email');
   33 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
   34 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
   35 |     await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
   36 |     
   37 |     // Try to submit the form
   38 |     await page.getByRole('button', { name: /sign up/i }).click();
   39 |
   40 |     // Check for the error message under the email field
   41 |     const emailFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.EMAIL}`) });
   42 |     await expect(emailFormControl).toHaveAttribute('aria-invalid', 'true');
   43 |     
   44 |     const emailError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.EMAIL.INVALID });
   45 |     await expect(emailError).toBeVisible({ timeout: TIMEOUT });
   46 |     await expect(emailError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
   47 |   });
   48 |
   49 |   test('should show error for weak password', async ({ page }) => {
   50 |     const timestamp = Date.now();
   51 |     const email = `testuser${timestamp}@example.com`;
   52 |
   53 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
   54 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
   55 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('weak');
   56 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('weak');
>  57 |     await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
      |                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
   58 |     await page.getByRole('button', { name: /sign up/i }).click();
   59 |
   60 |     // Check for the error message under the password field
   61 |     const passwordFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.PASSWORD}`) });
   62 |     await expect(passwordFormControl).toHaveAttribute('aria-invalid', 'true');
   63 |
   64 |     const passwordError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH });
   65 |     await expect(passwordError).toBeVisible({ timeout: TIMEOUT });
   66 |     await expect(passwordError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
   67 |   });
   68 |
   69 |   test('should show error for mismatched passwords', async ({ page }) => {
   70 |     const timestamp = Date.now();
   71 |     const email = `testuser${timestamp}@example.com`;
   72 |
   73 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
   74 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
   75 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
   76 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('DifferentPassword123!');
   77 |     await page.locator(`#${FORM_IDS.AUTH.TERMS}`).click();
   78 |     
   79 |     await page.getByRole('button', { name: /sign up/i }).click();
   80 |
   81 |     // Check for the error message under the confirm password field
   82 |     const confirmPasswordFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`) });
   83 |     await expect(confirmPasswordFormControl).toHaveAttribute('aria-invalid', 'true');
   84 |
   85 |     const confirmPasswordError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.PASSWORD.MISMATCH });
   86 |     await expect(confirmPasswordError).toBeVisible({ timeout: TIMEOUT });
   87 |     await expect(confirmPasswordError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
   88 |   });
   89 |
   90 |   test('should show error for terms not accepted', async ({ page }) => {
   91 |     const timestamp = Date.now();
   92 |     const email = `testuser${timestamp}@example.com`;
   93 |
   94 |     // Fill in all fields except terms and conditions
   95 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
   96 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
   97 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
   98 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
   99 |     
  100 |     // Click sign up without accepting terms
  101 |     await page.getByRole('button', { name: /sign up/i }).click();
  102 |
  103 |     // Check for the error message under the terms checkbox
  104 |     const termsFormControl = page.locator('form').getByRole('group').filter({ has: page.locator(`#${FORM_IDS.AUTH.TERMS}`) });
  105 |     await expect(termsFormControl).toHaveAttribute('aria-invalid', 'true');
  106 |
  107 |     const termsError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.TERMS });
  108 |     await expect(termsError).toBeVisible({ timeout: TIMEOUT });
  109 |     await expect(termsError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  110 |   });
  111 |
  112 |   test('should show error for required fields', async ({ page }) => {
  113 |     await page.getByRole('button', { name: /sign up/i }).click();
  114 |
  115 |     // Check for required field errors
  116 |     const formControls = page.locator('form').getByRole('group');
  117 |     await expect(formControls.first()).toHaveAttribute('aria-invalid', 'true');
  118 |
  119 |     const requiredError = page.locator('.chakra-form__error-message').filter({ hasText: VALIDATION_MESSAGES.REQUIRED }).first();
  120 |     await expect(requiredError).toBeVisible({ timeout: TIMEOUT });
  121 |     await expect(requiredError).toHaveCSS('color', 'rgb(229, 62, 62)'); // Chakra UI's red.500
  122 |   });
  123 | }); 
```