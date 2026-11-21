// The glass dome. Rendered last, as an opaque sphere whose fragment shader does
// all the optics itself instead of using Three.js's transmission material:
//
//   1. intersect the eye ray with the exact outer sphere (not the mesh)
//   2. Schlick Fresnel at the air -> glass surface, reflection from the env
//   3. Snell refraction air -> glass (n = 1.5)
//   4. intersect the inner sphere, Snell refraction glass -> water (n = 1.33)
//   5. ray-march the refracted ray through the water against the depth buffer
//      of the interior pass (screen-space), and fetch the colour it hits
//   6. if it hits nothing, leave through the back: water -> glass -> air, env
//   7. Beer-Lambert absorption along the path in water and glass
import * as THREE from 'three';
import { GLOBE } from '../config.js';
import { glassVert, glassFrag } from '../shaders/glass.glsl.js';

export const GlassMode = { FULL: 0, NO_REFRACTION: 1, INTERIOR_BUFFER: 2 };

export function createGlass() {
  const material = new THREE.ShaderMaterial({
    vertexShader: glassVert,
    fragmentShader: glassFrag,
    uniforms: {
      tInterior: { value: null },
      tDepth: { value: null },
      uProj: { value: new THREE.Matrix4() },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uCenter: { value: new THREE.Vector3() },
      uR: { value: GLOBE.R },
      uRin: { value: GLOBE.RIN },
      uIorGlass: { value: 1.5 },
      uIorWater: { value: 1.33 },
      uThickness: { value: 0.02 },
      uAbsorbWater: { value: new THREE.Vector3(0.10, 0.035, 0.02) },
      uAbsorbGlass: { value: new THREE.Vector3(0.9, 0.25, 0.55) },
      uMode: { value: GlassMode.FULL },
    },
  });
  // Slightly oversized mesh; the shader discards outside the exact sphere.
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(GLOBE.R * 1.02, 96, 64), material);
  mesh.renderOrder = 10;
  return mesh;
}

export function updateGlass(mesh, camera, interiorRT) {
  const u = mesh.material.uniforms;
  u.tInterior.value = interiorRT.texture;
  u.tDepth.value = interiorRT.depthTexture;
  u.uProj.value.copy(camera.projectionMatrix);
  u.uNear.value = camera.near;
  u.uFar.value = camera.far;
  mesh.getWorldPosition(u.uCenter.value);
}
