// Renders benchmark results as a compact table in the side panel.
const ms = (v) => v.toFixed(2);

export function renderBenchTable(el, results) {
  const rows = results.map((r) =>
    `<tr><td>${r.count.toLocaleString()}</td><td>${ms(r.sim)}</td><td>${ms(r.interior)}</td><td>${ms(r.glass)}</td><td>${ms(r.total)}</td></tr>`,
  ).join('');
  el.innerHTML = `<table><tr><th>flakes</th><th>snow</th><th>interior</th><th>glass</th><th>frame</th></tr>${rows}</table>`
    + '<p>ms per frame, uncapped (GPU-synced)</p>';
}
