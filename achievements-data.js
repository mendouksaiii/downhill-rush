/* Redline Rider — achievement catalogue (150).
 *
 * Every achievement resolves to ONE key in the lifetime stat tracker plus a
 * goal, so "attainable" is enforceable: tests assert that each `stat` exists
 * in the tracker schema, and the engine is a single numeric comparison.
 *
 *   stat   key in the stats object (see STAT_KEYS below)
 *   goal   threshold; reached when value >= goal
 *   cmp    'gte' (default) or 'lte' for times, where lower is better
 *   mode   'descent' | 'ascent' | 'any'  — informational grouping for the UI
 *   coins  payout on unlock. RR token payouts land later; the field is
 *          intentionally absent rather than zeroed so it can be added without
 *          a migration.
 *
 * Rewards scale with effort: ~60 coins for the first rung, up to 4000 for the
 * long grinds. Total across all 150 is ~118k — about four mid-tier skins, so
 * completing everything is meaningful without trivialising the market.
 */

// The single source of truth for what the tracker must record. The test suite
// cross-checks every achievement's `stat` against this list.
export const STAT_KEYS = [
  // single-run bests
  'distBest', 'altBest', 'comboBest', 'hangBest', 'scoreBest',
  'perfectRun', 'flipRun', 'nearRun', 'dodgeRun', 'speedBest', 'timeBest',
  'summitFastT',
  // lifetime totals
  'runs', 'runsDescent', 'runsAscent', 'distTotal', 'altTotal',
  'hangTotal', 'perfectTotal', 'flipTotal', 'nearTotal', 'dodgeTotal',
  'scoreTotal', 'coinsEarned', 'summits', 'checkpoints', 'cleanRuns', 'days',
];

/* series(): expand one tiered ladder into achievement objects.
   rows are [goal, name, description, coins]. */
function series(idBase, stat, mode, cat, rows, cmp) {
  return rows.map((r, i) => ({
    id: `${idBase}_${i + 1}`,
    name: r[1], desc: r[2], coins: r[3],
    stat, goal: r[0], mode, cat,
    ...(cmp ? { cmp } : {}),
  }));
}

