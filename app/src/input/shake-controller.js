// Turns input into motion of the globe and into the three numbers the snow
// simulation needs each frame:
//   accel  container acceleration (world, R/s^2) -> inertial force on flakes
//   bulk   velocity of the water relative to the glass (it lags the container)
//   stir   turbulence energy that scales the curl-noise flow; decays over time
//
// Input sources write to `target` (where the globe should be: pointer drag)
// or `ext` (a measured container acceleration: the phone's accelerometer).
import * as THREE from 'three';

export class ShakeController {
  constructor() {
    this.offset = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.accel = new THREE.Vector3();
    this.containerAccel = new THREE.Vector3();
    this.target = new THREE.Vector3();
    this.ext = new THREE.Vector3();      // external (phone) container accel
    this.bulk = new THREE.Vector3();
    this.stir = 0.6;                      // start with a little snowfall
    this.tilt = 0;
    this.k = 220;                         // spring stiffness (1/s^2)
    this.c = 9;                           // damping: underdamped, so it wobbles
    this.bulkCoupling = 0.1;
    this.bulkDamping = 0.6;
    this.stirGain = 0.015;
    this.stirDecay = 0.7;
    this.maxOffset = 0.6;
    this.scripted = null;
    this.extTimeout = null;
  }

  // A canned vigorous left-right shake (button, space bar).
  shake(duration = 0.9) {
    this.scripted = { t: 0, duration };
  }

  setExternalAccel(v) {
    this.ext.copy(v);
    this.extStamp = performance.now();
  }

  scriptedTarget(dt) {
    const s = this.scripted;
    if (!s) return null;
    s.t += dt;
    // ~3 Hz side to side with a little vertical motion, faded in and out.
    const env = Math.sin(Math.PI * Math.min(s.t / s.duration, 1));
    const target = new THREE.Vector3(
      0.45 * env * Math.sin(2 * Math.PI * 3.2 * s.t),
      0.12 * env * Math.sin(2 * Math.PI * 6.4 * s.t),
      0,
    );
    if (s.t >= s.duration) this.scripted = null;
    return target;
  }

  update(dt) {
    const target = this.scriptedTarget(dt) ?? this.target;
    if (this.extStamp && performance.now() - this.extStamp > 120) this.ext.set(0, 0, 0);

    // Globe position: damped spring toward the target (2 substeps for stability).
    const steps = 2, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const a = new THREE.Vector3().subVectors(target, this.offset).multiplyScalar(this.k)
        .addScaledVector(this.vel, -this.c)
        .addScaledVector(this.ext, -0.12);   // the globe visibly lags the phone a bit
      this.vel.addScaledVector(a, h);
      this.offset.addScaledVector(this.vel, h);
      this.accel.copy(a);
    }

    // What the water feels: spring motion on screen, or the phone's real acceleration.
    const A = this.containerAccel.copy(this.accel).add(this.ext);
    this.bulk.addScaledVector(A, -this.bulkCoupling * dt).multiplyScalar(Math.exp(-this.bulkDamping * dt));
    this.bulk.clampLength(0, 1.2);
    this.stir += (A.length() * this.stirGain - this.stir * this.stirDecay) * dt;
    this.stir = THREE.MathUtils.clamp(this.stir, 0, 3);
    this.tilt = THREE.MathUtils.clamp(-this.vel.x * 0.05, -0.22, 0.22);
  }
}
