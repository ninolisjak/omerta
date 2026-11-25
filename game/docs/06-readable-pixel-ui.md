# 6. A readable pixel-art interface

The first HUD had a useful layout but its 5–11 pixel labels and low-contrast text were too hard to read. This chapter explains the black-and-white, top-down pixel redesign.

This chapter documents the original light pixel theme. The current dark skin retains these readable sizes and pixel-art principles; [Chapter 9](09-dark-mode-and-game-feedback.md) explains the night palette and new feedback.

## Save a checkpoint before a redesign

The original game was committed and pushed to `main` on GitHub as `4f81045`. The redesign was started on a separate local branch, `feat/monochrome-pixel-ui`. A branch is a named line of development: the existing checkpoint stays available while the interface changes.

Use `git status` to inspect your current branch and edits. Changing a branch changes the files on disk; avoid switching with uncommitted work unless you understand how Git will preserve it.

## Make the text readable first

| Purpose             | Size           |
| ------------------- | -------------- |
| Main descriptions   | 15–16 px       |
| Buttons             | 14–15 px       |
| Labels and metadata | At least 12 px |
| Card titles         | 24–29 px       |
| Screen titles       | 27–36 px       |

These are CSS pixels, not image pixels. Text remains HTML, so the browser can select, zoom, and announce it. The pixel-art image does not contain important labels or button text.

The body uses a system monospace font. That gives a period-console feeling without making paragraphs depend on a tiny decorative bitmap font or an external font service.

## A limited grayscale palette

Open `src/styles.css`. Dark ink is `#171717`, panels are `#fafafa`, and the page background is `#e7e7e7`. Secondary text uses a readable gray instead of a nearly invisible tint. Dark buttons have white text, while disabled buttons retain enough contrast to read their labels and explanations.

Hard borders, offset shadows, square corners, and double-frame dialogue boxes give the interface the structure of a classic handheld RPG. These elements are normal CSS and can scale without becoming blurry.

## Render pixel art deliberately

The map is an original generated image, `public/art/blackwater-pixel.png`. It depicts the same mafia city through top-down tiles rather than realistic isometric buildings. Original fedora-wearing characters, cars, docks, and shops supply the theme without copying another game's characters or locations.

```css
.city-art {
  background-image: url("/art/blackwater-pixel.png");
  image-rendering: pixelated;
}
```

`image-rendering: pixelated` asks the browser to preserve hard pixel edges during scaling. It cannot turn a photograph into authored pixel art; the source image needs the right style first.

The district markers remain buttons above the image. The selected district's description lives below the map in an RPG-style dialogue panel, so larger text does not cover buildings. The existing output event still tells the parent which screen to open.

## Reflow instead of shrinking

More readable text needs more room. When a row stops fitting, reduce columns or stack panels. The front cards become two columns on intermediate screens and one on phones. Navigation turns into a drawer at 900 pixels. The text does not shrink to compensate.

The browser smoke script visits every screen at 1920, 1440, 1024, 768, 390, and 320 pixels. It checks horizontal overflow and verifies that rendered interface text is never smaller than 12 pixels. It also follows the existing build, laundering, job, save, guide, and reset interactions.

## Try it

1. Open the fronts screen at 1920 pixels wide and inspect the description text in DevTools. It should be 15 pixels.
2. Resize to 390 pixels. Watch the cards become a single column while the descriptions remain readable.
3. Change a heading size by two pixels, then check both widths.
4. In the map component, move one marker by changing its percentage coordinates. Notice that marker placement is separate from the artwork and game rules.

This redesign changes presentation. Existing saves, prices, timers, crew assignments, and rewards use the same game engine.
