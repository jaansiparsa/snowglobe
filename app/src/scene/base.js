// Wooden base with a brass ring. Outside the glass, so it uses normal Three.js shading.
import * as THREE from 'three';

const PROFILE = [
  [0, -1.2], [1.04, -1.2], [1.07, -1.17], [1.06, -1.1], [0.98, -1.0], [0.9, -0.88],
  [0.85, -0.78], [0.84, -0.74], [0.8, -0.71], [0, -0.71],
];

export function createBase() {
  const group = new THREE.Group();
  const wood = new THREE.Mesh(
    new THREE.LatheGeometry(PROFILE.map(([x, y]) => new THREE.Vector2(x, y)), 128),
    new THREE.MeshStandardMaterial({ color: 0x3b2417, roughness: 0.38, metalness: 0.0 }),
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.842, 0.018, 16, 128),
    new THREE.MeshStandardMaterial({ color: 0xc9a45a, roughness: 0.25, metalness: 1.0 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.755;
  group.add(wood, ring);
  return group;
}
