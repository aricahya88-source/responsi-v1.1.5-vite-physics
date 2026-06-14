import { useEffect, useRef } from "react";
import * as THREE from "three";

const COLORS = {
  electric: 0x56ccf2,
  optics: 0xf2c94c,
  wave: 0x9b51e0,
  acoustic: 0x6fcf97,
  magnetic: 0xbb6bd9,
  thermal: 0xf2994a,
  neutral: 0xe8eefc,
  red: 0xff6b6b,
  blue: 0x4dabf7,
  green: 0x51cf66,
  amber: 0xffc078
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.15,
    roughness: options.roughness ?? 0.45,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0
  });
}

function addLabel(group, text, position, scale = 0.42) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 128;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "700 42px Inter, Arial, sans-serif";
  context.fillStyle = "rgba(255,255,255,0.95)";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(scale * 3.4, scale * 0.85, 1);
  sprite.position.copy(position);
  group.add(sprite);
  return sprite;
}

function cylinderBetween(start, end, radius, color, options = {}) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 20);
  const mesh = new THREE.Mesh(geometry, material(color, options));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function tubeFromPoints(points, radius, color, options = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.1);
  const geometry = new THREE.TubeGeometry(curve, 80, radius, 12, false);
  return new THREE.Mesh(geometry, material(color, options));
}

function lineFromPoints(points, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
  return new THREE.Line(geometry, lineMaterial);
}

function makeBox(width, height, depth, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color, options));
  return mesh;
}

function makeSphere(radius, color, options = {}) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), material(color, options));
}

function makeArrow(origin, direction, length, color) {
  return new THREE.ArrowHelper(direction.clone().normalize(), origin, length, color, 0.18, 0.1);
}

function addBaseGrid(group) {
  const grid = new THREE.GridHelper(7, 14, 0x37506a, 0x243447);
  grid.position.y = -1.35;
  grid.material.opacity = 0.35;
  grid.material.transparent = true;
  group.add(grid);
}

function buildOhm(group, values, metrics, animations) {
  addBaseGrid(group);

  const wireColor = COLORS.electric;
  const points = [
    new THREE.Vector3(-2.4, 0, -1.15),
    new THREE.Vector3(-2.4, 0, 1.15),
    new THREE.Vector3(2.4, 0, 1.15),
    new THREE.Vector3(2.4, 0, -1.15),
    new THREE.Vector3(-2.4, 0, -1.15)
  ];
  for (let i = 0; i < points.length - 1; i += 1) {
    group.add(cylinderBetween(points[i], points[i + 1], 0.035, wireColor, { emissive: wireColor, emissiveIntensity: 0.25 }));
  }

  const battery = new THREE.Group();
  const cell = makeBox(0.7, 1.25, 0.75, 0x1f2a44, { metalness: 0.05 });
  const plus = makeBox(0.08, 1.55, 0.85, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.25 });
  const minus = makeBox(0.08, 1.05, 0.85, COLORS.blue, { emissive: COLORS.blue, emissiveIntensity: 0.2 });
  plus.position.x = 0.22;
  minus.position.x = -0.22;
  battery.add(cell, plus, minus);
  battery.position.set(-2.4, 0, 0);
  group.add(battery);
  addLabel(group, `${values.voltage} V`, new THREE.Vector3(-2.4, 1.1, 0), 0.32);

  const resistorPoints = [];
  for (let i = 0; i <= 90; i += 1) {
    const t = i / 90;
    const x = -0.9 + 1.8 * t;
    const y = 0.16 * Math.sin(t * Math.PI * 12);
    resistorPoints.push(new THREE.Vector3(x, y, 1.15));
  }
  group.add(tubeFromPoints(resistorPoints, 0.035, COLORS.amber, { emissive: COLORS.amber, emissiveIntensity: 0.2 }));
  addLabel(group, `${values.resistance} Ω`, new THREE.Vector3(0, 0.65, 1.15), 0.3);

  const meter = makeSphere(0.42, 0x172033, { transparent: true, opacity: 0.9, emissive: COLORS.electric, emissiveIntensity: 0.08 });
  meter.position.set(2.4, 0, 0);
  group.add(meter);
  addLabel(group, `${metrics.current.toFixed(3)} A`, new THREE.Vector3(2.4, 0.7, 0), 0.3);

  const loop = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.001);
  const particles = [];
  const particleCount = 20;
  for (let i = 0; i < particleCount; i += 1) {
    const particle = makeSphere(0.07, COLORS.electric, { emissive: COLORS.electric, emissiveIntensity: 0.7 });
    group.add(particle);
    particles.push({ mesh: particle, offset: i / particleCount });
  }
  animations.push((time) => {
    const speed = clamp(metrics.current * 0.18, 0.04, 0.45);
    particles.forEach((particle) => {
      const t = (particle.offset + time * speed) % 1;
      particle.mesh.position.copy(loop.getPointAt(t));
      particle.mesh.position.y += 0.08;
    });
  });
}

