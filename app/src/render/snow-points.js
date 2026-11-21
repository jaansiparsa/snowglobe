// Draws the flakes as point sprites. Each vertex only carries the texel
// coordinate of its flake; the vertex shader fetches the position from the sim.
import * as THREE from 'three';
import { pointsVert, pointsFrag } from '../shaders/snow-points.glsl.js';

export class SnowPoints {
  constructor() {
    this.material = new THREE.ShaderMaterial({
      vertexShader: pointsVert, fragmentShader: pointsFrag,
      uniforms: { uPos: { value: null }, uSize: { value: 0.011 }, uScale: { value: 800 } },
    });
    this.object = new THREE.Points(new THREE.BufferGeometry(), this.material);
    this.object.frustumCulled = false;
  }

  setCount(size) {
    const n = size * size;
    const ref = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      ref[i * 2] = ((i % size) + 0.5) / size;
      ref[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('ref', new THREE.BufferAttribute(ref, 2));
    this.object.geometry.dispose();
    this.object.geometry = geo;
  }

  setPositions(texture) { this.material.uniforms.uPos.value = texture; }

  // World size -> pixels: half the drawing-buffer height times the projection's y scale.
  setViewport(bufferHeight, camera) {
    this.material.uniforms.uScale.value = bufferHeight * 0.5 * camera.projectionMatrix.elements[5];
  }
}
