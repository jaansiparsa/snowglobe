// Point-sprite rendering of flakes, reading positions straight from the sim texture.
export const pointsVert = /* glsl */ `
uniform sampler2D uPos;
uniform float uSize, uScale;
attribute vec2 ref;
varying float vShade;
void main(){
  vec4 P = texture2D(uPos, ref);
  vec4 mv = modelViewMatrix * vec4(P.xyz, 1.0);
  gl_Position = projectionMatrix * mv;
  float s = uSize * (0.55 + 0.9 * fract(P.w * 23.17));
  gl_PointSize = max(1.5, s * uScale / -mv.z);
  // slightly brighter toward the top, where the window light comes from
  vShade = (0.85 + 0.3 * fract(P.w * 5.31)) * (0.85 + 0.25 * clamp(P.y + 0.5, 0.0, 1.0));
}
`;

export const pointsFrag = /* glsl */ `
varying float vShade;
void main(){
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(c, c);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vec3(1.05, 1.08, 1.15) * vShade * (1.0 - 0.35 * r2), 1.0);
}
`;
