// The thing inside the globe: an image on a two-sided card standing on the snow.
// The front shows the image; the back is plain cardboard in its silhouette.
import * as THREE from 'three';
import { floorY } from '../config.js';
import { PRESETS } from './presets.js';
import { loadImageFile } from './image-prep.js';

const CARD_H = 0.78;
const CARD_MAX_W = 1.1;

export class Subject {
  constructor() {
    this.group = new THREE.Group();
    this.front = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ alphaTest: 0.5, side: THREE.FrontSide, color: 0xdedede }),
    );
    this.back = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({ alphaTest: 0.5, side: THREE.BackSide, roughness: 0.9 }),
    );
    this.back.material.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\n diffuseColor.rgb = vec3(0.62, 0.60, 0.56);');
    };
    this.back.position.z = -0.003;
    this.group.add(this.front, this.back);
  }

  setLayer(layer) {
    this.front.layers.set(layer);
    this.back.layers.set(layer);
  }

  setCanvas(src) {
    const tex = new THREE.CanvasTexture(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.front.material.map?.dispose();
    for (const m of [this.front.material, this.back.material]) {
      m.map = tex;
      m.needsUpdate = true;
    }
    let h = CARD_H, w = (CARD_H * src.width) / src.height;
    if (w > CARD_MAX_W) { h *= CARD_MAX_W / w; w = CARD_MAX_W; }
    this.group.scale.set(w, h, 1);
    this.group.position.set(0, floorY(0, 0) - 0.03 + h / 2, 0);
  }

  setPreset(name) { this.setCanvas(PRESETS[name]()); }

  async setFile(file) { this.setCanvas(await loadImageFile(file)); }
}