function buildLens(group, values, metrics, animations) {
  addBaseGrid(group);
  const lens = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 48, 24),
    material(0x7ed6ff, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0 })
  );
  lens.scale.set(0.18, 1.65, 0.95);
  group.add(lens);
  group.add(cylinderBetween(new THREE.Vector3(-3.2, -0.02, 0), new THREE.Vector3(3.2, -0.02, 0), 0.012, 0xffffff));
  addLabel(group, `f = ${values.focalLength} cm`, new THREE.Vector3(0, 1.65, 0), 0.3);

  const scale = 0.055;
  const objectX = -clamp(values.objectDistance * scale, 0.55, 3.1);
  const objectHeight = clamp(values.objectHeight * 0.18, 0.25, 1.5);
  const objectArrow = makeArrow(new THREE.Vector3(objectX, -0.05, 0), new THREE.Vector3(0, 1, 0), objectHeight, COLORS.green);
  group.add(objectArrow);
  addLabel(group, "Benda", new THREE.Vector3(objectX, objectHeight + 0.35, 0), 0.26);

  const imageFinite = Number.isFinite(metrics.imageDistance);
  const imageX = imageFinite ? clamp(metrics.imageDistance * scale, -3.1, 3.1) : 3;
  const imageHeight = imageFinite ? clamp(Math.abs(metrics.imageHeight) * 0.18, 0.2, 1.6) : 1.5;
  const imageDirection = metrics.imageHeight < 0 ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0);
  const imageArrow = makeArrow(new THREE.Vector3(imageX, -0.05, 0), imageDirection, imageHeight, metrics.imageDistance > 0 ? COLORS.amber : COLORS.blue);
  group.add(imageArrow);
  addLabel(group, "Bayangan", new THREE.Vector3(imageX, metrics.imageHeight < 0 ? -imageHeight - 0.35 : imageHeight + 0.35, 0), 0.25);

  const topObject = new THREE.Vector3(objectX, objectHeight, 0);
  const lensCenter = new THREE.Vector3(0, 0, 0);
  const imageTip = new THREE.Vector3(imageX, metrics.imageHeight < 0 ? -imageHeight : imageHeight, 0);
  group.add(lineFromPoints([topObject, lensCenter, imageTip], COLORS.amber));
  group.add(lineFromPoints([topObject, new THREE.Vector3(0, objectHeight, 0), imageTip], COLORS.electric));

  const focalLeft = makeSphere(0.06, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.5 });
  const focalRight = makeSphere(0.06, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.5 });
  focalLeft.position.set(-values.focalLength * scale, 0, 0);
  focalRight.position.set(values.focalLength * scale, 0, 0);
  group.add(focalLeft, focalRight);

  animations.push((time) => {
    lens.rotation.y = Math.sin(time * 0.7) * 0.08;
  });
}

