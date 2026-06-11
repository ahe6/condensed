AWS_PROFILE ?= dev
AWS_REGION ?= us-east-2
BACKEND_IMAGE ?= health/backend
BACKEND_TAG ?= latest
FRONTEND_IMAGE ?= health/frontend
FRONTEND_TAG ?= latest
BOOTSTRAP_DIR := infra/bootstrap
DEV_DIR := infra/envs/dev

.PHONY: aws-login aws-whoami fmt validate local-dev local-dev-restart frontend-dev-aws bootstrap-init bootstrap-plan bootstrap-apply dev-init dev-plan dev-auth-plan dev-auth-apply dev-jobs-plan dev-jobs-apply dev-auth-env dev-test-env dev-stripe-secrets-sync dev-stripe-webhook-sync dev-reset-smoke-prepare dev-smoke-prepare dev-smoke-check local-auth-reset-user local-auth-reset-user-delete-cognito dev-auth-add-admin dev-auth-delete-user dev-auth-reset-user dev-db-reset-data dev-db-seed dev-db-reset-seed backend-docker-build frontend-docker-build backend-ecr-login backend-ecr-push frontend-ecr-login frontend-ecr-push backend-migrate-aws backend-deploy-aws frontend-deploy-aws stripe-reconcile-checkouts stripe-reconcile-checkouts-aws notifications-retry

aws-login:
	aws sso login --profile $(AWS_PROFILE)

aws-whoami:
	aws sts get-caller-identity --profile $(AWS_PROFILE)

fmt:
	terraform fmt -recursive

validate:
	terraform -chdir=$(BOOTSTRAP_DIR) validate
	terraform -chdir=$(DEV_DIR) validate

local-dev:
	scripts/local-dev.sh

local-dev-restart:
	scripts/local-dev.sh --restart

frontend-dev-aws:
	scripts/frontend-dev-aws.sh

bootstrap-init:
	terraform -chdir=$(BOOTSTRAP_DIR) init

bootstrap-plan:
	terraform -chdir=$(BOOTSTRAP_DIR) plan

bootstrap-apply:
	terraform -chdir=$(BOOTSTRAP_DIR) apply

dev-init:
	terraform -chdir=$(DEV_DIR) init -backend-config=backend.hcl

dev-plan:
	terraform -chdir=$(DEV_DIR) plan

dev-auth-plan:
	terraform -chdir=$(DEV_DIR) plan -var deploy_app_stack=false

dev-auth-apply:
	terraform -chdir=$(DEV_DIR) apply -var deploy_app_stack=false

dev-jobs-plan:
	terraform -chdir=$(DEV_DIR) plan -var deploy_app_stack=true -var deploy_jobs_stack=true -var backend_service_enabled=false

dev-jobs-apply:
	terraform -chdir=$(DEV_DIR) apply -var deploy_app_stack=true -var deploy_jobs_stack=true -var backend_service_enabled=false

dev-auth-env:
	TERRAFORM_DIR=$(DEV_DIR) scripts/write-local-auth-env.sh

dev-test-env:
	ROOT_ENV_FILE=.env.test TERRAFORM_DIR=$(DEV_DIR) scripts/write-local-auth-env.sh

dev-stripe-secrets-sync:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/sync-aws-dev-stripe-secrets.sh .env.test

dev-stripe-webhook-sync:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) scripts/sync-aws-dev-stripe-webhook-endpoint.sh .env.test

dev-reset-smoke-prepare:
	@test "$(CONFIRM)" = "delete-dev-app-data" || (echo "Usage: make dev-reset-smoke-prepare CONFIRM=delete-dev-app-data" >&2; echo "WARNING: this deletes AWS dev orders, payments, carts, addresses, notes, shipments, and notifications before reseeding catalog data." >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) CONFIRM=$(CONFIRM) scripts/prepare-aws-dev-smoke.sh

