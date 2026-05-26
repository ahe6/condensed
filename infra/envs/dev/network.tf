data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = local.name_prefix
  }
}

resource "aws_subnet" "db_private" {
  count = length(var.db_subnet_cidr_blocks)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.db_subnet_cidr_blocks[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.name_prefix}-db-${count.index + 1}"
    Tier = "database"
  }
}

resource "aws_subnet" "app_public" {
  count = length(var.app_subnet_cidr_blocks)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.app_subnet_cidr_blocks[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${local.name_prefix}-app-${count.index + 1}"
    Tier = "application"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = local.name_prefix
  }
}

resource "aws_route_table" "app_public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${local.name_prefix}-app-public"
  }
}

resource "aws_route_table_association" "app_public" {
  count = length(aws_subnet.app_public)

  subnet_id      = aws_subnet.app_public[count.index].id
  route_table_id = aws_route_table.app_public.id
}

resource "aws_db_subnet_group" "postgres" {
  name       = "${local.name_prefix}-postgres"
  subnet_ids = aws_subnet.db_private[*].id

  tags = {
    Name = "${local.name_prefix}-postgres"
  }
}