function buildRefraction(group, values, metrics, animations) {
  addBaseGrid(group);
  const planeTop = makeBox(6, 0.02, 2.7, 0x1a3551, { transparent: true, opacity: 0.35 });
  planeTop.position.y = 0.68;
  const planeBottom = makeBox(6, 0.02, 2.7, 0x31543b, { transparent: true, opacity: 0.35 });
  planeBottom.position.y = -0.68;
  group.add(planeTop, planeBottom);
  group.add(cylinderBetween(new THREE.Vector3(-3, 0, 0), new THREE.Vector3(3, 0, 0), 0.01, 0xffffff));
  group.add(cylinderBetween(new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(0, 1.35, 0), 0.01, 0xffffff));

  const theta1 = (values.incidentAngle * Math.PI) / 180;
  const incidentStart = new THREE.Vector3(-Math.sin(theta1) * 2.2, Math.cos(theta1) * 2.2, 0);
  group.add(makeArrow(incidentStart, new THREE.Vector3(0, 0, 0).sub(incidentStart), 2.15, COLORS.amber));

  if (metrics.totalInternalReflection) {
    const reflectedDirection = new THREE.Vector3(Math.sin(theta1), Math.cos(theta1), 0);
    group.add(makeArrow(new THREE.Vector3(0, 0, 0), reflectedDirection, 2.0, COLORS.red));
    addLabel(group, "Pemantulan total", new THREE.Vector3(0.9, 1.1, 0), 0.3);
  } else {
    const theta2 = (metrics.refractedAngle * Math.PI) / 180;
    const refractedDirection = new THREE.Vector3(Math.sin(theta2), -Math.cos(theta2), 0);
    group.add(makeArrow(new THREE.Vector3(0, 0, 0), refractedDirection, 2.0, COLORS.electric));
    addLabel(group, `θ₂ = ${metrics.refractedAngle.toFixed(1)}°`, new THREE.Vector3(1.2, -1.05, 0), 0.3);
  }
  addLabel(group, `n₁ = ${values.n1}`, new THREE.Vector3(-2.25, 1.05, 0), 0.28);
  addLabel(group, `n₂ = ${values.n2}`, new THREE.Vector3(-2.25, -1.05, 0), 0.28);

  animations.push((time) => {
    group.rotation.z = Math.sin(time * 0.25) * 0.025;
  });
}

function createWaveLine(pointsCount = 140, color = COLORS.wave) {
  const points = Array.from({ length: pointsCount }, () => new THREE.Vector3());
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));
  return line;
}

function updateLinePoints(line, callback) {
  const position = line.geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const p = callback(i, position.count);
    position.setXYZ(i, p.x, p.y, p.z);
  }
  position.needsUpdate = true;
  line.geometry.computeBoundingSphere();
}

function buildStandingWave(group, values, metrics, animations) {
  addBaseGrid(group);
  const leftPost = cylinderBetween(new THREE.Vector3(-2.8, -1, 0), new THREE.Vector3(-2.8, 1, 0), 0.055, 0xffffff);
  const rightPost = cylinderBetween(new THREE.Vector3(2.8, -1, 0), new THREE.Vector3(2.8, 1, 0), 0.055, 0xffffff);
  group.add(leftPost, rightPost);
  const line = createWaveLine(180, COLORS.wave);
  group.add(line);

  for (let i = 0; i <= values.harmonic; i += 1) {
    const x = -2.8 + (5.6 * i) / values.harmonic;
    const node = makeSphere(0.055, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.4 });
    node.position.set(x, 0, 0);
    group.add(node);
  }
  addLabel(group, `n = ${values.harmonic}`, new THREE.Vector3(0, 1.25, 0), 0.32);

  animations.push((time) => {
    const amplitude = values.amplitude * 0.025;
    const harmonic = values.harmonic;
    updateLinePoints(line, (i, count) => {
      const t = i / (count - 1);
      const x = -2.8 + 5.6 * t;
      const y = amplitude * Math.sin(harmonic * Math.PI * t) * Math.cos(time * 3.2);
      return new THREE.Vector3(x, y, 0);
    });
  });
}

