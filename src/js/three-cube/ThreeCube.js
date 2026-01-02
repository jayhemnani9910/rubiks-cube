/**
 * Three.js Rubik's Cube Implementation
 * Provides realistic 3D cube with smooth face rotation animations
 */

// Import Three.js from CDN
const THREE_CDN = "https://unpkg.com/three@0.160.0/build/three.module.js";

let THREE = null;
let scene, camera, renderer, cubeGroup;
let pieces = [];
let isAnimating = false;
let animationQueue = [];

// Configuration
const CONFIG = {
  pieceSize: 0.95,
  pieceGap: 0.05,
  pieceRounding: 0.08,
  animationDuration: 500,
  cameraDistance: 6,
};

// Face colors (matching CSS theme)
const COLORS = {
  right: 0xff0000,   // Red
  left: 0xff8c00,    // Orange
  up: 0xffffff,      // White
  down: 0xffff00,    // Yellow
  front: 0x008000,   // Green
  back: 0x0000ff,    // Blue
  inner: 0x111111,   // Inner faces (dark)
};

// Face to axis mapping
const FACE_CONFIG = {
  r: { axis: 'x', layer: 1, direction: -1 },
  l: { axis: 'x', layer: -1, direction: 1 },
  u: { axis: 'y', layer: 1, direction: -1 },
  d: { axis: 'y', layer: -1, direction: 1 },
  f: { axis: 'z', layer: 1, direction: -1 },
  b: { axis: 'z', layer: -1, direction: 1 },
};

/**
 * Load Three.js dynamically
 */
const loadThree = async () => {
  if (THREE) return THREE;
  THREE = await import(THREE_CDN);
  return THREE;
};

/**
 * Create a rounded box geometry (cubie)
 */
const createRoundedBox = (size, radius, segments = 4) => {
  const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);

  const positions = geometry.attributes.position;
  const vector = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    vector.fromBufferAttribute(positions, i);

    // Round the corners
    const x = Math.abs(vector.x);
    const y = Math.abs(vector.y);
    const z = Math.abs(vector.z);
    const max = size / 2;

    if (x > max - radius && y > max - radius && z > max - radius) {
      const nx = Math.sign(vector.x) * (max - radius + radius * vector.x / x / Math.sqrt((vector.x/x)**2 + (vector.y/y)**2 + (vector.z/z)**2));
      const ny = Math.sign(vector.y) * (max - radius + radius * vector.y / y / Math.sqrt((vector.x/x)**2 + (vector.y/y)**2 + (vector.z/z)**2));
      const nz = Math.sign(vector.z) * (max - radius + radius * vector.z / z / Math.sqrt((vector.x/x)**2 + (vector.y/y)**2 + (vector.z/z)**2));
      positions.setXYZ(i, nx || vector.x, ny || vector.y, nz || vector.z);
    }
  }

  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Create a single cubie with colored faces
 */
const createCubie = (x, y, z) => {
  const size = CONFIG.pieceSize;
  const geometry = new THREE.BoxGeometry(size, size, size);

  // Determine which faces should have colors
  const materials = [
    new THREE.MeshStandardMaterial({ color: x === 1 ? COLORS.right : COLORS.inner }), // +X (right)
    new THREE.MeshStandardMaterial({ color: x === -1 ? COLORS.left : COLORS.inner }), // -X (left)
    new THREE.MeshStandardMaterial({ color: y === 1 ? COLORS.up : COLORS.inner }),    // +Y (up)
    new THREE.MeshStandardMaterial({ color: y === -1 ? COLORS.down : COLORS.inner }), // -Y (down)
    new THREE.MeshStandardMaterial({ color: z === 1 ? COLORS.front : COLORS.inner }), // +Z (front)
    new THREE.MeshStandardMaterial({ color: z === -1 ? COLORS.back : COLORS.inner }), // -Z (back)
  ];

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.set(x, y, z);

  // Store logical position for rotation tracking
  mesh.userData = {
    cubePos: { x, y, z },
    originalPos: { x, y, z }
  };

  return mesh;
};

