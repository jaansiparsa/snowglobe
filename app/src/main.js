// Entry point: build the app, hook up the UI, run the loop.
import { SnowcaseApp } from './app.js';
import { bindPanel } from './ui/panel.js';
import { FpsMeter } from './ui/fps-meter.js';

const MAX_DT = 1 / 30;   // clamp long frames (tab switches) so the sim never explodes

const app = new SnowcaseApp(document.getElementById('c'));
window.snowcase = app;   // handy for debugging / benchmarks from the console

const resize = () => app.resize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', resize);
resize();

bindPanel(app);

const fps = new FpsMeter(document.getElementById('fps'));
let last = performance.now();
app.renderer.setAnimationLoop((now) => {
  const dt = Math.min((now - last) / 1000, MAX_DT);
  last = now;
  if (app.paused) return;
  app.controls.update();
  app.frame(dt);
  fps.tick(dt, now, app.sim.count);
});