function buildSoundResonance(group, values, metrics, animations) {
  addBaseGrid(group);
  const tubeLength = 4.8;
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, tubeLength, 48, 1, true),
    material(0x74c0fc, { transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0 })
  );
  tube.rotation.z = Math.PI / 2;
  group.add(tube);
  const rimLeft = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 12, 48), material(0xe8eefc));
  const rimRight = rimLeft.clone();
  rimLeft.rotation.y = Math.PI / 2;
  rimRight.rotation.y = Math.PI / 2;
  rimLeft.position.x = -tubeLength / 2;
  rimRight.position.x = tubeLength / 2;
  group.add(rimLeft, rimRight);

  if (values.tubeType === "open-closed") {
    const cap = makeBox(0.08, 0.9, 0.9, 0xe8eefc, { metalness: 0.25 });
    cap.position.x = tubeLength / 2;
    group.add(cap);
  }

  const wave = createWaveLine(150, COLORS.green);
  group.add(wave);
  addLabel(group, `${metrics.frequency.toFixed(1)} Hz`, new THREE.Vector3(0, 1.05, 0), 0.32);

  animations.push((time) => {
    const mode = values.mode;
    const isClosed = values.tubeType === "open-closed";
    updateLinePoints(wave, (i, count) => {
      const t = i / (count - 1);
      const x = -tubeLength / 2 + tubeLength * t;
      const envelope = isClosed
        ? Math.cos(((2 * mode - 1) * Math.PI * t) / 2)
        : Math.sin(mode * Math.PI * t);
      const y = 0.42 * envelope * Math.sin(time * 3.8);
      return new THREE.Vector3(x, y, 0);
    });
  });
}

function buildCapacitor(group, values, metrics, animations) {
  addBaseGrid(group);
  const distance = clamp(values.plateDistance / 6, 0.35, 2.2);
  const leftPlate = makeBox(0.12, 1.85, 1.55, COLORS.blue, { emissive: COLORS.blue, emissiveIntensity: 0.16, metalness: 0.35 });
  const rightPlate = makeBox(0.12, 1.85, 1.55, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.16, metalness: 0.35 });
  leftPlate.position.x = -distance / 2;
  rightPlate.position.x = distance / 2;
  group.add(leftPlate, rightPlate);

  for (let y = -0.6; y <= 0.6; y += 0.3) {
    for (let z = -0.45; z <= 0.45; z += 0.45) {
      const arrow = makeArrow(new THREE.Vector3(-distance / 2 + 0.15, y, z), new THREE.Vector3(1, 0, 0), Math.max(0.2, distance - 0.3), COLORS.amber);
      group.add(arrow);
    }
  }

  const chargeCount = clamp(Math.round(metrics.chargeCoulomb * 1e6 / 10), 6, 30);
  for (let i = 0; i < chargeCount; i += 1) {
    const y = -0.78 + (1.56 * (i % 10)) / 9;
    const z = i < 10 ? -0.55 : i < 20 ? 0 : 0.55;
    const plus = makeSphere(0.045, COLORS.red, { emissive: COLORS.red, emissiveIntensity: 0.5 });
    plus.position.set(distance / 2 + 0.12, y, z);
    const minus = makeSphere(0.045, COLORS.blue, { emissive: COLORS.blue, emissiveIntensity: 0.5 });
    minus.position.set(-distance / 2 - 0.12, y, z);
    group.add(plus, minus);
  }

  addLabel(group, `${values.voltage} V`, new THREE.Vector3(0, 1.35, 0), 0.32);
  animations.push((time) => {
    group.rotation.y = Math.sin(time * 0.35) * 0.08;
  });
}

