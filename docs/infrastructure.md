# Infrastructure

Infrastructure is managed with Terraform.

## Current State

AWS dev resources in `infra/envs/dev` are currently destroyed to avoid AWS dev costs.

Retained infrastructure:

- Terraform bootstrap state bucket
- Local Terraform bootstrap state files

Active development database:

- Local Docker Postgres from `docker-compose.yml`

## AWS Account

```text
profile: dev
account: 173748329850
region: us-east-2
state bucket: tele-terraform-state-173748329850-us-east-2
dev state key: envs/dev/terraform.tfstate
```

Authenticate:

```sh
make aws-login
make aws-whoami
```

## Terraform Layout

```text
infra/bootstrap
  one-time S3 Terraform state bucket setup

infra/envs/dev
  VPC, subnets, RDS, ECR, ECS cluster, migration task,
  and optional public backend service
```

Common commands:

```sh
make fmt
make validate
make bootstrap-init
make bootstrap-plan
make bootstrap-apply
make dev-init
make dev-plan
```

Apply dev resources:

```sh
terraform -chdir=infra/envs/dev apply
```

Destroy dev resources:

```sh
terraform -chdir=infra/envs/dev destroy
```

## Dev Network

Terraform dev creates:

- VPC: `10.20.0.0/16`
- Private DB subnets: `10.20.10.0/24`, `10.20.11.0/24`
- Public app subnets: `10.20.20.0/24`, `10.20.21.0/24`
- Backend security group for workloads that need Postgres access
- Postgres security group
- Optional ALB security group when the backend service is enabled

## RDS Postgres

When recreated, Terraform provisions a private RDS Postgres database:

```text
identifier: tele-dev-postgres
port: 5432
database: tele
username: tele_admin
instance: db.t4g.micro
storage: 20 GB gp3, autoscale up to 100 GB
encrypted: yes
publicly accessible: no
backups: 7 days
```

Security model:

- RDS allows inbound TCP `5432` from the backend security group.
- `allowed_postgres_cidr_blocks` is currently empty.
- The laptop cannot connect directly to RDS by default.
- The RDS master password is managed by AWS Secrets Manager.

Approximate RDS cost before credits: about `$14/month`.

## Backend AWS Resources

When dev is recreated, Terraform creates:

- ECR repository: `tele-dev-backend`
- ECS cluster: `tele-dev`
- CloudWatch log group: `/ecs/tele-dev-backend`
- IAM roles for backend task execution and task runtime
- One-off ECS task definition for backend migrations

The ECR repository URL is:

```text
173748329850.dkr.ecr.us-east-2.amazonaws.com/tele-dev-backend
```

## Optional Public Backend Service

The public backend service is controlled by:

```hcl
backend_service_enabled = false
```

When enabled, Terraform creates:

- Application Load Balancer
- HTTP listener on port `80`
- Target group with `/health` health check
- ECS Fargate task definition
- ECS Fargate service
- Public HTTP security group rules

Preview the service layer:

```sh
terraform -chdir=infra/envs/dev plan -var backend_service_enabled=true
```

Expected added cost when enabled: roughly `$20-30/month` before credits, mainly ALB plus one small Fargate task.

## Runtime Platform

ECS task definitions use ARM64 Fargate because the local backend image is built on Apple Silicon by default.
