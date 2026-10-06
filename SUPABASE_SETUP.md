# ABAS Supabase member setup

This version of the site includes:

- Member registration with email/password
- Email confirmation support
- Member login/logout
- Password reset
- Member profile modification
- Membership statuses: `pending`, `approved`, `suspended`, `rejected`
- Roles: `member`, `admin`
- Admin page for approving registrations and changing member roles/status
- Login guards on `governance.html` and `protocols.html`

## 1. Create a Supabase project

Create a project in Supabase, then open **SQL Editor** and run the full contents of `supabase-setup.sql`.

## 2. Configure the website

Open `supabase-config.js` and replace:

```js
url: 'https://YOUR-PROJECT.supabase.co',
anonKey: 'YOUR-SUPABASE-ANON-KEY'
```

with your project's **Project URL** and **anon/public key** from Supabase project settings.

Never put the `service_role` key in browser code or GitHub.

## 3. Configure Auth URLs

In Supabase Authentication URL settings, set your production site URL and add the URLs used by the site as allowed redirects, especially:

- `/login.html`
- `/reset-password.html`

For local testing, also add the local development origin you use.

## 4. Register the first administrator

Use `register.html` to create the first account. After confirming the email (if confirmation is enabled), run this once in the Supabase SQL Editor:

```sql
update public.profiles
set role='admin', status='approved'
where lower(email)=lower('YOUR-ADMIN-EMAIL@example.com');
```

That account can then open `admin.html` and approve other registrations.

## 5. Member workflow

1. Visitor registers at `register.html`.
2. Supabase creates the auth account and profile with `status='pending'`, `role='member'`.
3. Admin signs in and opens `admin.html`.
4. Admin changes the member to `approved`.
5. Approved member can access the private member pages.

## Security note about documents

The login guard protects the HTML navigation flow, but any file that remains inside the published static site (for example `docs/*.docx`) still has a public URL if someone knows it. For confidential protocols, treasury files or governance documents, move the final files to a **private Supabase Storage bucket** and serve them with authenticated access instead of publishing them under `/docs`.
