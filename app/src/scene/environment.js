// The room around the globe: a background sphere drawn with the procedural
// environment, the same environment baked into a PMREM for image-based lighting,
// and a key light that also reaches the interior layer.
import * as THREE from 'three';
import { envGLSL } from '../shaders/environment.glsl.js';

const skyVert = /* glsl */ `
varying vec3 vDir;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const skyFrag = /* glsl */ `
varying vec3 vDir;
${envGLSL}
void main(){
  gl_FragColor = vec4(envColor(vDir), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createEnvironment(renderer, scene) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, vertexShader: skyVert, fragmentShader: skyFrag,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 24), material);
  scene.add(sky);

  // Bake the same environment so the base and interior are lit consistently.
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(sky.geometry, material));
  const cubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  new THREE.CubeCamera(0.1, 100, cubeRT).update(renderer, envScene);
  scene.environment = new THREE.PMREMGenerator(renderer).fromCubemap(cubeRT.texture).texture;

  const key = new THREE.DirectionalLight(0xfff1dd, 1.4);
  key.position.set(-2, 3, 2.5);
  key.layers.enableAll();
  scene.add(key);
  return { sky, key };
}
