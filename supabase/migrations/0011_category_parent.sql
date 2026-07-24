-- Subcategories: self-referencing parent_id on categories, nullable = top-level.
-- Cascade delete: removing a parent category also removes its subcategories
-- (the admin UI warns on delete, but this keeps the DB consistent either way).
alter table categories
  add column parent_id uuid references categories(id) on delete cascade;

create index idx_categories_parent_id on categories(parent_id);
