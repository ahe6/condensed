# Auth

Authentication uses Amazon Cognito. The app stack can stay local while Cognito runs in AWS.

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
5. API requests include the Cognito ID token in `Authorization: Bearer <token>`.
6. Backend verifies the ID token against the Cognito issuer and app client ID.
7. Backend links the Cognito `sub` to local `users.externalAuthId`.

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

## Production Notes

Cognito is HIPAA eligible, but HIPAA use still requires the right AWS BAA, configuration, logging, operational controls, and application behavior.

Cognito's default email sender is acceptable for dev, but production should use SES with a verified domain and SPF, DKIM, and DMARC for better deliverability.

Future UX polish: route confirmation links through the app instead of Cognito's managed confirmation page. The app could confirm the signup and show clearer copy such as `Sign In`, but that means owning more of the signup confirmation flow.

Admin authorization currently uses a single Cognito group. Add finer-grained roles or permissions before adding multiple admin personas.
