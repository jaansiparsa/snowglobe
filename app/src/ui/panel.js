// Wires the side panel, keyboard and drag-and-drop to the app.
import { motionSupported, enableDeviceMotion } from '../input/device-motion.js';
import { runBenchmark } from '../perf/benchmark.js';
import { renderBenchTable } from './bench-table.js';

const $ = (id) => document.getElementById(id);

function bindSubject(app) {
  document.querySelectorAll('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => app.subject.setPreset(b.dataset.preset)));
  $('file').addEventListener('change', (e) => e.target.files[0] && app.subject.setFile(e.target.files[0]));
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = [...e.dataTransfer.files].find((f) => f.type.startsWith('image/'));
    if (f) app.subject.setFile(f);
  });
}

function bindSnow(app) {
  $('count').value = String(app.sim.size);
  $('count').addEventListener('change', (e) => app.setParticleSize(+e.target.value));
  $('turb').addEventListener('input', (e) => { app.params.turbulence = +e.target.value; });
  $('shake').addEventListener('click', () => app.shake.shake());
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); app.shake.shake(); }
  });
}

function bindGlass(app) {
  const u = app.glass.material.uniforms;
  $('iorG').addEventListener('input', (e) => { u.uIorGlass.value = +e.target.value; $('iorGv').textContent = (+e.target.value).toFixed(2); });
  $('iorW').addEventListener('input', (e) => { u.uIorWater.value = +e.target.value; $('iorWv').textContent = (+e.target.value).toFixed(2); });
  $('mode').addEventListener('change', (e) => { u.uMode.value = +e.target.value; });
}

function bindMotion(app) {
  if (!motionSupported()) return;
  const btn = $('motion');
  btn.hidden = false;
  btn.addEventListener('click', async () => {
    const ok = await enableDeviceMotion(app.shake);
    btn.textContent = ok ? 'Phone shake on' : 'Motion blocked';
    btn.disabled = ok;
  });
}

function bindBenchmark(app) {
  $('bench').addEventListener('click', async () => {
    const btn = $('bench');
    btn.disabled = true;
    const results = await runBenchmark(app, undefined, (msg) => { btn.textContent = msg; });
    window.__bench = results;
    renderBenchTable($('benchOut'), results);
    btn.textContent = 'Run benchmark';
    btn.disabled = false;
    $('count').value = String(app.sim.size);
  });
}

function bindPanelToggle() {
  if (matchMedia('(max-width: 600px)').matches) document.body.classList.add('panel-closed');
  $('panelToggle').addEventListener('click', () => document.body.classList.toggle('panel-closed'));
}

// URL hooks used to make the figures in the milestone report.
function applyUrlParams(app) {
  const q = new URLSearchParams(location.search);
  if (q.has('mode')) { app.glass.material.uniforms.uMode.value = +q.get('mode'); $('mode').value = q.get('mode'); }
  if (q.has('n')) { app.setParticleSize(+q.get('n')); $('count').value = q.get('n'); }
  if (q.has('preset')) app.subject.setPreset(q.get('preset'));
  if (q.has('clean')) document.body.classList.add('clean');
}

export function bindPanel(app) {
  bindSubject(app);
  bindSnow(app);
  bindGlass(app);
  bindMotion(app);
  bindBenchmark(app);
  bindPanelToggle();
  applyUrlParams(app);
}
