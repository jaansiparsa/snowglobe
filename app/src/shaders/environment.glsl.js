// Procedural studio environment shared by background, glass reflections and PMREM lighting.
export const envGLSL = /* glsl */ `
float softBox(vec3 d, vec3 c, vec2 halfSize, float feather){
  float cd = dot(d, c);
  if (cd <= 0.0) return 0.0;
  vec3 t = normalize(cross(abs(c.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0), c));
  vec3 b = cross(c, t);
  vec2 q = abs(vec2(dot(d, t), dot(d, b)) / cd);
  vec2 e = 1.0 - smoothstep(halfSize * (1.0 - feather), halfSize, q);
  return e.x * e.y;
}
vec3 envColor(vec3 d){
  d = normalize(d);
  float y = d.y;
  vec3 sky     = vec3(0.045, 0.060, 0.105);
  vec3 horizon = vec3(0.150, 0.165, 0.200);
  vec3 ground  = vec3(0.060, 0.045, 0.038);
  vec3 c = y > 0.0 ? mix(horizon, sky, pow(y, 0.55)) : mix(horizon * 0.6, ground, pow(-y, 0.35));
  // warm window, upper left in front of the globe
  c += softBox(d, normalize(vec3(-0.55, 0.50, 0.68)), vec2(0.42, 0.30), 0.35) * vec3(5.2, 4.6, 3.9);
  // cool rim light, behind and to the right
  c += softBox(d, normalize(vec3(0.85, 0.25, -0.45)), vec2(0.10, 0.45), 0.5) * vec3(1.6, 2.0, 2.8);
  // faint fill from below-front (a table bounce)
  c += softBox(d, normalize(vec3(0.0, -0.6, 0.8)), vec2(0.9, 0.3), 0.9) * vec3(0.10, 0.08, 0.06);
  return c;
}
`;
