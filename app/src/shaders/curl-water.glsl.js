// Water velocity field: Bridson-bounded curl noise plus a bulk slosh term.
// Expects snoise() (noise.glsl.js) to be defined before it.
import { GLOBE } from '../config.js';

export const curlWaterGLSL = /* glsl */ `
uniform float uTime, uStir, uNoiseScale, uFlowAmp;
uniform vec3 uBulk;

// Bridson's smooth ramp: 1 far from the wall, 0 on it.
float ramp(float r){
  if (r >= 1.0) return 1.0;
  if (r <= -1.0) return -1.0;
  float r2 = r * r;
  return r * (15.0/8.0 - r2 * (10.0/8.0 - r2 * (3.0/8.0)));
}

vec3 rawPotential(vec3 q){
  return vec3(snoise(q),
              snoise(q + vec3(31.416, -47.853, 12.793)),
              snoise(q + vec3(-233.145, -113.408, -185.31)));
}

// Vector potential, with its tangential part ramped to zero at the sphere wall
// (psi' = a*psi + (1-a) n (n.psi)), so the curl has no normal component there.
vec3 potential(vec3 p){
  vec3 q = p * uNoiseScale + vec3(0.0, -uTime * 0.12, uTime * 0.05);
  vec3 psi = rawPotential(q);
  float r = length(p);
  vec3 n = p / max(r, 1e-4);
  float a = ramp((${GLOBE.RIN.toFixed(4)} - r) / 0.28);
  return a * psi + (1.0 - a) * n * dot(n, psi);
}

vec3 curlNoise(vec3 p){
  const float e = 0.004;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 px0 = potential(p - dx), px1 = potential(p + dx);
  vec3 py0 = potential(p - dy), py1 = potential(p + dy);
  vec3 pz0 = potential(p - dz), pz1 = potential(p + dz);
  vec3 c = vec3((py1.z - py0.z) - (pz1.y - pz0.y),
                (pz1.x - pz0.x) - (px1.z - px0.z),
                (px1.y - px0.y) - (py1.x - py0.x));
  return c / (2.0 * e * uNoiseScale);
}

vec3 waterVelocity(vec3 p){
  vec3 u = curlNoise(p) * (uStir * uFlowAmp);
  // bulk slosh, with its wall-normal part removed near the glass
  float r = length(p);
  vec3 n = p / max(r, 1e-4);
  float a = clamp((${GLOBE.RIN.toFixed(4)} - r) / 0.28, 0.0, 1.0);
  vec3 b = uBulk - (1.0 - a) * n * dot(n, uBulk);
  return u + b;
}
`;
