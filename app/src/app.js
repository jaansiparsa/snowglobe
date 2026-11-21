// SnowcaseApp: owns the scene and runs one frame = shake -> snow sim -> render.
import * as THREE from 'three';
import { createRenderer } from './render/renderer.js';
import { RenderPipeline } from './render/pipeline.js';
import { createCamera, fitCamera } from './scene/camera.js';
import { createEnvironment } from './scene/environment.js';
import { createGlobe } from './scene/globe.js';
import { SnowSim } from './sim/snow-sim.js';
import { ShakeController } from './input/shake-controller.js';
import { bindPointerDrag } from './input/pointer-drag.js';

const BASE_STIR = 0.03;   // the water is never perfectly still

export class SnowcaseApp {
  constructor(canvas, { flakes = 128, preset = 'pine' } = {}) {
    this.canvas = canvas;
    this.renderer = createRenderer(canvas);
    this.scene = new THREE.Scene();
    ({ camera: this.camera, controls: this.controls } = createCamera(canvas));
    createEnvironment(this.renderer, this.scene);

    const globe = createGlobe();
    this.globe = globe.group;
    this.subject = globe.subject;
    this.snow = globe.snow;
    this.glass = globe.glass;
    this.scene.add(this.globe);
    this.subject.setPreset(preset);

    this.sim = new SnowSim(this.renderer, flakes);
    this.snow.setCount(flakes);
    this.pipeline = new RenderPipeline(this.renderer, this.scene, this.camera, this.glass);

    this.shake = new ShakeController();
    bindPointerDrag(canvas, this.camera, this.shake);

    this.params = { turbulence: 1.0 };
    this.paused = false;
    this._invQ = new THREE.Quaternion();
    this._forcing = {
      gravityDir: new THREE.Vector3(), frameAccel: new THREE.Vector3(), bulk: new THREE.Vector3(), stir: 0,
    };
  }

  setParticleSize(size) {
    this.sim.setSize(size);
    this.snow.setCount(size);
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    fitCamera(this.camera, w / h);
    const size = this.pipeline.resize();
    this.snow.setViewport(size.y, this.camera);
  }

  // Shake state is in world space; the sim runs in the (possibly tilted) globe frame.
  stepSim(dt) {
    const f = this._forcing;
    this._invQ.copy(this.globe.quaternion).invert();
    f.gravityDir.set(0, -1, 0).applyQuaternion(this._invQ);
    f.frameAccel.copy(this.shake.containerAccel).negate().applyQuaternion(this._invQ);
    f.bulk.copy(this.shake.bulk).applyQuaternion(this._invQ);
    f.stir = BASE_STIR + this.shake.stir * this.params.turbulence;
    this.sim.setForcing(f);
    this.sim.step(dt);
    this.snow.setPositions(this.sim.positionTexture);
  }

  frame(dt) {
    this.shake.update(dt);
    this.globe.position.copy(this.shake.offset);
    this.globe.rotation.z = this.shake.tilt;
    this.globe.updateMatrixWorld(true);
    this.stepSim(dt);
    this.pipeline.render();
  }
}
