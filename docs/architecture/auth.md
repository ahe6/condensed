# Auth

Authentication uses Amazon Cognito. The app stack can stay local while Cognito runs in AWS.

Last verified against backend auth routes, services, and dev reset scripts on 2026-06-07.

## Current State

- Cognito is deployed as part of the `health-dev` AWS dev stack.
- Local Postgres remains the active local development database.
- AWS dev also has private RDS, ECR, ECS, and public backend/frontend ALBs deployed.
- New signups use link-based email confirmation.
- Backend admin routes require Cognito `admin` group membership.

## Cognito Resources

Terraform manages Cognito in `infra/envs/dev/auth.tf`:

- User pool: `health-dev`
- Hosted UI domain: `https://health-dev-173748329850.auth.us-east-2.amazoncognito.com`
- Public frontend app client using authorization code flow with PKCE
- `admin` user group
- Link-based email confirmation

Apply only Cognito:

```sh
make dev-init
make dev-auth-plan
make dev-auth-apply
```

Write Cognito outputs into ignored local env files:

```sh
make dev-auth-env
```

This updates:

- `apps/backend/.env`
- `apps/frontend/.env.local`

Restart backend and frontend dev servers after changing auth env values.

## Local Login Flow

Use `http://localhost:3001` consistently during local auth testing.

1. Frontend starts the Hosted UI login flow with PKCE.
2. Cognito handles signup, signin, password policy, and email confirmation.
3. Cognito redirects back to the current browser origin at `/auth/callback`.
4. The frontend exchanges the authorization code for tokens.
5. The callback redirects to the saved return path, or `/my-health` for generic sign-in.
6. API requests include the Cognito ID token in `Authorization: Bearer <token>`.
7. Backend verifies the ID token against the Cognito issuer and app client ID.
8. Backend links the Cognito `sub` to local `users.externalAuthId`.

Protected flows that should resume after login, such as checkout, admin, orders, addresses, and assessment drafts, pass an explicit return path before redirecting to Cognito.

Do not mix `localhost` and `127.0.0.1` in the same login attempt. Browser storage is origin-specific, and PKCE state must be read from the same origin that started login.

Deployed AWS dev frontend login uses HTTPS at `https://dev.condensedhealth.com`. Terraform registers `https://dev.condensedhealth.com/auth/callback` as a Cognito callback URL and `https://dev.condensedhealth.com` as a logout URL. If the domain changes, update `frontend_domain`, complete ACM DNS validation through Cloudflare, apply Terraform, and redeploy the frontend so Cognito config is included in the image.

## Signup Confirmation

Cognito sends confirmation links for new signups.

The link currently lands on Cognito's managed confirmation page, which shows Cognito's default continue flow back to sign-in. This is acceptable for now because it keeps signup mostly managed by Cognito.

If a signup is interrupted, or a user is stuck as unconfirmed, open:

```text
http://localhost:3001/auth/confirm
```

That page can confirm the existing account with a code or resend the confirmation email.

## Customer Routes

Authenticated customer routes expect a Cognito ID token:

```text
Authorization: Bearer <id-token>
```

Current routes:

- `GET /me`
- `PATCH /me`
- `GET /me/addresses`
- `POST /me/addresses`
- `PATCH /me/addresses/:id`
- `DELETE /me/addresses/:id`
- `GET /me/cart`
- `POST /me/cart`
- `GET /me/orders`
- `GET /orders/:orderNumber`
- `POST /checkout`
- `POST /checkout/stripe`

Account profile, account addresses, account cart, checkout, and customer order detail require a valid bearer token. Checkout links the created order to the authenticated local user, and order detail only returns orders owned by that local user. Email stays controlled by Cognito; local profile editing only updates name and phone.

## Admin Access

All backend `/admin/*` routes require:

- Valid Cognito ID token
- Membership in the Cognito `admin` group

Grant a dev user admin access:

```sh
make dev-auth-add-admin EMAIL=user@example.com
```

The user must sign out and sign back in after group membership changes so Cognito issues a fresh ID token with the `admin` group claim.

Delete a throwaway dev user:

```sh
make dev-auth-delete-user EMAIL=user@example.com
```

Fix a local app user whose email is linked to an old Cognito identity:

```sh
make local-auth-reset-user EMAIL=user@example.com
```

This clears only the local app DB `users.externalAuthId` value for that email. It keeps orders, carts, addresses, assessments, and other app data. The next successful Cognito login with that email relinks the local app user to the current Cognito `sub`.

If the Cognito user should also be deleted from the AWS dev user pool:

```sh
make local-auth-reset-user-delete-cognito EMAIL=user@example.com
```

AWS dev has a similar combined one-off task:

```sh
make dev-auth-reset-user EMAIL=user@example.com
```

Reset scope summary:

| Command | Scope | Keeps App Data? |
| --- | --- | --- |
| `make local-auth-reset-user EMAIL=...` | Clears one local DB user's Cognito link only | Yes |
| `make local-auth-reset-user-delete-cognito EMAIL=...` | Clears one local DB user's Cognito link and deletes the matching AWS dev Cognito user | Yes |
| `make dev-auth-reset-user EMAIL=...` | Clears one AWS dev DB user's Cognito link through ECS, then deletes matching AWS dev Cognito user | Yes |
| `make dev-auth-delete-user EMAIL=...` | Deletes matching AWS dev Cognito user only | Local/app DB rows are unchanged |
| `make dev-db-reset-data CONFIRM=health-dev` | Truncates AWS dev app tables | No |

## Key Functions

- `getCurrentUser(authorization)`: verifies a Cognito ID token, links the token subject to a local user, and can attach an existing local user by matching email. It rejects emails already linked to another Cognito subject.
- `getOptionalCurrentUser(authorization)`: returns `null` without a header but otherwise behaves like `getCurrentUser`; callers should only use it where anonymous access is valid.
- `listCurrentUserOrders(authorization)`: resolves the current Cognito user first, then returns only orders owned by that local user.
- `requireAdmin(authorization)` / `getAdminIdentity(authorization)`: verifies the Cognito ID token and requires the `admin` group. `server.ts` runs this guard for every `/admin/*` route.

## Production Notes

Cognito is HIPAA eligible, but HIPAA use still requires the right AWS BAA, configuration, logging, operational controls, and application behavior.

Cognito's default email sender is acceptable for dev, but production should use SES with a verified domain and SPF, DKIM, and DMARC for better deliverability.

Future UX polish: route confirmation links through the app instead of Cognito's managed confirmation page. The app could confirm the signup and show clearer copy such as `Sign In`, but that means owning more of the signup confirmation flow.

Admin authorization currently uses a single Cognito group. Add finer-grained roles or permissions before adding multiple admin personas.
