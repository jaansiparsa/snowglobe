// Snowy floor inside the water: the mound from floorY(), continued down along
// the inner glass so refracted rays never see a gap under it.
import * as THREE from 'three';
import { GLOBE, INTERIOR_LAYER, floorY, floorRimRadius } from '../config.js';

export function createSnowFloor() {
  const rim = floorRimRadius();
  const profile = [];
  for (let i = 0; i <= 40; i++) {
    const r = (rim * i) / 40;
    profile.push(new THREE.Vector2(r, floorY(r, 0)));
  }
  for (let i = 1; i <= 8; i++) {
    const y = floorY(rim, 0) - (i / 8) * 0.25;
    profile.push(new THREE.Vector2(Math.sqrt(GLOBE.RIN ** 2 - y * y), y));
  }
  const mesh = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 128),
    new THREE.MeshStandardMaterial({ color: 0xe8edf5, roughness: 0.92, side: THREE.DoubleSide }),
  );
  mesh.layers.set(INTERIOR_LAYER);
  return mesh;
}