/**
 * Create the full 3x3 cube
 */
const createCube = () => {
  cubeGroup = new THREE.Group();
  pieces = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // Skip the center piece (not visible)
        if (x === 0 && y === 0 && z === 0) continue;

        const cubie = createCubie(x, y, z);
        pieces.push(cubie);
        cubeGroup.add(cubie);
      }
    }
  }

  scene.add(cubeGroup);
  return cubeGroup;
};

/**
 * Get pieces belonging to a face
 */
const getPiecesForFace = (face) => {
  const config = FACE_CONFIG[face.toLowerCase()];
  if (!config) return [];

  return pieces.filter(piece => {
    const pos = piece.userData.cubePos;
    return Math.round(pos[config.axis]) === config.layer;
  });
};

/**
 * Animate a face rotation
 */
const animateFace = (face, clockwise = true) => {
  return new Promise((resolve) => {
    if (isAnimating) {
      animationQueue.push({ face, clockwise, resolve });
      return;
    }

    isAnimating = true;
    const config = FACE_CONFIG[face.toLowerCase()];
    if (!config) {
      isAnimating = false;
      resolve();
      return;
    }

    const facePieces = getPiecesForFace(face);
    if (facePieces.length === 0) {
      isAnimating = false;
      resolve();
      return;
    }

    // Create rotation group
    const rotationGroup = new THREE.Group();
    scene.add(rotationGroup);

    // Move pieces to rotation group
    facePieces.forEach(piece => {
      cubeGroup.remove(piece);
      rotationGroup.add(piece);
    });

    // Animation parameters
    const targetAngle = (clockwise ? -1 : 1) * config.direction * Math.PI / 2;
    const duration = CONFIG.animationDuration;
    const startTime = performance.now();
    const startRotation = 0;

    // Easing function (ease-out cubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Animation loop
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentAngle = startRotation + (targetAngle - startRotation) * easedProgress;

      // Apply rotation based on axis
      if (config.axis === 'x') {
        rotationGroup.rotation.x = currentAngle;
      } else if (config.axis === 'y') {
        rotationGroup.rotation.y = currentAngle;
      } else {
        rotationGroup.rotation.z = currentAngle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete - finalize positions
        finishRotation(rotationGroup, facePieces, config, clockwise);
        isAnimating = false;
        resolve();

        // Process queue
        if (animationQueue.length > 0) {
          const next = animationQueue.shift();
          animateFace(next.face, next.clockwise).then(next.resolve);
        }
      }
    };

    requestAnimationFrame(animate);
  });
};

/**
 * Finalize rotation - update piece positions and return to main group
 */
const finishRotation = (rotationGroup, facePieces, config, clockwise) => {
  const angle = clockwise ? -1 : 1;

  facePieces.forEach(piece => {
    // Update world matrix
    piece.updateMatrixWorld();

    // Get world position and apply to local
    const worldPos = new THREE.Vector3();
    piece.getWorldPosition(worldPos);

    // Round to nearest integer position
    const newX = Math.round(worldPos.x);
    const newY = Math.round(worldPos.y);
    const newZ = Math.round(worldPos.z);

    // Update logical position
    piece.userData.cubePos = { x: newX, y: newY, z: newZ };

    // Remove from rotation group and add back to cube group
    rotationGroup.remove(piece);

    // Reset piece rotation and position
    piece.position.set(newX, newY, newZ);

    // Apply the rotation to the piece itself
    const rotationMatrix = new THREE.Matrix4();
    if (config.axis === 'x') {
      rotationMatrix.makeRotationX(angle * config.direction * Math.PI / 2);
    } else if (config.axis === 'y') {
      rotationMatrix.makeRotationY(angle * config.direction * Math.PI / 2);
    } else {
      rotationMatrix.makeRotationZ(angle * config.direction * Math.PI / 2);
    }
    piece.rotation.setFromRotationMatrix(
      rotationMatrix.multiply(new THREE.Matrix4().makeRotationFromEuler(piece.rotation))
    );

    cubeGroup.add(piece);
  });

  // Remove rotation group
  scene.remove(rotationGroup);
};