export const ACHIEVEMENTS = [

  /* ================= DESCENT — distance in a single run (10) ================= */
  ...series('d_dist', 'distBest', 'descent', 'Distance', [
    [250,   'Dropping In',        'Reach 250 m in one descent',            60],
    [500,   'Finding the Line',   'Reach 500 m in one descent',           100],
    [1000,  'Kilometre Club',     'Reach 1,000 m in one descent',         180],
    [1500,  'Committed',          'Reach 1,500 m in one descent',         260],
    [2500,  'Long Hauler',        'Reach 2,500 m in one descent',         420],
    [4000,  'Deep Mountain',      'Reach 4,000 m in one descent',         650],
    [6000,  'No Brakes',          'Reach 6,000 m in one descent',         900],
    [8500,  'Beyond the Treeline','Reach 8,500 m in one descent',        1300],
    [12000, 'Mountain Eater',     'Reach 12,000 m in one descent',       1900],
    [18000, 'The Long Redline',   'Reach 18,000 m in one descent',       3000],
  ]),

  /* ================= DESCENT — combo chain (9) ================= */
  ...series('d_combo', 'comboBest', 'descent', 'Chain', [
    [2,  'Linked',           'Build a ×2 combo',                  60],
    [4,  'Rhythm',           'Build a ×4 combo',                 120],
    [6,  'In the Pocket',    'Build a ×6 combo',                 200],
    [9,  'Untouchable Flow', 'Build a ×9 combo',                 340],
    [12, 'Chain Reaction',   'Build a ×12 combo',                520],
    [16, 'Locked In',        'Build a ×16 combo',                760],
    [20, 'Trance State',     'Build a ×20 combo',               1100],
    [26, 'Machine Precision','Build a ×26 combo',               1700],
    [34, 'The Perfect Line', 'Build a ×34 combo',               2600],
  ]),

  /* ================= DESCENT — airtime in a single run (8) ================= */
  ...series('d_hang', 'hangBest', 'descent', 'Air', [
    [3,   'Wheels Up',      'Log 3 s of airtime in one run',      70],
    [6,   'Hang Time',      'Log 6 s of airtime in one run',     130],
    [10,  'Loft',           'Log 10 s of airtime in one run',    230],
    [16,  'Sky Rider',      'Log 16 s of airtime in one run',    380],
    [24,  'Low Orbit',      'Log 24 s of airtime in one run',    600],
    [35,  'Weightless',     'Log 35 s of airtime in one run',    900],
    [50,  'Gravity Optional','Log 50 s of airtime in one run',  1400],
    [70,  'Ghost in the Air','Log 70 s of airtime in one run',  2200],
  ]),

  /* ================= DESCENT — style score in a single run (7) ================= */
  ...series('d_score', 'scoreBest', 'descent', 'Style', [
    [500,   'Noticed',        'Score 500 style in one run',        80],
    [1500,  'Showing Off',    'Score 1,500 style in one run',     160],
    [3500,  'Style Merchant', 'Score 3,500 style in one run',     300],
    [7000,  'Highlight Reel', 'Score 7,000 style in one run',     520],
    [12000, 'Crowd Pleaser',  'Score 12,000 style in one run',    850],
    [20000, 'Feed the Eye',   'Score 20,000 style in one run',   1400],
    [35000, 'Legend of the Line','Score 35,000 style in one run',2400],
  ]),

  /* ================= DESCENT — perfect landings in a run (6) ================= */
  ...series('d_perfect', 'perfectRun', 'descent', 'Landing', [
    [1,  'Line Locked',      'Land 1 perfect landing in a run',    70],
    [3,  'Sticking It',      'Land 3 perfect landings in a run',  140],
    [6,  'Clean Hands',      'Land 6 perfect landings in a run',  260],
    [10, 'Surgical',         'Land 10 perfect landings in a run', 460],
    [16, 'Metronome',        'Land 16 perfect landings in a run', 760],
    [25, 'Flawless Descent', 'Land 25 perfect landings in a run',1300],
  ]),

  /* ================= DESCENT — flips in a run (6) ================= */
  ...series('d_flip', 'flipRun', 'descent', 'Tricks', [
    [1,  'First Rotation', 'Land 1 flip in a run',      70],
    [3,  'Loose Screw',    'Land 3 flips in a run',    150],
    [6,  'Tumbler',        'Land 6 flips in a run',    280],
    [10, 'Spin Doctor',    'Land 10 flips in a run',   480],
    [16, 'Blender',        'Land 16 flips in a run',   800],
    [24, 'Physics Denier', 'Land 24 flips in a run',  1300],
  ]),

  /* ================= DESCENT — near misses in a run (6) ================= */
  ...series('d_near', 'nearRun', 'descent', 'Nerve', [
    [3,  'Close Shave',      'Get 3 near misses in a run',    70],
    [8,  'Dancing',          'Get 8 near misses in a run',   150],
    [15, 'Paint Scraper',    'Get 15 near misses in a run',  280],
    [25, 'Threading Needles','Get 25 near misses in a run',  480],
    [40, 'Death Wish',       'Get 40 near misses in a run',  800],
    [60, 'Inches from Gone', 'Get 60 near misses in a run', 1300],
  ]),

  /* ================= DESCENT — dodged Overseer strikes in a run (5) ================= */
  ...series('d_dodge', 'dodgeRun', 'descent', 'Overseer', [
    [1,  'Seen and Survived','Dodge 1 Overseer strike in a run',    90],
    [3,  'Not Today',        'Dodge 3 Overseer strikes in a run',  200],
    [6,  'Unblinking',       'Dodge 6 Overseer strikes in a run',  400],
    [10, 'Staring Back',     'Dodge 10 Overseer strikes in a run', 700],
    [16, 'The Eye Blinks',   'Dodge 16 Overseer strikes in a run',1200],
  ]),

  /* ================= DESCENT — top speed (5) ================= */
  ...series('d_speed', 'speedBest', 'descent', 'Speed', [
    [30, 'Rolling',       'Hit 30 m/s',   90],
    [45, 'Quick',         'Hit 45 m/s',  200],
    [60, 'Redlining',     'Hit 60 m/s',  400],
    [75, 'Terminal',      'Hit 75 m/s',  750],
    [90, 'Escape Velocity','Hit 90 m/s',1400],
  ]),

  /* ================= DESCENT — survival time (5) ================= */
  ...series('d_time', 'timeBest', 'descent', 'Endurance', [
    [30,  'Still Alive',    'Survive 30 s in one run',    80],
    [60,  'One Minute Down','Survive 60 s in one run',   160],
    [120, 'Marathon Legs',  'Survive 2 minutes in one run',330],
    [240, 'Iron Nerve',     'Survive 4 minutes in one run',700],
    [420, 'The Long Sit',   'Survive 7 minutes in one run',1400],
  ]),

  /* ================= ASCENT — summits (9) ================= */
  ...series('a_summit', 'summits', 'ascent', 'Summit', [
    [1,   'Top of Verdant',  'Reach the summit for the first time',   250],
    [3,   'Repeat Climber',  'Summit 3 times',                        400],
    [7,   'Mountain Regular','Summit 7 times',                        700],
    [15,  'Trail Worn',      'Summit 15 times',                      1200],
    [30,  'Peak Bagger',     'Summit 30 times',                      1900],
    [50,  'The Climb Is Home','Summit 50 times',                     2800],
    [80,  'Verdant Veteran', 'Summit 80 times',                      3600],
    [120, 'Written in Stone','Summit 120 times',                     4000],
    [200, 'Mountain Made',   'Summit 200 times',                     4000],
  ]),

  /* ================= ASCENT — altitude in a single climb (8) ================= */
  ...series('a_alt', 'altBest', 'ascent', 'Altitude', [
    [50,  'Foothills',      'Reach 50 m altitude in one climb',   80],
    [120, 'Above the Pines','Reach 120 m altitude in one climb', 160],
    [200, 'Steep Ground',   'Reach 200 m altitude in one climb', 300],
    [280, 'Thin Air',       'Reach 280 m altitude in one climb', 500],
    [340, 'The Shoulder',   'Reach 340 m altitude in one climb', 800],
    [390, 'Summit Ridge',   'Reach 390 m altitude in one climb',1200],
    [415, 'So Close',       'Reach 415 m altitude in one climb',1600],
    [420, 'Full Height',    'Reach the true summit altitude',   2200],
  ]),

  /* ================= ASCENT — checkpoints banked (7) ================= */
  ...series('a_cp', 'checkpoints', 'ascent', 'Progress', [
    [1,   'First Anchor',   'Bank 1 checkpoint',      80],
    [5,   'Getting Higher', 'Bank 5 checkpoints',    170],
    [15,  'Steady Hands',   'Bank 15 checkpoints',   330],
    [35,  'Route Knowledge','Bank 35 checkpoints',   600],
    [70,  'Every Ledge',    'Bank 70 checkpoints',  1000],
    [130, 'Muscle Memory',  'Bank 130 checkpoints', 1700],
    [220, 'The Mountain Knows You','Bank 220 checkpoints',2600],
  ]),

  /* ================= ASCENT — fastest summit (5, lower is better) ================= */
  ...series('a_fast', 'summitFastT', 'ascent', 'Speed Climb', [
    [240, 'Efficient Ascent','Summit in under 4 minutes',   400],
    [180, 'Quick Climber',   'Summit in under 3 minutes',   700],
    [140, 'No Wasted Moves', 'Summit in under 2:20',       1200],
    [110, 'Rocket Ascent',   'Summit in under 1:50',       1900],
    [90,  'Speedrun',        'Summit in under 1:30',       2800],
  ], 'lte'),

  /* ================= ASCENT — lifetime altitude climbed (5) ================= */
  ...series('a_alttot', 'altTotal', 'ascent', 'Altitude', [
    [1000,  'Vertical Kilometre','Climb 1,000 m total',      150],
    [5000,  'Serious Vert',      'Climb 5,000 m total',      400],
    [15000, 'Skyward',           'Climb 15,000 m total',     900],
    [40000, 'Above the Clouds',  'Climb 40,000 m total',    1800],
    [90000, 'Orbital Climber',   'Climb 90,000 m total',    3000],
  ]),

  /* ================= LIFETIME — runs played (7) ================= */
  ...series('l_runs', 'runs', 'any', 'Career', [
    [1,    'First Blood',   'Finish your first run',        60],
    [10,   'Getting Serious','Finish 10 runs',              140],
    [50,   'Regular',       'Finish 50 runs',               350],
    [150,  'Committed Rider','Finish 150 runs',             700],
    [400,  'Obsessed',      'Finish 400 runs',             1400],
    [800,  'Lifer',         'Finish 800 runs',             2200],
    [1500, 'The Mountain Is Yours','Finish 1,500 runs',    3400],
  ]),

  /* ================= LIFETIME — distance travelled (8) ================= */
  ...series('l_dist', 'distTotal', 'any', 'Odometer', [
    [2000,    'Warmed Up',      'Travel 2 km in total',        80],
    [10000,   'Ten Down',       'Travel 10 km in total',      180],
    [50000,   'Fifty Klick',    'Travel 50 km in total',      400],
    [150000,  'Long Distance',  'Travel 150 km in total',     800],
    [400000,  'Cross Country',  'Travel 400 km in total',    1500],
    [1000000, 'Megametre',      'Travel 1,000 km in total',  2400],
    [3000000, 'Endless Descent','Travel 3,000 km in total',  4000],
  ]),

  /* ================= LIFETIME — airtime (6) ================= */
  ...series('l_hang', 'hangTotal', 'any', 'Air', [
    [60,    'A Minute Airborne','Log 1 minute of total airtime',  100],
    [300,   'Five Up',          'Log 5 minutes of total airtime', 250],
    [900,   'Quarter Hour Up',  'Log 15 minutes of total airtime',500],
    [2400,  'Frequent Flyer',   'Log 40 minutes of total airtime',1000],
    [9000,  'Mostly Airborne',  'Log 2.5 hours of total airtime', 3000],
  ]),

  /* ================= LIFETIME — perfect landings (6) ================= */
  ...series('l_perf', 'perfectTotal', 'any', 'Landing', [
    [10,   'Ten Clean',     'Land 10 perfect landings',      100],
    [50,   'Half a Hundred','Land 50 perfect landings',      240],
    [200,  'Precision Habit','Land 200 perfect landings',    500],
    [800,  'Landing Machine','Land 800 perfect landings',   1900],
    [3500, 'Perfection Itself','Land 3,500 perfect landings',3200],
  ]),

  /* ================= LIFETIME — style banked (5) ================= */
  ...series('l_score', 'scoreTotal', 'any', 'Style', [
    [10000,   'Style Starter',  'Bank 10,000 lifetime style',   120],
    [75000,   'Style Investor', 'Bank 75,000 lifetime style',   350],
    [300000,  'Style Baron',    'Bank 300,000 lifetime style',  800],
    [1000000, 'Style Millionaire','Bank 1,000,000 lifetime style',3200],
  ]),

  /* ================= LIFETIME — coins earned (5) ================= */
  ...series('l_coin', 'coinsEarned', 'any', 'Wealth', [
    [1000,   'Pocket Change','Earn 1,000 coins',       80],
    [10000,  'Saving Up',    'Earn 10,000 coins',     200],
    [50000,  'Well Funded',  'Earn 50,000 coins',     500],
    [200000, 'Rich Rider',   'Earn 200,000 coins',   1200],
    [600000, 'Redline Tycoon','Earn 600,000 coins',  2600],
  ]),

  /* ================= LIFETIME — flips (4) ================= */
  ...series('l_flip', 'flipTotal', 'any', 'Tricks', [
    [25,   'Rotator',      'Land 25 flips',      120],
    [150,  'Flip Habit',   'Land 150 flips',     320],
    [600,  'Airborne Acrobat','Land 600 flips',  800],
    [2000, 'Spin Cycle',   'Land 2,000 flips',  1900],
  ]),

  /* ================= LIFETIME — near misses (4) ================= */
  ...series('l_near', 'nearTotal', 'any', 'Nerve', [
    [50,   'Brushing Past','Get 50 near misses',      120],
    [300,  'Risk Taker',   'Get 300 near misses',     320],
    [1200, 'Adrenaline Junkie','Get 1,200 near misses',800],
    [4000, 'Allergic to Safety','Get 4,000 near misses',1900],
  ]),

  /* ================= LIFETIME — clean runs, no stumbles (4) ================= */
  ...series('l_clean', 'cleanRuns', 'any', 'Discipline', [
    [1,   'Spotless',      'Finish a run without stumbling',   150],
    [10,  'Consistent',    'Finish 10 runs without stumbling', 400],
    [40,  'Unshakeable',   'Finish 40 runs without stumbling',1000],
    [120, 'Never Falters', 'Finish 120 runs without stumbling',2200],
  ]),

  /* ================= LIFETIME — days played (4) ================= */
  ...series('l_days', 'days', 'any', 'Loyalty', [
    [2,  'Came Back',     'Play on 2 different days',    100],
    [7,  'A Week In',     'Play on 7 different days',    350],
    [30, 'A Month Deep',  'Play on 30 different days',  1100],
    [100,'Hundred Days',  'Play on 100 different days', 3000],
  ]),
];

/** Total coins available if every achievement is completed. */
export const TOTAL_COINS = ACHIEVEMENTS.reduce((n, a) => n + a.coins, 0);

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Ordered category list for the UI, in catalogue order. */
export const CATEGORIES = [...new Set(ACHIEVEMENTS.map((a) => a.cat))];

/** true when `stats` satisfies achievement `a`. */
export function isEarned(a, stats) {
  const v = +(stats && stats[a.stat]) || 0;
  if (a.cmp === 'lte') return v > 0 && v <= a.goal;   // times: 0 means "never done it"
  return v >= a.goal;
}

export default ACHIEVEMENTS;
