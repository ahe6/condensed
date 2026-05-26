AWS_PROFILE ?= dev
AWS_REGION ?= us-east-2
BACKEND_IMAGE ?= tele/backend
BACKEND_TAG ?= latest
FRONTEND_IMAGE ?= tele/frontend
FRONTEND_TAG ?= latest
BOOTSTRAP_DIR := infra/bootstrap
DEV_DIR := infra/envs/dev

.PHONY: aws-login aws-whoami fmt validate bootstrap-init bootstrap-plan bootstrap-apply dev-init dev-plan backend-docker-build frontend-docker-build backend-ecr-login backend-ecr-push backend-migrate-aws

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