dev-smoke-prepare:
	@echo "Refusing to run destructive dev-smoke-prepare." >&2
	@echo "Use make dev-reset-smoke-prepare CONFIRM=delete-dev-app-data if you intentionally want to reset AWS dev app data." >&2
	@exit 2

dev-smoke-check:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/check-aws-dev-smoke.sh

local-auth-reset-user:
	@test -n "$(EMAIL)" || (echo "Usage: make local-auth-reset-user EMAIL=user@example.com" >&2; exit 2)
	scripts/reset-local-dev-user-auth.sh "$(EMAIL)"

local-auth-reset-user-delete-cognito:
	@test -n "$(EMAIL)" || (echo "Usage: make local-auth-reset-user-delete-cognito EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/reset-local-dev-user-auth.sh --delete-cognito "$(EMAIL)"

dev-auth-add-admin:
	@test -n "$(EMAIL)" || (echo "Usage: make dev-auth-add-admin EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/add-cognito-admin.sh "$(EMAIL)"

dev-auth-delete-user:
	@test -n "$(EMAIL)" || (echo "Usage: make dev-auth-delete-user EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/delete-cognito-user.sh "$(EMAIL)"

dev-auth-reset-user:
	@test -n "$(EMAIL)" || (echo "Usage: make dev-auth-reset-user EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/reset-aws-dev-user.sh "$(EMAIL)"

dev-db-reset-data:
	@test "$(CONFIRM)" = "health-dev" || (echo "Usage: make dev-db-reset-data CONFIRM=health-dev" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/reset-aws-dev-data.sh --yes

dev-db-seed:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/seed-aws-dev-data.sh

dev-db-reset-seed:
	@test "$(CONFIRM)" = "health-dev" || (echo "Usage: make dev-db-reset-seed CONFIRM=health-dev" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/reset-aws-dev-data.sh --yes --seed

backend-docker-build:
	docker build -f apps/backend/Dockerfile -t $(BACKEND_IMAGE):$(BACKEND_TAG) .

frontend-docker-build:
	docker build -f apps/frontend/Dockerfile -t $(FRONTEND_IMAGE):$(FRONTEND_TAG) .

backend-ecr-login:
	aws ecr get-login-password --region $(AWS_REGION) --profile $(AWS_PROFILE) | docker login --username AWS --password-stdin $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url | cut -d/ -f1)

frontend-ecr-login:
	aws ecr get-login-password --region $(AWS_REGION) --profile $(AWS_PROFILE) | docker login --username AWS --password-stdin $$(terraform -chdir=$(DEV_DIR) output -raw frontend_ecr_repository_url | cut -d/ -f1)

backend-ecr-push:
	docker tag $(BACKEND_IMAGE):$(BACKEND_TAG) $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url):$(BACKEND_TAG)
	docker push $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url):$(BACKEND_TAG)

frontend-ecr-push:
	docker tag $(FRONTEND_IMAGE):$(FRONTEND_TAG) $$(terraform -chdir=$(DEV_DIR) output -raw frontend_ecr_repository_url):$(FRONTEND_TAG)
	docker push $$(terraform -chdir=$(DEV_DIR) output -raw frontend_ecr_repository_url):$(FRONTEND_TAG)

backend-migrate-aws:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/run-aws-migration.sh

backend-deploy-aws:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) BACKEND_IMAGE=$(BACKEND_IMAGE) BACKEND_TAG=$(BACKEND_TAG) scripts/deploy-aws-backend.sh

frontend-deploy-aws:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) FRONTEND_IMAGE=$(FRONTEND_IMAGE) FRONTEND_TAG=$(FRONTEND_TAG) scripts/deploy-aws-frontend.sh

stripe-reconcile-checkouts:
	npm run stripe:reconcile-checkouts

stripe-reconcile-checkouts-aws:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/run-aws-stripe-reconcile-checkouts.sh

notifications-retry:
	npm run notifications:retry
