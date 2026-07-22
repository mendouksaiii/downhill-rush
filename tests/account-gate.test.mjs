/* Account-gate contract.
 *
 * Regression guard for the "game isn't playing on mobile" lockout: email is
 * optional by design (the signup hint says so), but the gate once required
 * validEmail() on the raw field, and validEmail('') is false. A fresh device
 * has no saved identity, so every new player -- which on phones is everyone --
 * had PLAY NOW permanently disabled.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../play.html', import.meta.url), 'utf8');

function functionBody(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') depth--;
    if (depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated function ${name}`);
}

test('empty email passes the start gate (email is optional)', () => {
  const gate = functionBody('refreshAccountGate');
  const emailOkLine = gate.match(/const emailOk\s*=[^;]+;/);
  assert.ok(emailOkLine, 'missing emailOk in refreshAccountGate');
  assert.match(
    emailOkLine[0],
    /!emailTyped/,
    'emailOk must treat an EMPTY email as ok -- validEmail("") is false, so ' +
      'without this every new player (any fresh device) is locked out of PLAY'
  );
});

test('username availability checks cannot hang the gate forever', () => {
  const check = functionBody('checkUsernameAvailability');
  const fetches = check.match(/await fetch\(/g) || [];
  const timeouts = check.match(/AbortSignal\.timeout\(/g) || [];
  assert.ok(fetches.length >= 1, 'expected fetches in checkUsernameAvailability');
  assert.equal(
    timeouts.length,
    fetches.length,
    'every fetch in the availability check needs a timeout: a stalled cold ' +
      "start otherwise pins accountStatus at 'checking' and PLAY stays disabled"
  );
});

test('claimed-name protection is intact', () => {
  const gate = functionBody('refreshAccountGate');
  // the email-optional fix must not weaken the actual protection: taking a
  // name that has an email on file still requires typing that email
  assert.match(gate, /claimed-email/, 'claimed-email handling missing');
  assert.match(
    gate,
    /nameAllowed\s*=\s*isReturning\s*\|\|/,
    'nameAllowed must still gate on account status'
  );
});
