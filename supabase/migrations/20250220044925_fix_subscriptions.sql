-- Add missing columns to subscriptions table if they don't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns where table_name = 'subscriptions' and column_name = 'polar_id') then
        alter table subscriptions add column polar_id text;
        create index subscriptions_polar_id_idx on subscriptions(polar_id);
    end if;
end $$;
