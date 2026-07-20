# ASCENT map schema

ASCENT maps are data-only finite mountains consumed by `play.html`. Gameplay randomness must derive from `seed`; map authors must not add executable code.

## Root object

| Field | Type | Rules |
| --- | --- | --- |
| `version` | integer | Currently `1`. |
| `id` | string | Stable kebab-case identifier. |
| `order` | integer | Campaign order, starting at `1`. |
| `name` | string | Uppercase display name. |
| `lore` | string | Short entry/summit line. |
| `seed` | integer | Unsigned deterministic terrain seed. |
| `summitAlt` | number | Finite win altitude in metres. |
| `altitudePerMeter` | number | Vertical campaign metres earned per forward world metre; also controls uphill grade. Recommended `0.18` to `0.30`. |
| `assistedSpeed` | number | Target climb speed in world metres/second. Recommended `26` to `34`. |
| `parTime` | number | Author target in seconds. |
| `checkpointAlts` | number[] | Strictly increasing, inside `(0, summitAlt)`, at least 12 seconds apart at target pace. |
| `altitudeBands` | object[] | Ordered `{ from, to, zone, pressure }` bands covering `0..summitAlt`. |
| `gauntlet` | object[] | Ordered attacks. See below. |

## Gauntlet event

```json
{ "at": 112, "type": "beamStrike", "pattern": "center", "telegraphT": 2.8 }
```

- `at`: altitude in metres, strictly increasing and outside the opening safe runway.
- `type`: `sentrySweep`, `beamStrike`, `pathPunch`, or `rockfall`.
- `pattern`: `left`, `center`, `right`, `gap-left`, `gap-center`, or `gap-right`.
- `telegraphT`: warning time in seconds, from `2.2` to `4.5`.

`sentrySweep` is a lane strike. `beamStrike` and `pathPunch` carve a jumpable path break. `rockfall` raises a wall with one authored safe gap. Recovery space belongs immediately before each checkpoint and after dense combinations.

## Verification

Every map must pass schema tests, module syntax bundling, real input smoke, and ASCENT bot runs with zero softlocks. Gate one should remain broadly clearable; attack failures must be readable from their telegraphs.
