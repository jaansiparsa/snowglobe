// First extension: shake the globe by moving the phone (DeviceMotion API).
import * as THREE from 'three';

const DEADZONE = 0.6;     // m/s^2, ignore hand tremor
const GAIN = 6;           // m/s^2 -> R/s^2 (R ~ 5 cm, exaggerated so it feels lively)

export function motionSupported() {
  return typeof DeviceMotionEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}

// Device axes -> screen axes, accounting for landscape rotation.
export function deviceToScreen(x, y, z, angleDeg) {
  const a = THREE.MathUtils.degToRad(angleDeg);
  return new THREE.Vector3(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z);
}

// Some Android browsers only report acceleration including gravity:
// remove gravity with a low-pass estimate.
function gravityRemover() {
  let grav = null;
  return (g) => {
    if (!grav) grav = { x: g.x, y: g.y, z: g.z };
    grav.x += (g.x - grav.x) * 0.1; grav.y += (g.y - grav.y) * 0.1; grav.z += (g.z - grav.z) * 0.1;
    return { x: g.x - grav.x, y: g.y - grav.y, z: g.z - grav.z };
  };
}

// Asks for permission where required (iOS, must be called from a user gesture).
export async function enableDeviceMotion(shake) {
  if (typeof DeviceMotionEvent === 'undefined') return false;
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      if ((await DeviceMotionEvent.requestPermission()) !== 'granted') return false;
    } catch { return false; }
  }
  const removeGravity = gravityRemover();
  window.addEventListener('devicemotion', (e) => {
    let a;
    if (e.acceleration && e.acceleration.x !== null) a = e.acceleration;
    else if (e.accelerationIncludingGravity?.x != null) a = removeGravity(e.accelerationIncludingGravity);
    else return;
    const angle = screen.orientation?.angle ?? window.orientation ?? 0;
    const v = deviceToScreen(a.x, a.y, a.z, angle);
    if (v.length() < DEADZONE) v.set(0, 0, 0);
    shake.setExternalAccel(v.multiplyScalar(GAIN));
  });
  return true;
}
