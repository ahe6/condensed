data "aws_availability_zones" "available" {
  count = local.deploy_app_stack ? 1 : 0

  state = "available"
}

resource "aws_vpc" "main" {
  count = local.deploy_app_stack ? 1 : 0

  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = local.name_prefix
  }
}

resource "aws_subnet" "db_private" {
  count = local.deploy_app_stack ? length(var.db_subnet_cidr_blocks) : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = var.db_subnet_cidr_blocks[count.index]
  availability_zone = data.aws_availability_zones.available[0].names[count.index]

  tags = {
    Name = "${local.name_prefix}-db-${count.index + 1}"
    Tier = "database"
  }
}

resource "aws_subnet" "app_public" {
  count = local.deploy_app_stack ? length(var.app_subnet_cidr_blocks) : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = var.app_subnet_cidr_blocks[count.index]
  availability_zone       = data.aws_availability_zones.available[0].names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-app-${count.index + 1}"
    Tier = "application"
  }
}

resource "aws_internet_gateway" "main" {
  count = local.deploy_app_stack ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = {
    Name = local.name_prefix
  }
}

resource "aws_route_table" "app_public" {
  count = local.deploy_app_stack ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name = "${local.name_prefix}-app-public"
  }
}

resource "aws_route_table_association" "app_public" {
  count = length(aws_subnet.app_public)

  subnet_id      = aws_subnet.app_public[count.index].id
  route_table_id = aws_route_table.app_public[0].id
}

resource "aws_db_subnet_group" "postgres" {
  count = local.deploy_app_stack ? 1 : 0

  name       = "${local.name_prefix}-postgres"
  subnet_ids = aws_subnet.db_private[*].id

  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}
