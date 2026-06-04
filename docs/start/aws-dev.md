# AWS Dev

Use AWS dev when the behavior depends on deployed infrastructure, public callbacks, or the hosted Cognito/RDS/Stripe setup.

## URLs

- Frontend: `https://dev.condensedhealth.com`
- Backend API: `https://api-dev.condensedhealth.com`

## Common Workflows

- Run the local frontend against AWS dev with `npm run frontend:dev:aws` or `make frontend-dev-aws`.
- Deploy backend and frontend changes with the commands in [Deployment](../runbooks/deploy.md).
- Use the non-destructive smoke check with `make dev-smoke-check`.
- Reset dev app data only with the explicit destructive command in [Runbooks](../runbooks/README.md).

## Related Docs

- [Infrastructure](../architecture/infrastructure.md)
- [Deployment](../runbooks/deploy.md)
- [Runbooks](../runbooks/README.md)