function createHelix(radius, height, turns, x, color) {
  const points = [];
  const total = Math.max(120, Math.round(turns * 28));
  for (let i = 0; i <= total; i += 1) {
    const t = i / total;
    const angle = t * Math.PI * 2 * turns;
    points.push(new THREE.Vector3(
      x + Math.sin(angle) * radius,
      -height / 2 + t * height,
      Math.cos(angle) * radius
    ));
  }
  return tubeFromPoints(points, 0.028, color, { emissive: color, emissiveIntensity: 0.22 });
}

function createCoilRings(radius, height, turns, x, color) {
  const group = new THREE.Group();
  const visibleTurns = clamp(Math.round(turns), 4, 18);
  const materialCoil = material(color, { emissive: color, emissiveIntensity: 0.18, metalness: 0.35, roughness: 0.35 });

  for (let i = 0; i < visibleTurns; i += 1) {
    const t = visibleTurns === 1 ? 0.5 : i / (visibleTurns - 1);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 10, 44), materialCoil);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, -height / 2 + t * height, 0);
    group.add(ring);
  }

  return group;
}

function buildTransformer(group, values, metrics, animations) {
  addBaseGrid(group);
  const coreColor = 0x7a8799;
  const top = makeBox(3.4, 0.18, 1.05, coreColor, { metalness: 0.55 });
  const bottom = makeBox(3.4, 0.18, 1.05, coreColor, { metalness: 0.55 });
  const left = makeBox(0.18, 2.4, 1.05, coreColor, { metalness: 0.55 });
  const right = makeBox(0.18, 2.4, 1.05, coreColor, { metalness: 0.55 });
  top.position.y = 1.1;
  bottom.position.y = -1.1;
  left.position.x = -1.55;
  right.position.x = 1.55;
  group.add(top, bottom, left, right);

  const primaryTurnsVisual = clamp(Math.round(values.primaryTurns / 60), 4, 18);
  const secondaryTurnsVisual = clamp(Math.round(values.secondaryTurns / 60), 4, 18);
  const primaryCoil = new THREE.Group();
  primaryCoil.add(createHelix(0.52, 2.28, primaryTurnsVisual, -1.55, COLORS.electric));
  primaryCoil.add(createCoilRings(0.52, 2.28, primaryTurnsVisual, -1.55, COLORS.electric));
  const secondaryCoil = new THREE.Group();
  secondaryCoil.add(createHelix(0.52, 2.28, secondaryTurnsVisual, 1.55, COLORS.amber));
  secondaryCoil.add(createCoilRings(0.52, 2.28, secondaryTurnsVisual, 1.55, COLORS.amber));
  group.add(primaryCoil, secondaryCoil);

  addLabel(group, `Np ${values.primaryTurns}`, new THREE.Vector3(-1.55, -1.62, 0), 0.25);
  addLabel(group, `Ns ${values.secondaryTurns}`, new THREE.Vector3(1.55, -1.62, 0), 0.25);
  addLabel(group, `Vp ${values.primaryVoltage} V`, new THREE.Vector3(-1.55, 1.55, 0), 0.28);
  addLabel(group, `Vs ${metrics.secondaryVoltage.toFixed(1)} V`, new THREE.Vector3(1.55, 1.55, 0), 0.28);

  const flux = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.015, 10, 90),
    material(COLORS.magnetic, { emissive: COLORS.magnetic, emissiveIntensity: 0.6 })
  );
  flux.scale.x = 1.35;
  flux.rotation.x = Math.PI / 2;
  group.add(flux);
  animations.push((time) => {
    flux.rotation.z = time * 1.8;
    flux.scale.set(1.35 + Math.sin(time * 2.5) * 0.08, 1 + Math.sin(time * 2.5) * 0.08, 1);
    primaryCoil.rotation.y = Math.sin(time * 2.2) * 0.035;
    secondaryCoil.rotation.y = -Math.sin(time * 2.2) * 0.035;
  });
}

