AWS_PROFILE ?= dev
AWS_REGION ?= us-east-2
BACKEND_IMAGE ?= tele/backend
BACKEND_TAG ?= latest
FRONTEND_IMAGE ?= tele/frontend
FRONTEND_TAG ?= latest
BOOTSTRAP_DIR := infra/bootstrap
DEV_DIR := infra/envs/dev

.PHONY: aws-login aws-whoami fmt validate bootstrap-init bootstrap-plan bootstrap-apply dev-init dev-plan dev-auth-plan dev-auth-apply dev-auth-env dev-test-env dev-auth-add-admin dev-auth-delete-user backend-docker-build frontend-docker-build backend-ecr-login backend-ecr-push backend-migrate-aws orders-expire

aws-login:
	aws sso login --profile $(AWS_PROFILE)

aws-whoami:
	aws sts get-caller-identity --profile $(AWS_PROFILE)

fmt:
	terraform fmt -recursive

validate:
	terraform -chdir=$(BOOTSTRAP_DIR) validate
	terraform -chdir=$(DEV_DIR) validate

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

dev-auth-env:
	TERRAFORM_DIR=$(DEV_DIR) scripts/write-local-auth-env.sh

dev-test-env:
	ROOT_ENV_FILE=.env.test TERRAFORM_DIR=$(DEV_DIR) scripts/write-local-auth-env.sh

dev-auth-add-admin:
	@test -n "$(EMAIL)" || (echo "Usage: make dev-auth-add-admin EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/add-cognito-admin.sh "$(EMAIL)"

dev-auth-delete-user:
	@test -n "$(EMAIL)" || (echo "Usage: make dev-auth-delete-user EMAIL=user@example.com" >&2; exit 2)
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/delete-cognito-user.sh "$(EMAIL)"

backend-docker-build:
	docker build -f apps/backend/Dockerfile -t $(BACKEND_IMAGE):$(BACKEND_TAG) .

frontend-docker-build:
	docker build -f apps/frontend/Dockerfile -t $(FRONTEND_IMAGE):$(FRONTEND_TAG) .

backend-ecr-login:
	aws ecr get-login-password --region $(AWS_REGION) --profile $(AWS_PROFILE) | docker login --username AWS --password-stdin $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url | cut -d/ -f1)

backend-ecr-push:
	docker tag $(BACKEND_IMAGE):$(BACKEND_TAG) $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url):$(BACKEND_TAG)
	docker push $$(terraform -chdir=$(DEV_DIR) output -raw backend_ecr_repository_url):$(BACKEND_TAG)

backend-migrate-aws:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) TERRAFORM_DIR=$(DEV_DIR) scripts/run-aws-migration.sh

orders-expire:
	npm run orders:expire
