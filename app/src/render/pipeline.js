// Two-pass frame:
//   1. interior pass: everything in the water (layer INTERIOR_LAYER) into an
//      HDR colour target (alpha = coverage) plus a depth texture
//   2. main pass: background, base and the glass dome, whose shader traces
//      refracted rays through the interior pass's colour + depth
import * as THREE from 'three';
import { INTERIOR_LAYER } from '../config.js';
import { updateGlass } from './glass.js';

export class RenderPipeline {
  constructor(renderer, scene, camera, glass) {
    Object.assign(this, { renderer, scene, camera, glass });
    this.interiorRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.interiorRT.depthTexture = new THREE.DepthTexture(1, 1);
  }

  resize() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.interiorRT.setSize(size.x, size.y);
    return size;
  }

  renderInterior() {
    const { renderer, scene, camera } = this;
    camera.layers.set(INTERIOR_LAYER);
    renderer.setRenderTarget(this.interiorRT);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    camera.layers.set(0);
  }

  renderMain() {
    updateGlass(this.glass, this.camera, this.interiorRT);
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    this.renderInterior();
    this.renderMain();
  }
}
