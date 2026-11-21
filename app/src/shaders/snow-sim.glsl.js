// Fragment programs for the GPU snow simulation (one texel = one flake).
import { GLOBE } from '../config.js';
import { simplexGLSL } from './noise.glsl.js';
import { floorGLSL } from './floor.glsl.js';
import { curlWaterGLSL } from './curl-water.glsl.js';

export const quadVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const velFrag = /* glsl */ `
precision highp float;
uniform sampler2D uPos, uVel;
uniform float uDt, uGravity, uDrag, uRadius, uInertia;
uniform vec3 uGravityDir, uFrameAccel;
varying vec2 vUv;
${simplexGLSL}
${floorGLSL}
${curlWaterGLSL}
void main(){
  vec4 P = texture2D(uPos, vUv);
  vec3 p = P.xyz;
  float seed = P.w;
  vec3 v = texture2D(uVel, vUv).xyz;

  float h1 = fract(seed * 7.31 + 0.13);
  float h2 = fract(seed * 13.71 + 0.71);
  float k = uDrag * (0.6 + 0.8 * h1);                 // flat flakes feel more drag
  vec3 g = uGravityDir * uGravity * (0.55 + 0.9 * h2)  // net of buoyancy, varies per flake
         + uFrameAccel * uInertia;                      // pseudo-force from shaking

  // Exact solution of dv/dt = k (u - v) + g over the step (u, g held fixed):
  // unconditionally stable for any drag/time step.
  vec3 u = waterVelocity(p);
  vec3 vt = u + g / k;
  v = vt + (v - vt) * exp(-k * uDt);

  // Collisions, predicted one step ahead.
  vec3 pn = p + v * uDt;
  float lim = ${GLOBE.RIN.toFixed(4)} - uRadius;
  float r = length(pn);
  if (r > lim) {
    vec3 n = pn / r;
    float vn = dot(v, n);
    if (vn > 0.0) v -= 1.15 * vn * n;  // small bounce off the glass
    v *= 0.97;
  }
  float fy = floorY(pn.xz) + uRadius;
  if (pn.y < fy) {
    if (v.y < 0.0) v.y = 0.0;          // snow does not bounce on snow
    v.xz *= exp(-10.0 * uDt);          // and sticks where it lands
  }
  gl_FragColor = vec4(v, 0.0);
}
`;

export const posFrag = /* glsl */ `
precision highp float;
uniform sampler2D uPos, uVel;
uniform float uDt, uRadius;
varying vec2 vUv;
${floorGLSL}
void main(){
  vec4 P = texture2D(uPos, vUv);
  vec3 p = P.xyz + texture2D(uVel, vUv).xyz * uDt;
  float fy = floorY(p.xz) + uRadius;
  p.y = max(p.y, fy);
  float lim = ${GLOBE.RIN.toFixed(4)} - uRadius;
  float r = length(p);
  if (r > lim) p *= lim / r;
  gl_FragColor = vec4(p, P.w);
}
`;

export const copyFrag = /* glsl */ `
precision highp float;
uniform sampler2D uSrc;
varying vec2 vUv;
void main(){ gl_FragColor = texture2D(uSrc, vUv); }
`;
