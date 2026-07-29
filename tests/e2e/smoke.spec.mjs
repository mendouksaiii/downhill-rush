/* End-to-end smoke test — the gate the unit tests could never be.
 *
 * The existing suite greps play.html for source patterns. That pins "this line
 * exists", not "the game works", which is why a string of functional bugs
 * shipped to production and were found by players rather than by CI:
 *
 *   #45  PLAY did nothing — an ID selector outranked .overlay.hidden, so the
 *        title overlay could never hide. The run started underneath it.
 *   #48  Every new player was locked out — the gate required a valid email and
 *        validEmail('') is false. Desktop hid it; a fresh device could not play.
 *   #56  The sign-in card was pushed out of the viewport by a 7th menu item,
 *        and achievements were unreachable on phones.
 *
 * Each test below fails on one of those. They boot the real game and drive the
 * real UI, with NO seeded profile unless the case is specifically about a
 * returning player — seeded storage is what let #48 hide for days.
 */
import { test, expect } from '@playwright/test';

const BOOT_TIMEOUT = 120_000;

/** Load the game and wait for the module to finish booting (Rapier WASM + Three). */
async function boot(page, url = '/play.html') {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // window.DR is exposed on localhost, and only after the module fully initialises
  await page.waitForFunction(() => typeof window.DR === 'object', null, { timeout: BOOT_TIMEOUT });
}

/** Seed a returning player BEFORE any page script runs. */
async function seedReturningPlayer(page, name = 'CIRider') {
  await page.addInitScript((n) => {
    localStorage.setItem('dr_name', n);
    localStorage.setItem('dr_tutorial_seen_v1', '1');
    localStorage.setItem('dr_acct', JSON.stringify({
      name: n, email: '', coins: 5000,
      owned: { riders: ['rookie'], bikes: ['sunset'] },
      equipped: { riders: 'rookie', bikes: 'sunset' },
    }));
  }, name);
}

/* A first-time player gets the tutorial pushed at them ~350ms after boot, and
   again if they press PLAY before it has been seen. Dismiss it the way a real
   player would rather than reaching past it. */
async function dismissTutorial(page) {
  const skip = page.locator('#tutSkip');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await expect(page.locator('#tutorial')).toBeHidden();
  }
}

/** Drive the run to its end using the deterministic debug stepper. */
async function rideUntilCrash(page) {
  await page.evaluate(() => {
    let n = 0;
    while (window.DR.state === 'riding' && n < 12000) { window.DR.step(0.016); n++; }
  });
}

