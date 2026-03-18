# SQL Migrations

## Applied Files

- `V001__init_schema.sql`
- `V002__add_auth_tables.sql`
- `V003__create_tracked_products.sql`

## Rules

- 이미 적용된 migration 파일은 수정하지 않는다.
- 변경이 필요하면 새 버전 파일을 추가한다 (e.g. `V004__...sql`).
- 모든 스키마 변경은 PR에 migration 파일로 포함한다.
