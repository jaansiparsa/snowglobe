// Height of the snowy floor inside the globe (mirrors floorY() in config.js).
import { GLOBE } from '../config.js';

export const floorGLSL = /* glsl */ `
float floorY(vec2 xz){
  return ${GLOBE.FLOOR_BASE.toFixed(4)} + ${GLOBE.FLOOR_BUMP.toFixed(4)} * exp(-dot(xz, xz) * ${GLOBE.FLOOR_FALLOFF.toFixed(4)});
}
`;
