/* Overlay visibility contract.
 *
 * Regression guard for the "PLAY NOW does nothing" class of bug: the game shows
 * and hides its full-screen panels (title, death, summit, paused, tutorial,
 * profile) purely by toggling the `hidden` class. Those same elements also carry
 * ID-level layout rules -- e.g. `#title { display:block }` for the main menu.
 *
 * An ID selector (0,1,0,0) outranks `.overlay.hidden` (0,0,2,0), so a bare
 * `#id { display:... }` silently pins the overlay open. The game still runs,
 * it is just permanently covered, which reads to a player as "the game won't
 * start" and produces no console error.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');
const css = html.slice(html.indexOf('<style'), html.lastIndexOf('</style>'));

test('.overlay.hidden wins against ID-level display rules', () => {
  const rule = css.match(/\.overlay\.hidden\s*\{([^}]*)\}/);
  assert.ok(rule, 'missing .overlay.hidden rule');
  assert.match(
    rule[1],
    /display\s*:\s*none\s*!important/,
    '.overlay.hidden must use !important, otherwise any `#id { display: ... }` ' +
      'rule on an overlay outranks it and the panel can never be hidden'
  );
});

test('every element markup-tagged .overlay is toggled, not restyled', () => {
  const ids = [...html.matchAll(/id="([a-zA-Z]+)"[^>]*class="overlay/g)].map((m) => m[1]);
  assert.ok(ids.includes('title'), 'expected #title to be an overlay');
  assert.ok(ids.length >= 5, `expected the full overlay set, found ${ids.join(',')}`);

  // Any overlay carrying its own ID display rule relies on the !important above.
  // Record which ones, so the coupling is visible rather than accidental.
  const withIdDisplay = ids.filter((id) =>
    new RegExp(`#${id}\\s*\\{[^}]*display\\s*:`, 'g').test(css)
  );
  for (const id of withIdDisplay) {
    const rule = css.match(/\.overlay\.hidden\s*\{([^}]*)\}/)[1];
    assert.match(
      rule,
      /!important/,
      `#${id} sets display at ID specificity; .overlay.hidden must stay !important`
    );
  }
});

test('touch controls key off pointer type, not just the user agent', () => {
  // iPadOS reports a Macintosh UA, so a UA-only check leaves tablet players
  // with no on-screen jump button.
  assert.match(
    html,
    /const isTouchPrimary\s*=/,
    'expected an isTouchPrimary flag for touch-control gating'
  );
  assert.match(html, /matchMedia\('\(pointer:coarse\)'\)/, 'isTouchPrimary must consider coarse pointers');
  assert.match(
    html,
    /const jbOn\s*=\s*isTouchPrimary\s*&&\s*state===['"]riding['"]/,
    'the jump button must be gated on isTouchPrimary, not isMobile'
  );
});
