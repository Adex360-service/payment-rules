create table if not exists processed_orders (
  shop_domain text not null,
  order_id text not null,
  created_at timestamptz not null,
  primary key (shop_domain, order_id)
);

create table if not exists monthly_order_usage (
  shop_domain text not null,
  billing_month text not null,
  order_count integer not null default 0,
  primary key (shop_domain, billing_month)
);