test.describe('critical path', () => {
  test('a brand-new player can start a run @regression-48 @regression-45', async ({ page }) => {
    // Deliberately NO seeded profile: this is the exact state that was broken.
    await boot(page);
    await page.waitForTimeout(700);   // let the auto-tutorial appear
    await dismissTutorial(page);

    const start = page.locator('#startBtn');
    await expect(start, 'a fresh player has no name yet, so PLAY starts disabled')
      .toBeDisabled();

    // type a name and leave EMAIL empty — email is optional by design
    await page.locator('#nameInput').fill('CIFresh');
    await page.locator('#nameInput').dispatchEvent('input');

    await expect(start, 'PLAY must enable on a valid name with NO email (bug #48)')
      .toBeEnabled({ timeout: 20_000 });

    await start.click();
    await dismissTutorial(page);   // in case PLAY re-opens it

    // bug #45: the overlay must actually hide, not just gain a class
    await expect(page.locator('#title'), 'the title overlay must hide when the run starts')
      .toBeHidden({ timeout: 20_000 });
    await expect
      .poll(() => page.evaluate(() => window.DR.state), { timeout: 20_000 })
      .toBe('riding');
  });

  test('a run reaches the death panel and returns home', async ({ page }) => {
    await seedReturningPlayer(page);
    await boot(page);

    await page.locator('#startBtn').click();
    await expect.poll(() => page.evaluate(() => window.DR.state)).toBe('riding');

    await rideUntilCrash(page);

    // showDeath() fires from the render loop, so this needs real frames
    await expect(page.locator('#death'), 'the death panel must appear after a crash')
      .toBeVisible({ timeout: 20_000 });
    await expect(page.locator('#dDist')).not.toHaveText('0 m');

    await page.locator('#homeBtn').click();
    await expect(page.locator('#title')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.DR.state)).toBe('title');
  });

  test('the page loads without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // /api/* and Vercel analytics only exist on the deployed site
      const t = m.text();
      if (/\/api\/|_vercel|favicon|Failed to load resource/.test(t)) return;
      errors.push(`console: ${t}`);
    });
    await seedReturningPlayer(page);
    await boot(page);
    await page.waitForTimeout(2000);
    expect(errors, `unexpected console errors:\n${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('home screen layout', () => {
  test('the sign-in card is fully on screen @regression-56', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'desktop layout only');
    await boot(page);   // fresh: the sign-in card is the thing a new player needs

    const geom = await page.evaluate(() => {
      const R = (id) => document.getElementById(id).getBoundingClientRect();
      const su = R('signup'), name = R('nameInput'), email = R('emailInput'), bar = R('loadoutBar');
      const inView = (r) => r.top >= 0 && r.bottom <= window.innerHeight + 1;
      return {
        card: inView(su), name: inView(name), email: inView(email),
        overlapsLoadout: !(email.bottom <= bar.top || bar.bottom <= email.top),
      };
    });
    // a 7th menu item once pushed this past the fixed-height shell, where
    // #title's overflow:hidden silently ate it
    expect(geom.name, 'the username field must be visible').toBe(true);
    expect(geom.email, 'the email field must be visible').toBe(true);
    expect(geom.overlapsLoadout, 'the sign-in must not collide with the loadout bar').toBe(false);
  });

  test('no horizontal overflow', async ({ page }) => {
    await seedReturningPlayer(page);
    await boot(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'the page must never scroll sideways').toBeLessThanOrEqual(0);
  });
});

test.describe('navigation', () => {
  test('every home destination opens @regression-56', async ({ page }, testInfo) => {
    await seedReturningPlayer(page);
    await boot(page);

    const mobile = testInfo.project.name === 'mobile';
    // phones hide the desktop menu rows — those destinations live in the tab bar
    const nav = (screen) => mobile
      ? page.locator(`#mTabs [data-go="${screen}"]`)
      : page.locator(`.mainMenu [data-go="${screen}"]`);

    for (const screen of ['board', 'contracts', 'achv', 'howto', 'settings']) {
      const link = nav(screen);
      // howto/settings are not in the mobile tab bar; reach them via YOU -> settings
      if (mobile && !(await link.count())) continue;
      await link.first().click();
      await expect(page.locator(`.scr[data-scr="${screen}"]`),
        `${screen} should open on ${testInfo.project.name}`).toHaveClass(/\bon\b/);
      await page.locator(`.scr[data-scr="${screen}"] [data-go="home"]`).first().click();
      await expect(page.locator('.scr[data-scr="home"]')).toHaveClass(/\bon\b/);
    }
  });

  test('achievements are reachable and populated @regression-56', async ({ page }, testInfo) => {
    await seedReturningPlayer(page);
    await boot(page);

    const mobile = testInfo.project.name === 'mobile';
    // on phones this MUST be the tab bar: the menu row is display:none there,
    // which is exactly how achievements went missing on mobile
    const entry = mobile
      ? page.locator('#mTabs [data-go="achv"]')
      : page.locator('.mainMenu [data-go="achv"]');
    await expect(entry, 'achievements must have an entry point on this platform').toHaveCount(1);
    await entry.click();

    await expect(page.locator('.scr[data-scr="achv"]')).toHaveClass(/\bon\b/);
    await expect(page.locator('#achList .achItem')).toHaveCount(150);
  });

  test('the mobile tab bar fits and tracks the active screen', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile layout only');
    await seedReturningPlayer(page);
    await boot(page);

    const tabs = page.locator('#mTabs .mTab');
    await expect(tabs).toHaveCount(6);

    // labels must not wrap onto a second line at phone width
    const wrapped = await page.evaluate(() => [...document.querySelectorAll('#mTabs .mTab span')]
      .some((s) => s.getBoundingClientRect().height > 14));
    expect(wrapped, 'tab labels must not wrap').toBe(false);

    await page.locator('#mTabs [data-go="board"]').click();
    const active = await page.evaluate(() => [...document.querySelectorAll('#mTabs .mTab')]
      .filter((t) => t.classList.contains('on')).map((t) => t.dataset.go));
    expect(active, 'the active tab must follow the screen').toEqual(['board']);
  });
});
