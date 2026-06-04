# Production

Production is not split from AWS dev yet. Treat the current AWS environment as dev until the production pieces below are created and configured separately.

## Required Split

- Production domain and Cloudflare routing.
- Production ECS services and load balancers.
- Production RDS database with production data migration policy.
- Production Cognito user pool.
- Stripe live mode keys and webhook endpoint.
- Production secret storage and deployment environment variables.

## Related Docs

- [Infrastructure](../architecture/infrastructure.md)
- [Deployment](../runbooks/deploy.md)
- [Auth](../architecture/auth.md)
- [Payments](../architecture/payments.md)
