# The daily pick — how the home page chooses today's poem and photograph

Kahran, 2026-09-21: "it has to be the poem and photo are tied to the location and weather and date. So this is tough, we need to do a proper scoring to get that to work."

## The idea in one paragraph

Every poem and every photograph is scored once on seven shared axes. Each morning the mini scores the day on the same axes from where Kahran is and what the sky is doing there, picks the closest poem and photograph that have not been shown recently, and commits the pair. The day is then frozen: the archive walks back through real days, never a recomputation. The page falls back to the old date hash for any day the job missed, so it never breaks.

## The seven axes (0 → 1)

| axis | 0 | 1 | for the day, from |
|---|---|---|---|
| light | dark | bright | sunshine ÷ daylight, weather code |
| warmth | cold | warm | the day's max temperature |
| wet | dry | wet | precipitation sum, rain/snow/fog codes |
| stillness | still | moving | max wind; travelling adds motion |
| season | midwinter | midsummer | cosine over the year, flipped south of the equator |
| inside | interior | open | rain and cold push inside |
| mood | grief | joy | **always 0.5** — the site must not decide he is sad because it rained |

Poems and photographs also carry `hour` (dawn / day / dusk / night / any). Photographs carry `place` (name, lat, lon).

## Files

| path | owner | what |
|---|---|---|
| `v2/scores-poems.json` | scored once by a frontier model, re-scorable | 89 poems on the axes |
| `v2/scores-photos.json` | scored once by a frontier model, re-scorable | the photographs on the axes, with place |
| `v2/days.json` | `tools/daily_pick.py` on the mini, 05:10 local, via PR | one frozen pair per day |
| `v2/place.json` | `tools/place_feed.py` on the mini, 3-hourly, via PR | where he is, city level, only at high confidence |

The page (`v2/home.js`) reads `days.json` first, hash second. `v2/weather.js` still fetches the live weather for the line under the date.

## The pick

score = −(weighted distance over the axes) + place bonus (photos: +0.35 within 50 km, +0.15 within 500 km of presence) − novelty (poem shown in the last 60 days, photo in the last 30) + a hash tiebreak so ties are stable.

Weights: light 1.0, warmth 1.0, wet 1.2, stillness 0.6, season 0.8, inside 0.6, mood 0.3.

## Widening the photographs (next)

Only photographs Kahran took himself, never a hired photographer's. The filter is the camera in EXIF, which is deterministic. The on-premise model (qwen2.5vl on the mini, the photo-tagger lane) grades candidates into a review album; he hearts; hearted photos are exported at web size, scored on the axes by the frontier model, and added to `data.json`. Same shape as the "Me" picks in `kbs-tools/photo-tagger/me_picks.py`.

## Not decided

- Whether a Samwise lane watches the two publishers (it should; register in day-flow).
- Whether `hour` should bias the pick by the time the page is opened. Today it is stored and unused; the day is frozen at 05:10.
