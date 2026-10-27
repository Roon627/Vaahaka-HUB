-- Sample data for local testing. Run in the Supabase SQL editor AFTER schema.sql.
-- Every row gets a unique device_token starting with 'seed-' (a single shared
-- token would trip the 5-posts/hour rate-limit trigger).
--
-- Remove it all later with:
--   delete from public.posts where device_token like 'seed-%';

with
cats as (
  select array['horror','sad','vent','secrets','nostalgia','work','relationships'] as c
),
bodies as (
  select array[
    'I still hear footsteps on the roof of our old house on windy nights. Nobody believes me.',
    'Missed the last ferry again. Sat on the jetty until sunrise just to feel something quiet.',
    'My manager takes credit for everything I do and I smile in every meeting. I am so tired.',
    'I never told anyone I wanted to study abroad. I let the scholarship deadline pass on purpose.',
    'Miss the evenings playing football on the beach until the call to prayer. Nothing feels like that now.',
    'We have been together six years and I cannot tell if I am staying out of love or out of habit.',
    'Something knocked three times on the door of my guesthouse room. The corridor camera showed nobody.',
    'Everyone thinks island life is peaceful. Nobody talks about how small everything feels when you are struggling.',
    'I send money home every month and still feel like I am failing my family.',
    'My grandmother used to tell stories about the jinn near the old well. Last week I understood why she stopped.',
    'I read my ex''s messages again today. Three months and I still check like it will change something.',
    'Overtime is unpaid, leave is "discouraged", and I am supposed to say thank you for the opportunity.',
    'I laughed at my own jokes alone on the speedboat home and then cried a little. Odd day.',
    'The smell of hedhikaa and black tea from my aunt''s kitchen. I would trade anything for one more afternoon there.'
  ] as b
)
insert into public.posts
  (body, category, trigger_warning, atoll_code, island,
   felt_count, heart_count, listening_count, created_at, device_token)
select
  bodies.b[1 + floor(random() * array_length(bodies.b, 1))::int],
  cats.c[1 + floor(random() * array_length(cats.c, 1))::int],
  case when random() < 0.15 then 'loss, grief' end,
  -- per-atoll exponent (1-6): higher exponent => smaller value => wins more often,
  -- so a few atolls become hotspots and the heatmap has contrast
  -- (g * 0) correlates the subquery to the row so it re-runs per post
  (select code from public.atolls order by random() ^ (1 + ascii(code) % 6) + g * 0 limit 1),
  null,
  floor(random() * 40)::int,
  floor(random() * 25)::int,
  floor(random() * 30)::int,
  now() - (random() * interval '14 days'),
  'seed-' || gen_random_uuid()::text
from generate_series(1, 40) as g, cats, bodies;
