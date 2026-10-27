-- Showcase sample data: 24 distinct, gentle letters across the atolls, plus kind notes under several.
-- For demos, screenshots and ads. ALL SAMPLE CONTENT: invented, not real people's stories.
-- Run AFTER schema.sql and migrations/002_comments_moderation.sql.
-- Replaces any earlier sample rows. Remove everything with:
--   delete from public.posts where device_token like 'seed-%';      -- comments cascade

delete from public.posts where device_token like 'seed-%';

with s(n, category, atoll, island, tw, hours_ago, felt, heart, listen, body) as (values
 (1,  'nostalgia','K',  'Thulusdhoo',     null,      5,  22, 14, 31, 'I miss the generator going quiet at midnight and the whole island falling asleep together. Nobody warned me that growing up means the island slowly gets smaller.'),
 (2,  'sad',      'MLE','Hulhumalé',      null,      9,  41, 18, 52, 'Moved to Hulhumalé for work. Everyone is kind and nobody knows my name. I eat dinner on the phone with my mother so the table doesn''t feel so empty.'),
 (3,  'work',     'MLE','Malé',           null,      14, 37, 9,  28, 'I smile through every meeting, then sit in the stairwell for five minutes before going back to my desk. Nobody has noticed. I''m not sure I want them to.'),
 (4,  'relationships','S','Hithadhoo',    null,      20, 29, 33, 24, 'We both know it''s over. We just haven''t said it out loud, and every day we don''t, it gets heavier to hold.'),
 (5,  'secrets',  'Gn', 'Fuvahmulah',     null,      26, 18, 21, 15, 'I got the scholarship and told everyone I turned it down. I wasn''t brave enough to leave my mother alone on the island.'),
 (6,  'vent',     'HDh','Kulhudhuffushi', null,      31, 44, 12, 39, 'I send money home every month and nobody asks how I''m doing. I''m not complaining about the money. I just want one person to ask.'),
 (7,  'horror',   'GA', 'Vilingili',      null,      40, 12, 5,  9,  'The old well behind my grandmother''s house: we were told never to go near it after maghrib. Last night I heard someone drawing water. Nobody has used that well in years.'),
 (8,  'nostalgia','K',  'Maafushi',       null,      47, 26, 30, 35, 'Football on the sand until the last light, then mas huni and hot roshi at my grandmother''s. I would trade a lot for one more of those evenings.'),
 (9,  'sad',      'K',  'Dhiffushi',      'grief',   55, 58, 40, 63, 'It has been a year and I still set out two cups of black tea by mistake. Some mornings I leave the second one there a little while.'),
 (10, 'work',     'S',  'Hithadhoo',      null,      63, 20, 6,  17, 'Three jobs in two years. Every interview asks where I see myself in five years. I can barely see next week.'),
 (11, 'relationships','B','Eydhafushi',   null,      70, 33, 19, 26, 'I forgave him again. Telling myself it''s different this time is getting harder to believe.'),
 (12, 'secrets',  'MLE','Hulhumalé',      null,      78, 24, 27, 22, 'My family thinks I''m studying medicine. I switched to art in my second year. I''ve been painting in a friend''s spare room and lying on the phone every Sunday.'),
 (13, 'vent',     'Th', 'Veymandoo',      null,      85, 31, 8,  21, 'The ferry schedule changed again and I missed my exam. Everyone says "that''s island life". I''m tired of island life being the answer to everything.'),
 (14, 'horror',   'N',  'Manadhoo',       null,      94, 15, 4,  11, 'Something knocked three times on the guesthouse door at 3 a.m. The corridor camera showed nobody. I left at sunrise and never told the manager why.'),
 (15, 'nostalgia','L',  'Gan',            null,      102,36, 28, 44, 'Cycling the long causeway with my cousins, no phones, salt on our lips and nowhere to be. I think about that afternoon more than I''d like to admit.'),
 (16, 'sad',      'R',  'Ungoofaaru',     null,      111,47, 22, 49, 'I''m the first in my family to leave the island. Everyone is proud and I have never felt more like I abandoned them.'),
 (17, 'work',     'K',  'Guraidhoo',      null,      120,28, 11, 19, 'Resort shifts: fourteen hours, six days. I send my family photos of the sea and never mention I haven''t swum in it once.'),
 (18, 'relationships','S','Meedhoo', null,      131,25, 35, 30, 'We met online and talk every night. Neither of us wants to say the word first. Maybe that''s what makes it real.'),
 (19, 'secrets',  'Sh', 'Funadhoo',       null,      142,19, 38, 20, 'I write poems on the backs of receipts and keep them in a biscuit tin. Nobody knows I''m a poet.'),
 (20, 'vent',     'V',  'Felidhoo',       null,      150,39, 14, 33, 'I have been told "you''re too sensitive" my whole life. I''m not too sensitive. I just notice.'),
 (21, 'nostalgia','M',  'Muli',           null,      158,30, 25, 27, 'My mother''s voice calling us in for dinner across the whole island. These days I call myself in.'),
 (22, 'sad',      'GDh','Thinadhoo',      null,      166,52, 20, 46, 'Some days the sea feels like a promise and some days like a wall between me and everyone I love. Today it''s the wall.'),
 (23, 'work',     'ADh','Mahibadhoo',     null,      175,23, 7,  16, 'My manager takes credit for my work and I say "thank you for the opportunity". I practise what I would really say in the shower.'),
 (24, 'horror',   'F',  'Nilandhoo',      null,      184,14, 6,  10, 'The generator room hums like someone whispering my name. I know it''s only the machine. I still sleep with the light on, and I''m twenty-eight.')
)
insert into public.posts (body, category, trigger_warning, atoll_code, island, felt_count, heart_count, listening_count, created_at, device_token)
select body, category, tw, atoll, island, felt, heart, listen, now() - (hours_ago * interval '1 hour'), 'seed-show-' || n from s;

