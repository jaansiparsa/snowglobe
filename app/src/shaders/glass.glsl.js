// Glass dome optics: exact sphere hits, Snell refraction at both interfaces,
// Schlick Fresnel, screen-space ray march through the water, Beer-Lambert absorption.
import { envGLSL } from './environment.glsl.js';

export const glassVert = /* glsl */ `
varying vec3 vWorldPos;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const glassFrag = /* glsl */ `
#include <packing>
uniform sampler2D tInterior;
uniform sampler2D tDepth;
uniform mat4 uProj;
uniform float uNear, uFar;
uniform vec3 uCenter;
uniform float uR, uRin, uIorGlass, uIorWater, uThickness;
uniform vec3 uAbsorbWater, uAbsorbGlass;
uniform int uMode; // 0 full, 1 no refraction, 2 raw interior buffer
varying vec3 vWorldPos;
${envGLSL}

vec2 sphereHit(vec3 ro, vec3 rd, float r){
  vec3 oc = ro - uCenter;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - r * r;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

vec2 toUv(vec3 wp){
  vec4 c = uProj * viewMatrix * vec4(wp, 1.0);
  return c.xy / c.w * 0.5 + 0.5;
}
float viewZ(vec3 wp){ return (viewMatrix * vec4(wp, 1.0)).z; }
float sceneZ(vec2 uv){ return perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar); }
bool offscreen(vec2 uv){ return any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0))); }

float schlick(float cosi, float n1, float n2){
  float f0 = (n1 - n2) / (n1 + n2); f0 *= f0;
  return f0 + (1.0 - f0) * pow(1.0 - cosi, 5.0);
}

// Leave the water through the far wall: water -> glass -> air, then look up the room.
vec3 exitColor(vec3 p, vec3 d, float nWater, float nGlass){
  vec3 n = normalize(p - uCenter);                 // outward normal
  vec3 d2 = refract(d, -n, nWater / nGlass);
  if (dot(d2, d2) < 1e-6) d2 = reflect(d, -n);
  vec2 h = sphereHit(p, d2, uR);
  vec3 q = p + d2 * max(h.y, 0.0);
  vec3 n3 = normalize(q - uCenter);
  vec3 d3 = refract(d2, -n3, nGlass);
  if (dot(d3, d3) < 1e-6) d3 = reflect(d2, -n3);
  return envColor(d3) * exp(-uAbsorbGlass * max(h.y, 0.0));
}

// March a ray through the water and find the first interior surface it crosses.
// Returns premultiplied colour of what it hit composited over the exit colour.
vec3 traceWater(vec3 p, vec3 d, float nWater, float nGlass, out float travelled){
  float tExit = max(sphereHit(p, d, uRin).y, 0.0);
  const int N = 64;
  float prevT = 0.0, tHit = -1.0;
  // depth tolerance: at least one step, so we cannot jump over a surface,
  // but small enough that rays passing just behind a snowflake do not smear it
  float thick = max(uThickness, 1.5 * tExit / float(N));
  for (int i = 1; i <= N; i++) {
    float t = tExit * float(i) / float(N);
    vec3 q = p + d * t;
    vec2 uv = toUv(q);
    if (offscreen(uv)) break;
    float sz = sceneZ(uv), qz = viewZ(q);
    // crossing test: this sample is just behind the surface and the previous
    // sample (at the same screen position) was in front of it
    bool wasFront = viewZ(p + d * prevT) >= sz;
    if (qz < sz && sz - qz < thick && wasFront) {
      float a = prevT, b = t;                         // refine by bisection
      for (int j = 0; j < 6; j++) {
        float m = 0.5 * (a + b);
        vec3 qm = p + d * m;
        if (viewZ(qm) < sceneZ(toUv(qm))) b = m; else a = m;
      }
      tHit = b;
      break;
    }
    prevT = t;
  }
  vec3 back = exitColor(p + d * tExit, d, nWater, nGlass);
  if (tHit < 0.0) { travelled = tExit; return back; }
  travelled = tHit;
  vec4 c = texture2D(tInterior, toUv(p + d * tHit));
  return c.rgb + (1.0 - c.a) * back;
}

void main(){
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorldPos - ro);
  vec2 h0 = sphereHit(ro, rd, uR);
  if (h0.x < 0.0) discard;                          // exact silhouette
  vec3 p0 = ro + rd * h0.x;
  vec3 n0 = normalize(p0 - uCenter);
  float cosi = clamp(dot(-rd, n0), 0.0, 1.0);

  vec3 col;
  if (uMode == 2) {
    vec2 uv = gl_FragCoord.xy / vec2(textureSize(tInterior, 0));
    vec4 c = texture2D(tInterior, uv);
    col = c.rgb + (1.0 - c.a) * envColor(rd);
  } else {
    float nG = uMode == 1 ? 1.0 : uIorGlass;
    float nW = uMode == 1 ? 1.0 : uIorWater;
    float F = schlick(cosi, 1.0, nG);
    vec3 refl = envColor(reflect(rd, n0));

    vec3 r1 = refract(rd, n0, 1.0 / nG);
    vec2 h1 = sphereHit(p0, r1, uRin);
    vec3 refr;
    if (h1.x > 0.0) {
      // through the glass wall into the water
      vec3 p1 = p0 + r1 * h1.x;
      vec3 n1 = normalize(p1 - uCenter);
      vec3 r2 = refract(r1, n1, nG / nW);
      if (dot(r2, r2) < 1e-6) {
        refr = exitColor(p1, reflect(r1, n1), nG, nG);  // total internal reflection
      } else {
        float tw;
        refr = traceWater(p1, r2, nW, nG, tw);
        refr *= exp(-uAbsorbWater * tw - uAbsorbGlass * h1.x);
      }
    } else {
      // grazing ray: only crosses the glass shell
      vec2 h2 = sphereHit(p0, r1, uR);
      vec3 p2 = p0 + r1 * max(h2.y, 0.0);
      vec3 n2 = normalize(p2 - uCenter);
      vec3 r3 = refract(r1, -n2, nG);
      if (dot(r3, r3) < 1e-6) r3 = reflect(r1, -n2);
      refr = envColor(r3) * exp(-uAbsorbGlass * max(h2.y, 0.0));
    }
    col = mix(refr, refl, F);
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
