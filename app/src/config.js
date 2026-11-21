// Geometry and render-layer constants shared by the JS scene and the GLSL.
// Everything inside the globe lives in the globe's local frame (centre = origin,
// outer glass radius = 1).

export const GLOBE = {
  R: 1.0,             // outer radius of the glass dome
  RIN: 0.955,         // inner radius (glass is 4.5% of the radius thick); the water fills this
  FLOOR_BASE: -0.6,   // height of the snowy floor at its rim
  FLOOR_BUMP: 0.09,   // height of the mound in the middle
  FLOOR_FALLOFF: 3.5,
};

// Render layer for everything inside the water (drawn in the interior pass).
export const INTERIOR_LAYER = 1;

export function floorY(x, z) {
  return GLOBE.FLOOR_BASE + GLOBE.FLOOR_BUMP * Math.exp(-(x * x + z * z) * GLOBE.FLOOR_FALLOFF);
}

// Radius where the floor surface meets the inner sphere (fixed-point iteration).
export function floorRimRadius() {
  let rho = 0.7;
  for (let i = 0; i < 30; i++) {
    const y = floorY(rho, 0);
    rho = Math.sqrt(Math.max(GLOBE.RIN * GLOBE.RIN - y * y, 0));
  }
  return rho;
}
