// Storage for particle state: float render targets (one texel per flake) and
// the initial distribution of flakes in the water.
import * as THREE from 'three';
import { GLOBE } from '../config.js';

export function particleTextureType(renderer) {
  return renderer.extensions.has('EXT_color_buffer_float') ? THREE.FloatType : THREE.HalfFloatType;
}

export function createStateTarget(size, type) {
  return new THREE.WebGLRenderTarget(size, size, {
    type, format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    depthBuffer: false, generateMipmaps: false,
  });
}

// Uniform random points in the water above the floor; w = per-flake random seed.
export function initialPositions(size) {
  const n = size * size;
  const data = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let x, y, z;
    do {
      x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 0.85 || y < -0.5);
    data.set([x * GLOBE.RIN, y * GLOBE.RIN, z * GLOBE.RIN, Math.random()], i * 4);
  }
  return new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
}

export function zeroTexture(size) {
  return new THREE.DataTexture(new Float32Array(size * size * 4), size, size, THREE.RGBAFormat, THREE.FloatType);
}
