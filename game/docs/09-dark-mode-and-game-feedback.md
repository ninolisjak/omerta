# 9. Dark mode and a city with movement

The interface keeps the monochrome pixel-art direction while changing its surfaces to charcoal and graphite. Readable type and strong contrast remain the foundation: body descriptions stay around 15–16 pixels, with no interface text below 12 pixels.

## Separate layout from the night skin

`src/styles.css` owns the existing layout, spacing, and responsive breakpoints. `src/dark.css` loads after it in `angular.json` and supplies the dark palette, Family layouts, progress bars, rewards, and animations. The city component uses shared palette variables for readable map descriptions and controls.

The skin uses neutral grays. The original pixel image is reused; CSS darkens it for night without replacing the source asset. The founding and headquarters art are crops of that same image.

## Give progress a visible destination

- The first-night checklist derives completion from real game state.
- The Family level strip follows you between screens and shows XP and treasury balance.
- Contract cards show objective progress, rewards, requirements, and claim state.
- Headquarters tiers use filled pips so upgrades remain visible after purchase.
- Operation completion and Family level-ups display short reward notifications.

These displays use the existing signals and game state. They do not pretend that online players or world events exist.

## Decorative motion versus simulation

The city has decorative walking figures, a moving car, rain, window flicker, and chimney smoke. These are CSS animations over the pixel image, not additional simulated units or a collision system. The “operations in motion” count is actual queued work; otherwise the map displays a general city-atmosphere label.

The XP bar uses a slow shimmer and animates when its width changes. The store compares old and new snapshots to show a notification when work completes or the Family reaches a new level. It does not announce every timer tick.

## Make motion optional

Settings' **Atmosphere motion** switch adds the `still` class, which stops animations and transitions, including pseudo-elements. The system's `prefers-reduced-motion` preference does the same automatically. Reduced motion does not change timers, rewards, or Family progression.

Rain sound remains a separate opt-in control. No audio starts automatically. Atmosphere settings are session preferences in this prototype.

## Verify the experience

The browser smoke script checks the existing solo flow, Family creation, jobs and XP, a level-up, a contract claim, a headquarters upgrade, a treasury contribution, and persisted progress after reload. It checks founding and active Family layouts across six widths, and checks that the motion toggle and system preference actually stop animations.

## Try it

Find `@keyframes city-drive` in `dark.css`. Increase the animation duration and see how the street feels. Turn motion off, then simulate reduced motion in your browser tools. The entire city should stay still while game timers continue working.
