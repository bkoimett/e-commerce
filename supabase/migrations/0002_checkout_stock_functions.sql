-- Atomic stock reservation for checkout (design.md §8, WORKFLOW #27).
--
-- Never read stock_quantity, check it, then write it back — two
-- simultaneous checkouts for the last unit would both succeed. Instead all
-- stock changes happen in one conditional UPDATE per variant: it decrements
-- only when enough stock remains, and affects zero rows otherwise.
--
-- Both functions are SECURITY DEFINER (run as the table owner) and are
-- revoked from PUBLIC: the anon key must never be able to drain stock
-- without going through checkout. Only the server-side checkout and
-- webhook paths (service role) call them.

create or replace function atomic_decrement_stock(p_variant_id uuid, p_quantity integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update product_variants
  set stock_quantity = stock_quantity - p_quantity
  where id = p_variant_id
    and p_quantity > 0
    and stock_quantity >= p_quantity
  returning 1 into affected;

  -- 0 means the variant is out of stock (or doesn't exist); 1 means reserved.
  return coalesce(affected, 0);
end;
$$;

create or replace function restock_variant(p_variant_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update product_variants
  set stock_quantity = stock_quantity + p_quantity
  where id = p_variant_id and p_quantity > 0;
end;
$$;

revoke execute on function atomic_decrement_stock(uuid, integer) from public;
revoke execute on function restock_variant(uuid, integer) from public;
grant execute on function atomic_decrement_stock(uuid, integer) to service_role;
grant execute on function restock_variant(uuid, integer) to service_role;