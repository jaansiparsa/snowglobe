// Assembles the snow globe: base, snowy floor, subject card, snow and glass,
// all children of one group that the shake controller moves.
import * as THREE from 'three';
import { INTERIOR_LAYER } from '../config.js';
import { createBase } from './base.js';
import { createSnowFloor } from './snow-floor.js';
import { Subject } from '../subject/subject.js';
import { SnowPoints } from '../render/snow-points.js';
import { createGlass } from '../render/glass.js';

export function createGlobe() {
  const group = new THREE.Group();
  const base = createBase();
  const floor = createSnowFloor();

  const subject = new Subject();
  subject.setLayer(INTERIOR_LAYER);

  const snow = new SnowPoints();
  snow.object.layers.set(INTERIOR_LAYER);

  const glass = createGlass();
  group.add(base, floor, subject.group, snow.object, glass);
  return { group, base, floor, subject, snow, glass };
}
