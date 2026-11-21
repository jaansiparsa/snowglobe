// Uncapped GPU cost per frame and per pass, independent of vsync.
// For each pass we issue K back-to-back iterations, then force a sync with a
// 1-pixel readback of that pass's output and divide wall time by K.
import * as THREE from 'three';

const K = 20;
export const BENCH_SIZES = [64, 128, 256, 512];

function syncRead(renderer, target) {
  if (!target) {
    const gl = renderer.getContext();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    return;
  }
  const buf = target.texture.type === THREE.HalfFloatType ? new Uint16Array(4) : new Float32Array(4);
  renderer.readRenderTargetPixels(target, 0, 0, 1, 1, buf);
}

function time(renderer, target, fn) {
  syncRead(renderer, target);
  const t0 = performance.now();
  for (let i = 0; i < K; i++) fn();
  syncRead(renderer, target);
  return (performance.now() - t0) / K;
}

const best = (renderer, target, fn) =>
  Math.min(time(renderer, target, fn), time(renderer, target, fn), time(renderer, target, fn));

const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

export async function runBenchmark(app, sizes = BENCH_SIZES, onProgress = () => {}) {
  const prevSize = app.sim.size;
  const { renderer, pipeline } = app;
  app.paused = true;
  const results = [];
  for (const size of sizes) {
    onProgress(`${(size * size).toLocaleString()} flakes…`);
    app.setParticleSize(size);
    app.shake.stir = 2;                     // keep it swirling: worst case
    for (let i = 0; i < 20; i++) { app.frame(1 / 60); await nextFrame(); }
    const sim = best(renderer, app.sim.positionTarget, () => { app.shake.stir = 2; app.stepSim(1 / 60); });
    const interior = best(renderer, pipeline.interiorRT, () => pipeline.renderInterior());
    const glass = best(renderer, null, () => pipeline.renderMain());
    const total = best(renderer, null, () => { app.shake.stir = 2; app.frame(1 / 60); });
    results.push({ count: size * size, sim, interior, glass, total, fps: 1000 / total });
    await nextFrame();
  }
  app.setParticleSize(prevSize);
  app.paused = false;
  return results;
}
