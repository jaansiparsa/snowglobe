// GPU snow: particle state lives in float textures (one texel per flake) and is
// advanced by two fragment-shader passes per frame (velocity, then position),
// ping-ponging between two render targets for each.
//
//   pos texel = (x, y, z, seed)   in the globe's local frame
//   vel texel = (vx, vy, vz, 0)
//
// Forces on a flake: gravity minus buoyancy, Stokes-like drag toward the local
// water velocity, and a small inertial (pseudo) force when the globe accelerates.
// The water velocity is curl noise (Bridson et al. 2007) with the potential
// modified so the flow stays tangential at the glass, plus a bulk "slosh" term.
import * as THREE from 'three';
import { quadVert, velFrag, posFrag, copyFrag } from '../shaders/snow-sim.glsl.js';
import { FullscreenPass } from './fullscreen-pass.js';
import { particleTextureType, createStateTarget, initialPositions, zeroTexture } from './particle-state.js';

export class SnowSim {
  constructor(renderer, size = 64) {
    this.pass = new FullscreenPass(renderer);
    this.type = particleTextureType(renderer);

    // Uniforms shared by the two sim passes. Units: globe radius = 1, seconds.
    this.u = {
      uPos: { value: null }, uVel: { value: null },
      uDt: { value: 1 / 60 }, uTime: { value: 0 },
      uGravity: { value: 0.32 },      // net downward accel of a flake in water
      uDrag: { value: 3.5 },          // 1/s; terminal fall speed ~ g/k ~ 0.09 R/s
      uRadius: { value: 0.008 },
      uInertia: { value: 0.12 },      // (1 - rho_water / rho_flake): flakes barely denser than water
      uGravityDir: { value: new THREE.Vector3(0, -1, 0) },
      uFrameAccel: { value: new THREE.Vector3() },
      uStir: { value: 0 },
      uNoiseScale: { value: 1.6 },
      uFlowAmp: { value: 0.32 },
      uBulk: { value: new THREE.Vector3() },
    };
    const kernel = (frag, uniforms) => new THREE.ShaderMaterial({
      vertexShader: quadVert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false,
    });
    this.velMat = kernel(velFrag, this.u);
    this.posMat = kernel(posFrag, this.u);
    this.copyMat = kernel(copyFrag, { uSrc: { value: null } });
    this.setSize(size);
  }

  get count() { return this.size * this.size; }
  get positionTexture() { return this.pos[this.cur].texture; }
  get positionTarget() { return this.pos[this.cur]; }

  setSize(size) {
    this.size = size;
    if (this.pos) [...this.pos, ...this.vel].forEach((rt) => rt.dispose());
    const mk = () => createStateTarget(size, this.type);
    this.pos = [mk(), mk()];
    this.vel = [mk(), mk()];
    this.cur = 0;
    this.upload(initialPositions(size), this.pos[0]);
    this.upload(zeroTexture(size), this.vel[0]);
  }

  upload(tex, target) {
    tex.needsUpdate = true;
    this.copyMat.uniforms.uSrc.value = tex;
    this.pass.render(this.copyMat, target);
    tex.dispose();
  }

  // Feed this frame's forcing from the shake controller (all in the globe frame).
  setForcing({ gravityDir, frameAccel, bulk, stir }) {
    this.u.uGravityDir.value.copy(gravityDir);
    this.u.uFrameAccel.value.copy(frameAccel);
    this.u.uBulk.value.copy(bulk);
    this.u.uStir.value = stir;
  }

  step(dt) {
    const nxt = 1 - this.cur;
    this.u.uDt.value = dt;
    this.u.uTime.value += dt;
    this.u.uPos.value = this.pos[this.cur].texture;
    this.u.uVel.value = this.vel[this.cur].texture;
    this.pass.render(this.velMat, this.vel[nxt]);
    this.u.uVel.value = this.vel[nxt].texture;
    this.pass.render(this.posMat, this.pos[nxt]);
    this.cur = nxt;
  }
}
