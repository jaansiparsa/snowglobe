# Snow Globe of Anything

CS184/284A (Fall 2026) final project: **project proposal**.

A real-time snow globe in the browser. Put any subject inside a glass dome (a
photo, a sketch, or a Gaussian-splat capture), then shake it with your mouse or
phone to make the snow swirl. Three graphics problems, working together in real
time:

- **Glass refraction:** refraction through the curved dome and water surface, with Fresnel reflections.
- **Snow particle physics:** a GPU particle system that settles under gravity and is stirred on shake.
- **Swirling water:** a curl-noise velocity field (stretch goal: a true fluid solver) coupled to the snow.

## Running it

No build step: the app is static ES modules with an import map (Three.js from jsDelivr).

```sh
python3 -m http.server 8000   # then open http://localhost:8000/app/
```

```
app/src/
  main.js, app.js        entry point; SnowcaseApp runs shake -> snow sim -> render each frame
  config.js              globe dimensions, floor height function, render layers
  shaders/               all GLSL: glass optics, snow sim kernels, curl-noise water,
                         simplex noise, environment, floor, snow point sprites
  sim/                   GPU particle sim: ping-pong float textures, full-screen passes
  render/                renderer setup, two-pass pipeline, glass material, snow sprites
  scene/                 camera/orbit, environment + PMREM, wooden base, snow floor, globe assembly
  subject/               image card, built-in sketches, photo/cut-out preparation
  input/                 spring shake controller, pointer drag, phone DeviceMotion (extension)
  perf/                  uncapped per-pass GPU benchmark
  ui/                    side panel bindings, fps meter, benchmark table
```

## Milestone

[`milestone.html`](milestone.html): live at https://jaansiparsa.github.io/snowglobe/milestone.html, demo at https://jaansiparsa.github.io/snowglobe/app/

## The proposal

The proposal is a single static webpage: [`index.html`](index.html).

- **Live page (GitHub Pages):** https://jaansiparsa.github.io/snowglobe/
- To produce the Gradescope PDF: open the page in Safari and use **Print → Save as PDF**
  (not File → Export as PDF). The print stylesheet expands links so they stay clickable.

## Team

Four team members. See the proposal page (placeholders to be filled in before submission).
