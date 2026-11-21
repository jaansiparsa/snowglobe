// Turns a user image into a texture-ready canvas. Transparent PNGs (sketches,
// cut-outs) are kept as-is; opaque photos get a white print border so they
// read as a photo standing in the snow.

const MAX_TEX = 1024;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

export function hasTransparency(img) {
  const [, g] = canvas(64, 64);
  g.drawImage(img, 0, 0, 64, 64);
  const d = g.getImageData(0, 0, 64, 64).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

export function framePhoto(img) {
  const s = Math.min(1, MAX_TEX / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const b = Math.round(Math.max(w, h) * 0.045);
  const [c, g] = canvas(w + 2 * b, h + 3.2 * b);
  g.fillStyle = '#f4f2ec';
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(img, b, b, w, h);
  return c;
}

export function fitImage(img) {
  const s = Math.min(1, MAX_TEX / Math.max(img.width, img.height));
  const [c, g] = canvas(Math.round(img.width * s), Math.round(img.height * s));
  g.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

export async function loadImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return hasTransparency(img) ? fitImage(img) : framePhoto(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
