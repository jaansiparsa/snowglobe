// Camera and orbit controls. Left drag is reserved for shaking the globe,
// so orbiting is on the right button (or two fingers on touch screens).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BASE_FOV = 40;

export function createCamera(canvas) {
  const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.1, 100);
  camera.position.set(0, 0.35, 3.9);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, -0.12, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 8;
  controls.maxPolarAngle = 1.85;
  controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_ROTATE };
  return { camera, controls };
}

// Keep the whole globe in frame on tall (phone) screens by widening the FOV.
export function fitCamera(camera, aspect) {
  camera.aspect = aspect;
  camera.fov = aspect < 0.9
    ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * 0.9 / aspect))
    : BASE_FOV;
  camera.updateProjectionMatrix();
}
