-- Read-only: print the exact predicate on the client_vault write policy.
-- Supabase → SQL Editor → Run. GOOD if the predicate mentions can_access_client
-- (or manages_client / is_privileged). BAD if it says is_staff() or true.
select policyname, cmd,
       qual        as using_predicate,
       with_check  as with_check_predicate
from pg_policies
where schemaname = 'public' and tablename = 'client_vault'
order by policyname;
