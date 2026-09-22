# The daily pick — how the home page chooses today's poem and photograph

Kahran, 2026-09-21: "it has to be the poem and photo are tied to the location and weather and date. So this is tough, we need to do a proper scoring to get that to work."

## The idea in one paragraph

Every poem and every photograph is scored once on seven shared axes. **Today's pick is live**: the browser scores the axes from the exact same weather reading the line under the date renders ("We're in New York and it's raining."), and picks the closest poem and photograph that have not been shown recently. Kahran's rule: "the photo/poem should change if we change the weather listed, is the only thing" — one reading, one line, one pick, always in that order. Each night at 23:50 local the mini scores the day the same way, from the day's actual Open-Meteo record, and commits that as the day's permanent **archive** entry in `v2/days.json` — the day is then frozen and never recomputed from the network again. The page falls back to that stored entry, then to the old date hash, for anything the live pick or the job can't answer.

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
| `v2/days.json` | `tools/daily_pick.py` on the mini, 23:50 local, via PR | one frozen archive pair per day (fallback for that day thereafter) |
| `v2/place.json` | `tools/place_feed.py` on the mini, 3-hourly, via PR | where he is, city level, only at high confidence |

`v2/weather.js` fetches the live Open-Meteo reading for the line under the date and publishes it as `window.kahranWeather.current` + a `kahran:weather` document event. `v2/pick.js` is the scoring port: for **today** it builds the day vector from that same reading; for a **past day** it builds the vector from that day's stored `why` in `v2/days.json`. The page (`v2/home.js`) tries `v2/pick.js`'s answer first, then the stored `v2/days.json` pair, then the old date hash — swapping the on-screen pair only when the resolved pick actually changes, so a re-evaluation (weather landing, scores loading) never flickers.

## The pick

score = −(weighted distance over the axes) + place bonus (photos: +0.35 within 50 km, +0.15 within 500 km of presence) − novelty (poem shown in the last 60 days, photo in the last 30) + a hash tiebreak so ties are stable.

Weights: light 1.0, warmth 1.0, wet 1.2, stillness 0.6, season 0.8, inside 0.6, mood 0.3.

**Two day-vector builders, same weights.** `tools/daily_pick.py`'s axes come from a whole day's Open-Meteo *aggregate* (sunshine ÷ daylight, day's max temp, precipitation sum, max wind) — that's what a 23:50 archive run has. `v2/pick.js`'s live axes come from an *instantaneous* `current` reading instead (is_day + cloud_cover for light, the current temperature/wind/precipitation), because there is no "today's sunshine total" yet at 9am. Same weights, place bonus, novelty window and tiebreak formula in both; the light/wet/stillness inputs differ because the two builders see different shapes of weather.

## Widening the photographs (next)

Only photographs Kahran took himself, never a hired photographer's. The filter is the camera in EXIF, which is deterministic. The on-premise model (qwen2.5vl on the mini, the photo-tagger lane) grades candidates into a review album; he hearts; hearted photos are exported at web size, scored on the axes by the frontier model, and added to `data.json`. Same shape as the "Me" picks in `kbs-tools/photo-tagger/me_picks.py`.

## Not decided

- Whether a Samwise lane watches the two publishers (it should; register in day-flow).
- Whether `hour` should bias the pick by the time the page is opened. Today it is stored and unused.
