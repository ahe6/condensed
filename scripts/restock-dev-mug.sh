#!/usr/bin/env bash
set -euo pipefail

inventory_quantity="${1:-25}"

docker compose exec -T postgres psql -U tele_admin -d tele -v inventory_quantity="$inventory_quantity" <<'SQL'
update product_variants
set "inventoryQuantity" = :'inventory_quantity'::int,
    "updatedAt" = now()
where id in (
  select v.id
  from product_variants v
  join products p on p.id = v."productId"
  where p.slug = 'dev-mug'
);
SQL
