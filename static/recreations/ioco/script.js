/* =========================================================================
   IOCO — screen transitions
   Three "screens" are absolutely-positioned on top of each other (see
   .screen in style.css). This file's only job is:
     1. Drive the full-screen pink sweep mask with a GSAP timeline.
     2. Swap which screen carries .active while the mask fully covers it.
     3. Wire up every button that requests a screen change.
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const screens = [...document.querySelectorAll('.screen')];
  const mask = document.getElementById('transitionMask');
  const maskLogo = document.getElementById('maskLogo');

  let currentScreen = 1;

  // Guards against a second click starting a new GSAP timeline while one is
  // already mid-flight — without this, rapid clicking could leave two
  // sweeps racing each other and the screen swap firing twice.
  let isAnimating = false;

  /**
   * Swaps the .active class from the current screen to `targetNumber`.
   * Called from inside the GSAP timeline via .call(), at the exact moment
   * the pink mask is fully covering the viewport, so the swap itself is
   * invisible to the user.
   */
  function setActiveScreen(targetNumber) {
    screens.forEach(screen => {
      screen.classList.toggle('active', Number(screen.dataset.screen) === targetNumber);
    });
    currentScreen = targetNumber;
    updateFooterIndex(targetNumber);
  }

  function updateFooterIndex(n) {
    document.querySelectorAll('[data-footer-index]').forEach(el => {
      el.textContent = `0${n} / 03`;
    });
  }

  /**
   * The signature sweep transition:
   *   mask slides up from top:100vh -> top:0vh (covers the screen)
   *   -> logo fades in
   *   -> brief hold, then the .active class is swapped underneath the mask
   *   -> logo fades out
   *   -> mask continues up to top:-100vh (fully off-screen at the top)
   *
   * Every tween animates `top`, never `transform`, exactly as specced — the
   * mask's resting position is also defined via `top` in CSS, so there is
   * no transform/top conflict for GSAP to fight with.
   */
  function goToScreen(targetNumber) {
    if (isAnimating || targetNumber === currentScreen) return;
    isAnimating = true;

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => { isAnimating = false; }
    });

    tl.set(mask, { top: '100vh' })                      // defensive reset — guarantees a clean start
      .to(mask, { top: '0vh', duration: 0.6 })           // sweep up to fully cover the viewport
      .to(maskLogo, { opacity: 1, duration: 0.3 }, '-=0.2') // logo fades in as the sweep finishes
      .to({}, { duration: 0.35 })                        // hold, fully covered, so the swap doesn't feel rushed
      .call(() => setActiveScreen(targetNumber))         // swap screens while hidden behind the mask
      .to(maskLogo, { opacity: 0, duration: 0.3 })        // fade the logo back out
      .to(mask, { top: '-100vh', duration: 0.6 }, '-=0.1'); // finish the sweep, clearing off the top
  }

  // Every element with data-goto="N" requests a transition to screen N.
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => goToScreen(Number(el.dataset.goto)));
  });

  // Hamburger is decorative (no menu content was specced) — it just morphs
  // into an X to acknowledge the click.
  const hamburger = document.getElementById('hamburger');
  hamburger.addEventListener('click', () => hamburger.classList.toggle('open'));

});
