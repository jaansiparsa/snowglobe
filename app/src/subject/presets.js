// Built-in sketches, drawn procedurally on transparent canvases.

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function drawPine() {
  const [c, g] = canvas(512, 640);
  g.lineJoin = 'round';
  g.fillStyle = '#5b3a24';
  g.fillRect(232, 520, 48, 100);
  const tiers = [[256, 70, 120, 230], [256, 170, 170, 360], [256, 280, 215, 520]];
  for (const [x, top, half, bot] of tiers) {
    g.fillStyle = '#1f5a3a';
    g.beginPath(); g.moveTo(x, top); g.lineTo(x + half, bot); g.lineTo(x - half, bot); g.closePath(); g.fill();
    g.strokeStyle = '#123c26'; g.lineWidth = 6; g.stroke();
    // snow on the tier
    g.fillStyle = '#f7f9fc';
    g.beginPath(); g.moveTo(x, top + 4);
    g.lineTo(x + half * 0.35, top + (bot - top) * 0.35);
    for (let i = 0; i <= 6; i++) {
      const t = 0.35 - (0.7 * i) / 6;
      g.quadraticCurveTo(x + half * (t + 0.06), top + (bot - top) * 0.42, x + half * t, top + (bot - top) * 0.35);
    }
    g.closePath(); g.fill();
  }
  // star
  g.fillStyle = '#f2c14e';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 16 : 38, a = -Math.PI / 2 + (i * Math.PI) / 5;
    g.lineTo(256 + r * Math.cos(a), 62 + r * Math.sin(a));
  }
  g.closePath(); g.fill();
  // lights
  const lights = ['#e8524a', '#f2c14e', '#6fb7e8', '#f5f0e6'];
  for (let i = 0; i < 26; i++) {
    const y = 150 + Math.random() * 360, w = (y - 60) * 0.42;
    g.fillStyle = lights[i % 4];
    g.beginPath(); g.arc(256 + (Math.random() * 2 - 1) * w * 0.8, y, 7, 0, Math.PI * 2); g.fill();
  }
  return c;
}

function drawCottage() {
  const [c, g] = canvas(640, 560);
  g.lineJoin = 'round';
  // walls
  g.fillStyle = '#b5523b'; g.fillRect(110, 250, 420, 290);
  g.strokeStyle = '#6e2e20'; g.lineWidth = 8; g.strokeRect(110, 250, 420, 290);
  // chimney
  g.fillStyle = '#7a6a60'; g.fillRect(420, 90, 56, 120);
  // roof with snow
  g.fillStyle = '#3d2f2a';
  g.beginPath(); g.moveTo(70, 270); g.lineTo(320, 70); g.lineTo(570, 270); g.closePath(); g.fill();
  g.fillStyle = '#f7f9fc';
  g.beginPath(); g.moveTo(52, 280); g.lineTo(320, 58); g.lineTo(588, 280);
  for (let x = 588; x >= 52; x -= 38) g.quadraticCurveTo(x - 19, 312, x - 38, 282);
  g.closePath(); g.fill();
  g.fillRect(414, 78, 68, 22);
  // door and windows (lit)
  g.fillStyle = '#4a2c1c'; g.fillRect(285, 390, 76, 150);
  g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(347, 470, 6, 0, Math.PI * 2); g.fill();
  for (const x of [160, 410]) {
    g.fillStyle = '#ffd77a'; g.fillRect(x, 340, 80, 80);
    g.strokeStyle = '#4a2c1c'; g.lineWidth = 8; g.strokeRect(x, 340, 80, 80);
    g.beginPath(); g.moveTo(x + 40, 340); g.lineTo(x + 40, 420); g.moveTo(x, 380); g.lineTo(x + 80, 380); g.stroke();
  }
  return c;
}

export const PRESETS = { pine: drawPine, cottage: drawCottage };
