Password reset setup

Run this SQL in your Supabase project (SQL editor) to create the table used by the backend endpoints:

```sql
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token uuid not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  used_at timestamptz
);

-- Optional helpful index
create index if not exists idx_password_resets_token on public.password_resets(token);
create index if not exists idx_password_resets_user_id on public.password_resets(user_id);
```

Endpoints added
- POST `/auth/request-password-reset` body: `{ email: string }` → always returns 200. In dev, token is logged on the server.
- POST `/auth/reset-password` body: `{ token: string, newPassword: string }` → sets new password if token is valid and not expired/used.

Note: Sending email is not implemented. In production, wire this to an email provider using the generated token.

SMTP/email configuration

The server can send password reset emails via SMTP using Nodemailer. Set these env vars when running the server:

```
SMTP_HOST=your.smtp.host
SMTP_PORT=587               # or 465 with SMTP_SECURE=true
SMTP_SECURE=false           # "true" to use TLS on port 465
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
FROM_EMAIL=no-reply@fitquest.yourdomain
```

By default, the email includes a deep link: `fitquest://reset-password?token=...`. Ensure your Expo app has the scheme `fitquest` (see `client/app.json`), or change the scheme and update the deep link in `server/services/emailService.js`.