/**
 * Reset cube to solved state
 */
const resetCube = () => {
  if (cubeGroup) {
    scene.remove(cubeGroup);
  }
  pieces = [];
  createCube();
};

/**
 * Rotate entire cube view
 */
const rotateCubeView = (axis, angle) => {
  if (!cubeGroup) return;

  const duration = 300;
  const startTime = performance.now();
  const startRotation = cubeGroup.rotation[axis];
  const targetRotation = startRotation + angle;

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    cubeGroup.rotation[axis] = startRotation + (targetRotation - startRotation) * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

/**
 * Initialize the Three.js scene
 */
export const initThreeCube = async (container) => {
  await loadThree();

  // Scene setup
  scene = new THREE.Scene();
  scene.background = null; // Transparent background

  // Camera
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(4, 4, 6);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-5, -5, -5);
  scene.add(backLight);

  // Create cube
  createCube();

  // Initial rotation for nice view angle
  cubeGroup.rotation.x = -0.5;
  cubeGroup.rotation.y = 0.7;

  // Animation loop
  const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    renderer.render(scene, camera);
  };
  renderLoop();

  // Handle resize
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  window.addEventListener('resize', handleResize);

  return {
    rotateFace: animateFace,
    reset: resetCube,
    rotateCubeView,
  };
};

/**
 * Apply a move instantly (for scrambles)
 */
const applyMoveInstant = (face, clockwise = true) => {
  const config = FACE_CONFIG[face.toLowerCase()];
  if (!config) return;

  const facePieces = getPiecesForFace(face);
  if (facePieces.length === 0) return;

  const angle = clockwise ? -1 : 1;

  facePieces.forEach(piece => {
    const pos = piece.userData.cubePos;
    let newX = pos.x, newY = pos.y, newZ = pos.z;

    // Rotate position around axis
    if (config.axis === 'x') {
      newY = angle * config.direction * -pos.z;
      newZ = angle * config.direction * pos.y;
    } else if (config.axis === 'y') {
      newX = angle * config.direction * pos.z;
      newZ = angle * config.direction * -pos.x;
    } else {
      newX = angle * config.direction * -pos.y;
      newY = angle * config.direction * pos.x;
    }

    piece.userData.cubePos = { x: Math.round(newX), y: Math.round(newY), z: Math.round(newZ) };
    piece.position.set(Math.round(newX), Math.round(newY), Math.round(newZ));

    // Apply the rotation to the piece mesh
    const rotationMatrix = new THREE.Matrix4();
    if (config.axis === 'x') {
      rotationMatrix.makeRotationX(angle * config.direction * Math.PI / 2);
    } else if (config.axis === 'y') {
      rotationMatrix.makeRotationY(angle * config.direction * Math.PI / 2);
    } else {
      rotationMatrix.makeRotationZ(angle * config.direction * Math.PI / 2);
    }
    piece.rotation.setFromRotationMatrix(
      rotationMatrix.multiply(new THREE.Matrix4().makeRotationFromEuler(piece.rotation))
    );
  });
};

/**
 * Apply a full scramble sequence instantly
 */
export const applyScramble = (sequence) => {
  if (!THREE || !cubeGroup) return;

  sequence.forEach(token => {
    const base = token[0].toLowerCase();
    const isPrime = token.includes("'");
    const isDouble = token.includes("2");
    const turns = isDouble ? 2 : 1;

    for (let i = 0; i < turns; i++) {
      applyMoveInstant(base, !isPrime);
    }
  });
};

// Export face rotation function for external use
export const rotateFace = (face, prime = false) => {
  return animateFace(face, !prime);
};

export const rotateFacePrime = (face) => {
  return animateFace(face, false);
};

export { resetCube, rotateCubeView };
