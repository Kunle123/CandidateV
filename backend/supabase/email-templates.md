# Supabase Email Templates

## Confirm Signup

### Subject
Welcome to CandidateV - Please Confirm Your Email

### Content
```html
<h2>Welcome to CandidateV!</h2>
<p>Thanks for signing up. Please confirm your email address by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Email Address</a></p>
<p>Or copy and paste this link in your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't create an account with CandidateV, you can safely ignore this email.</p>
```

## Magic Link

### Subject
Your CandidateV Login Link

### Content
```html
<h2>Login to CandidateV</h2>
<p>Click the button below to log in to your CandidateV account:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Log In to CandidateV</a></p>
<p>Or copy and paste this link in your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't request this login link, you can safely ignore this email.</p>
```

## Reset Password

### Subject
Reset Your CandidateV Password

### Content
```html
<h2>Reset Your Password</h2>
<p>A password reset was requested for your CandidateV account. Click the button below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this link in your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't request a password reset, you can safely ignore this email.</p>
```

## Change Email Address

### Subject
Confirm Your New Email Address

### Content
```html
<h2>Confirm Email Change</h2>
<p>Please confirm your new email address for your CandidateV account by clicking the button below:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm New Email</a></p>
<p>Or copy and paste this link in your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>If you didn't request this email change, please contact support immediately.</p>
```

## Template Variables
- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your application's URL

## Styling Notes
- Primary Color: #4F46E5 (Indigo)
- All buttons are styled consistently
- Mobile-responsive design
- Clear call-to-action
- Security notices included 