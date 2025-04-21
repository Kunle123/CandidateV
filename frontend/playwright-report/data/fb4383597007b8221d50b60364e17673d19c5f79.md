# Test info

- Name: Signup Flow >> should create account successfully
- Location: /Users/admin/Documents/KunleDevFolder/CandidateV/frontend/e2e/signup.spec.ts:11:3

# Error details

```
Error: Timed out 10000ms waiting for expect(locator).toBeVisible()

Locator: getByRole('alert')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 10000ms
  - waiting for getByRole('alert')

    at /Users/admin/Documents/KunleDevFolder/CandidateV/frontend/e2e/signup.spec.ts:26:43
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
  - textbox "Name"
- group:
  - text: Email
  - textbox "Email"
- group:
  - text: Password
  - textbox "Password"
  - button "Show password"
- group:
  - text: Confirm Password
  - textbox "Confirm Password"
  - button "Show password"
- group:
  - checkbox "I accept the terms and conditions"
  - text: I accept the terms and conditions
- button "Sign Up"
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
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
   2 | import { FORM_IDS } from '../src/constants/formConstants';
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
  19 |     await page.getByText('I accept the terms and conditions').click();
  20 |     
  21 |     await Promise.all([
  22 |       page.waitForResponse(response => response.url().includes('/auth/v1/signup') && response.status() === 200),
  23 |       page.getByRole('button', { name: /sign up/i }).click()
  24 |     ]);
  25 |
> 26 |     await expect(page.getByRole('alert')).toBeVisible({ timeout: TIMEOUT });
     |                                           ^ Error: Timed out 10000ms waiting for expect(locator).toBeVisible()
  27 |     await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: TIMEOUT });
  28 |   });
  29 |
  30 |   test('should show error for invalid email', async ({ page }) => {
  31 |     const timestamp = Date.now();
  32 |     
  33 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
  34 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill('invalid.email');
  35 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
  36 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
  37 |     await page.getByText('I accept the terms and conditions').click();
  38 |     
  39 |     // Submit form and wait for validation
  40 |     await Promise.all([
  41 |       page.waitForResponse(response => response.url().includes('/auth/v1/signup')),
  42 |       page.getByRole('button', { name: /sign up/i }).click()
  43 |     ]);
  44 |
  45 |     await expect(page.getByText(/please enter a valid email address/i)).toBeVisible({ timeout: TIMEOUT });
  46 |   });
  47 |
  48 |   test('should show error for weak password', async ({ page }) => {
  49 |     const timestamp = Date.now();
  50 |     const email = `testuser${timestamp}@example.com`;
  51 |
  52 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
  53 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
  54 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('weak');
  55 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('weak');
  56 |     await page.getByText('I accept the terms and conditions').click();
  57 |     await page.getByRole('button', { name: /sign up/i }).click();
  58 |
  59 |     await expect(page.getByText(/password must be at least 6 characters/i)).toBeVisible({ timeout: TIMEOUT });
  60 |   });
  61 |
  62 |   test('should show error for mismatched passwords', async ({ page }) => {
  63 |     const timestamp = Date.now();
  64 |     const email = `testuser${timestamp}@example.com`;
  65 |
  66 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
  67 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
  68 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
  69 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('DifferentPassword123!');
  70 |     await page.getByText('I accept the terms and conditions').click();
  71 |     
  72 |     // Submit form and wait for validation
  73 |     await Promise.all([
  74 |       page.waitForResponse(response => response.url().includes('/auth/v1/signup')),
  75 |       page.getByRole('button', { name: /sign up/i }).click()
  76 |     ]);
  77 |
  78 |     await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: TIMEOUT });
  79 |   });
  80 |
  81 |   test('should show error for terms not accepted', async ({ page }) => {
  82 |     const timestamp = Date.now();
  83 |     const email = `testuser${timestamp}@example.com`;
  84 |
  85 |     await page.locator(`#${FORM_IDS.AUTH.NAME}`).fill('Test User');
  86 |     await page.locator(`#${FORM_IDS.AUTH.EMAIL}`).fill(email);
  87 |     await page.locator(`#${FORM_IDS.AUTH.PASSWORD}`).fill('Password123!');
  88 |     await page.locator(`#${FORM_IDS.AUTH.CONFIRM_PASSWORD}`).fill('Password123!');
  89 |     await page.getByRole('button', { name: /sign up/i }).click();
  90 |
  91 |     await expect(page.getByText(/you must accept the terms and conditions/i)).toBeVisible({ timeout: TIMEOUT });
  92 |   });
  93 |
  94 |   test('should show error for required fields', async ({ page }) => {
  95 |     await page.getByRole('button', { name: /sign up/i }).click();
  96 |
  97 |     await expect(page.getByText(/this field is required/i)).toBeVisible({ timeout: TIMEOUT });
  98 |   });
  99 | }); 
```