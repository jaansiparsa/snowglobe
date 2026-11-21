// Draws one full-screen quad with a given material into a render target:
// the "compute kernel launch" of our WebGL2 GPGPU passes.
import * as THREE from 'three';

export class FullscreenPass {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  render(material, target) {
    const r = this.renderer;
    const prev = r.getRenderTarget();
    this.quad.material = material;
    r.setRenderTarget(target);
    r.render(this.scene, this.camera);
    r.setRenderTarget(prev);
  }
}