function buildThermalExpansion(group, values, metrics, animations) {
  addBaseGrid(group);
  const exaggeration = 180;
  const displayLength = clamp(2.2 + metrics.deltaLength * exaggeration, 2.2, 5.4);
  const rod = makeBox(displayLength, 0.35, 0.35, COLORS.thermal, { emissive: COLORS.thermal, emissiveIntensity: 0.18, metalness: 0.25 });
  rod.position.x = displayLength / 2 - 2.7;
  group.add(rod);
  const fixedWall = makeBox(0.15, 1.2, 0.75, 0xe8eefc, { metalness: 0.35 });
  fixedWall.position.set(-2.7, 0, 0);
  group.add(fixedWall);
  group.add(makeArrow(new THREE.Vector3(-2.55 + displayLength, 0.45, 0), new THREE.Vector3(1, 0, 0), 0.55, COLORS.red));
  addLabel(group, `ΔL = ${(metrics.deltaLength * 1000).toFixed(3)} mm`, new THREE.Vector3(0, 1.05, 0), 0.32);

  const heatWaves = [];
  for (let i = 0; i < 6; i += 1) {
    const wave = createWaveLine(40, COLORS.red);
    wave.position.x = -2.2 + i * 0.8;
    wave.position.y = -0.85;
    group.add(wave);
    heatWaves.push(wave);
  }
  animations.push((time) => {
    heatWaves.forEach((wave, index) => {
      updateLinePoints(wave, (i, count) => {
        const t = i / (count - 1);
        return new THREE.Vector3((t - 0.5) * 0.45, 0.12 * Math.sin(t * Math.PI * 2 + time * 4 + index), 0);
      });
    });
    rod.scale.y = 1 + Math.sin(time * 2) * 0.025;
  });
}

const builders = {
  ohm: buildOhm,
  lens: buildLens,
  refraction: buildRefraction,
  "standing-wave": buildStandingWave,
  "sound-resonance": buildSoundResonance,
  capacitor: buildCapacitor,
  transformer: buildTransformer,
  "thermal-expansion": buildThermalExpansion
};

export default function Simulation3D({ practicum, values, metrics }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07111f);
    scene.fog = new THREE.Fog(0x07111f, 7, 15);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.8, 3.1, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 5);
    const fill = new THREE.PointLight(COLORS[practicum.theme] ?? COLORS.neutral, 2.2, 12);
    fill.position.set(-3, 2.2, 2.5);
    scene.add(ambient, key, fill);

    const group = new THREE.Group();
    group.rotation.x = -0.08;
    scene.add(group);

    const animations = [];
    const builder = builders[practicum.id];
    if (builder) builder(group, values, metrics, animations);

    let pointerDown = false;
    let previousX = 0;
    let targetRotation = 0;

    const onPointerDown = (event) => {
      pointerDown = true;
      previousX = event.clientX;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event) => {
      if (!pointerDown) return;
      const delta = event.clientX - previousX;
      previousX = event.clientX;
      targetRotation += delta * 0.006;
    };
    const onPointerUp = () => {
      pointerDown = false;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    let animationId = 0;
    const clock = new THREE.Clock();
    const render = () => {
      const elapsed = clock.getElapsedTime();
      group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
      animations.forEach((animate) => animate(elapsed));
      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      container.removeChild(renderer.domElement);
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((mat) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        }
      });
      renderer.dispose();
    };
  }, [practicum, values, metrics]);

  return (
    <section className="simulation-card" aria-label={`Simulasi 3D ${practicum.title}`}>
      <div className="simulation-header">
        <div>
          <p className="eyebrow">Simulasi 3D Interaktif</p>
          <h2>{practicum.title}</h2>
        </div>
        <span className={`theme-chip ${practicum.theme}`}>{practicum.formula}</span>
      </div>
      <div className="canvas-wrap" ref={containerRef}>
        <div className="canvas-hint">Geser pada area simulasi untuk memutar tampilan.</div>
      </div>
    </section>
  );
}
