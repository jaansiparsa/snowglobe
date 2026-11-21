// Mouse / single-finger drag: the globe's spring target follows the pointer in
// the camera's screen plane, and snaps back to rest on release.
import * as THREE from 'three';

export function bindPointerDrag(el, camera, shake) {
  let start = null;
  let pid = null;
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || pid !== null) return;
    pid = e.pointerId;
    start = { x: e.clientX, y: e.clientY };
    el.setPointerCapture?.(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pid) return;
    // pixels -> world units at the globe's distance
    const dist = camera.position.length();
    const worldPerPx = (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / el.clientHeight;
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    shake.target.copy(right).multiplyScalar((e.clientX - start.x) * worldPerPx)
      .addScaledVector(up, -(e.clientY - start.y) * worldPerPx)
      .clampLength(0, shake.maxOffset);
  });

  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    shake.target.set(0, 0, 0);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