-- Kind notes, left by "someone"
with c(n, i, body) as (values
 (9, 1, 'Sending you strength. A second cup is allowed to stay a while 🫂'),
 (9, 2, 'Thank you for writing this. You''re not alone in it.'),
 (9, 3, 'Be gentle with yourself 🌊'),
 (2, 1, 'Hulhumalé can feel so quiet at first. Hoping someone learns your name soon.'),
 (2, 2, 'I felt this. Calling your mum at dinner sounds like a lovely habit 🕯️'),
 (6, 1, 'You deserve to be asked too. How ARE you? 🫶'),
 (6, 2, 'I felt this so much.'),
 (16, 1, 'Proud and homesick can both be true. You didn''t abandon anyone 🤍'),
 (16, 2, 'You''re not alone in this.'),
 (16, 3, 'Thank you for sharing this.'),
 (4, 1, 'Sending you strength. Saying it out loud will be hard and then lighter.'),
 (19, 1, 'The biscuit tin poems deserve to be read one day ✨'),
 (19, 2, 'You''re a poet. Keep writing 🕯️'),
 (12, 1, 'I hope the painting is going well. Your art is real, even in a spare room 🎨'),
 (1, 1, 'Reading this I could hear the generator stop. Thank you for the memory 🌊'),
 (22, 1, 'Walls can become doors again. Sending you strength today 🫂'),
 (22, 2, 'Be gentle with yourself.'),
 (15, 1, 'Salt on your lips and nowhere to be. What a perfect afternoon 🤍')
)
insert into public.comments (post_id, body, device_token)
select p.id, c.body, 'seed-c-' || c.n || '-' || c.i
from c join public.posts p on p.device_token = 'seed-show-' || c.n;

select 'posts' as what, count(*) from public.posts where device_token like 'seed-%'
union all select 'comments', count(*) from public.comments where device_token like 'seed-%';
