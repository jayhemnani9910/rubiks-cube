/**
 * Three.js Rubik's Cube Implementation
 * Supports dynamic cube sizes (2x2 to 7x7) with smooth animations
 */

// Import Three.js from CDN
const THREE_CDN = "https://unpkg.com/three@0.160.0/build/three.module.js";

let THREE = null;
let scene, camera, renderer, cubeGroup;
let pieces = [];
let isAnimating = false;
let animationQueue = [];
let currentSize = 3;
let currentFaceConfig = null;

// Configuration
const CONFIG = {
  pieceSize: 0.9,        // Piece size (slightly smaller for visible gaps)
  pieceGap: 0.1,         // Gap between pieces
  cornerRadius: 0.08,    // Rounded corner radius
  animationDuration: 400, // Faster, snappier animations
  baseCameraDistance: 5,
};

// Face colors (vibrant, modern palette)
const COLORS = {
  right: 0xef4444,   // Red (brighter)
  left: 0xf97316,    // Orange
  up: 0xffffff,      // White
  down: 0xfde047,    // Yellow (brighter)
  front: 0x22c55e,   // Green (brighter)
  back: 0x3b82f6,    // Blue (brighter)
  inner: 0x1a1a1a,   // Dark inner faces
};

/**
 * Get face configuration for a given cube size
 */
const getFaceConfig = (size) => {
  const half = (size - 1) / 2;
  return {
    r: { axis: 'x', layer: half, direction: -1 },
    l: { axis: 'x', layer: -half, direction: 1 },
    u: { axis: 'y', layer: half, direction: -1 },
    d: { axis: 'y', layer: -half, direction: 1 },
    f: { axis: 'z', layer: half, direction: -1 },
    b: { axis: 'z', layer: -half, direction: 1 },
  };
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
 * Create a rounded box geometry for better visuals
 */
const createRoundedBox = (size, radius, segments = 3) => {
  const geometry = new THREE.BoxGeometry(size, size, size, segments, segments, segments);
  const positions = geometry.attributes.position;
  const vector = new THREE.Vector3();
  const halfSize = size / 2;

  for (let i = 0; i < positions.count; i++) {
    vector.fromBufferAttribute(positions, i);

    const x = Math.abs(vector.x);
    const y = Math.abs(vector.y);
    const z = Math.abs(vector.z);

    // Round corners where all three coordinates are near the edge
    if (x > halfSize - radius && y > halfSize - radius && z > halfSize - radius) {
      const cornerX = Math.sign(vector.x) * (halfSize - radius);
      const cornerY = Math.sign(vector.y) * (halfSize - radius);
      const cornerZ = Math.sign(vector.z) * (halfSize - radius);

      const dx = vector.x - cornerX;
      const dy = vector.y - cornerY;
      const dz = vector.z - cornerZ;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (len > 0) {
        const scale = radius / len;
        positions.setXYZ(i,
          cornerX + dx * scale,
          cornerY + dy * scale,
          cornerZ + dz * scale
        );
      }
    }
  }

  geometry.computeVertexNormals();
  return geometry;
};

/**
 * Create a single cubie with colored faces
 */
const createCubie = (x, y, z, size) => {
  const half = (size - 1) / 2;
  const pieceSize = CONFIG.pieceSize;

  // Use rounded box for better visuals
  const geometry = createRoundedBox(pieceSize, CONFIG.cornerRadius);

  // Determine which faces should have colors based on position
  const isRightFace = Math.abs(x - half) < 0.01;
  const isLeftFace = Math.abs(x + half) < 0.01;
  const isUpFace = Math.abs(y - half) < 0.01;
  const isDownFace = Math.abs(y + half) < 0.01;
  const isFrontFace = Math.abs(z - half) < 0.01;
  const isBackFace = Math.abs(z + half) < 0.01;

  // Create materials with better visual properties
  const createMaterial = (color) => new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.35,      // Slightly glossy plastic
    metalness: 0.0,       // Non-metallic
    flatShading: false,
  });

  const materials = [
    createMaterial(isRightFace ? COLORS.right : COLORS.inner),  // +X
    createMaterial(isLeftFace ? COLORS.left : COLORS.inner),    // -X
    createMaterial(isUpFace ? COLORS.up : COLORS.inner),        // +Y
    createMaterial(isDownFace ? COLORS.down : COLORS.inner),    // -Y
    createMaterial(isFrontFace ? COLORS.front : COLORS.inner),  // +Z
    createMaterial(isBackFace ? COLORS.back : COLORS.inner),    // -Z
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
 * Create the full NxN cube
 */
const createCube = (size = 3) => {
  currentSize = size;
  currentFaceConfig = getFaceConfig(size);

  cubeGroup = new THREE.Group();
  pieces = [];

  const half = (size - 1) / 2;

  for (let xi = 0; xi < size; xi++) {
    for (let yi = 0; yi < size; yi++) {
      for (let zi = 0; zi < size; zi++) {
        // Only create visible pieces (those with at least one external face)
        const isExternal = xi === 0 || xi === size - 1 ||
                          yi === 0 || yi === size - 1 ||
                          zi === 0 || zi === size - 1;

        if (!isExternal) continue;

        // Convert grid index to centered position
        const x = xi - half;
        const y = yi - half;
        const z = zi - half;

        const cubie = createCubie(x, y, z, size);
        pieces.push(cubie);
        cubeGroup.add(cubie);
      }
    }
  }

  scene.add(cubeGroup);

  // Adjust camera for cube size
  updateCameraForSize(size);

  return cubeGroup;
};

/**
 * Update camera position based on cube size
 */
const updateCameraForSize = (size) => {
  if (!camera) return;

  const distance = CONFIG.baseCameraDistance + (size - 3) * 0.7;
  camera.position.set(distance * 0.8, distance * 0.8, distance);
  camera.lookAt(0, 0, 0);
};

/**
 * Get pieces belonging to a face
 */
const getPiecesForFace = (face) => {
  if (!currentFaceConfig) return [];
  const config = currentFaceConfig[face.toLowerCase()];
  if (!config) return [];

  const tolerance = 0.01;
  return pieces.filter(piece => {
    const pos = piece.userData.cubePos;
    return Math.abs(pos[config.axis] - config.layer) < tolerance;
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
    if (!currentFaceConfig) {
      isAnimating = false;
      resolve();
      return;
    }

    const config = currentFaceConfig[face.toLowerCase()];
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

    // Create rotation group as child of cubeGroup
    const rotationGroup = new THREE.Group();
    cubeGroup.add(rotationGroup);

    // Move pieces to rotation group
    facePieces.forEach(piece => {
      cubeGroup.remove(piece);
      rotationGroup.add(piece);
    });

    // Animation parameters
    const targetAngle = (clockwise ? -1 : 1) * config.direction * Math.PI / 2;
    const duration = CONFIG.animationDuration;
    const startTime = performance.now();

    // Easing function (ease-out cubic)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    // Animation loop
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentAngle = targetAngle * easedProgress;

      // Apply rotation based on axis
      rotationGroup.rotation[config.axis] = currentAngle;

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
  rotationGroup.updateMatrix();

  facePieces.forEach(piece => {
    // Compute new position by applying rotationGroup's rotation
    const newPos = piece.position.clone().applyMatrix4(rotationGroup.matrix);

    // Round to nearest grid position (handles floating point errors)
    const half = (currentSize - 1) / 2;
    const roundToGrid = (val) => {
      // Round to nearest valid grid position
      const gridVal = Math.round(val * 2) / 2;
      return Math.max(-half, Math.min(half, gridVal));
    };

    const newX = roundToGrid(newPos.x);
    const newY = roundToGrid(newPos.y);
    const newZ = roundToGrid(newPos.z);

    // Update logical position
    piece.userData.cubePos = { x: newX, y: newY, z: newZ };

    // Remove from rotation group
    rotationGroup.remove(piece);
    piece.position.set(newX, newY, newZ);

    // Apply rotation to piece orientation
    const targetAngle = (clockwise ? -1 : 1) * config.direction * Math.PI / 2;
    const rotationMatrix = new THREE.Matrix4();

    if (config.axis === 'x') {
      rotationMatrix.makeRotationX(targetAngle);
    } else if (config.axis === 'y') {
      rotationMatrix.makeRotationY(targetAngle);
    } else {
      rotationMatrix.makeRotationZ(targetAngle);
    }

    const existingMatrix = new THREE.Matrix4().makeRotationFromEuler(piece.rotation);
    const combinedMatrix = rotationMatrix.clone().multiply(existingMatrix);
    piece.rotation.setFromRotationMatrix(combinedMatrix);

    cubeGroup.add(piece);
  });

  cubeGroup.remove(rotationGroup);
};

/**
 * Reset cube to solved state
 */
const resetCube = () => {
  if (cubeGroup) {
    scene.remove(cubeGroup);
  }
  pieces = [];
  animationQueue = [];
  isAnimating = false;
  createCube(currentSize);

  // Reset view angle
  cubeGroup.rotation.x = -0.4;
  cubeGroup.rotation.y = 0.6;
};

/**
 * Rebuild cube with a new size
 */
export const rebuildCube = (newSize) => {
  currentSize = newSize;
  resetCube();
};

/**
 * Rotate entire cube view
 */
const rotateCubeView = (axis, angle) => {
  if (!cubeGroup) return;

  const duration = 250;
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
export const initThreeCube = async (container, size = 3) => {
  await loadThree();

  currentSize = size;

  // Scene setup
  scene = new THREE.Scene();
  scene.background = null;

  // Camera
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 1000);

  // Renderer with better quality
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Enhanced lighting for better visuals
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Key light (main)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(5, 8, 6);
  scene.add(keyLight);

  // Fill light (softer, from opposite side)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-4, 4, -4);
  scene.add(fillLight);

  // Rim light (back light for edge definition)
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
  rimLight.position.set(0, -5, -8);
  scene.add(rimLight);

  // Create cube with specified size
  createCube(size);

  // Initial rotation for nice view angle
  cubeGroup.rotation.x = -0.4;
  cubeGroup.rotation.y = 0.6;

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
    rebuildCube,
  };
};

/**
 * Apply a move instantly (for scrambles)
 */
const applyMoveInstant = (face, clockwise = true) => {
  if (!currentFaceConfig) return;
  const config = currentFaceConfig[face.toLowerCase()];
  if (!config) return;

  const facePieces = getPiecesForFace(face);
  if (facePieces.length === 0) return;

  const targetAngle = (clockwise ? -1 : 1) * config.direction * Math.PI / 2;
  const sign = (clockwise ? -1 : 1) * config.direction;
  const half = (currentSize - 1) / 2;

  const roundToGrid = (val) => {
    const gridVal = Math.round(val * 2) / 2;
    return Math.max(-half, Math.min(half, gridVal));
  };

  facePieces.forEach(piece => {
    const pos = piece.userData.cubePos;
    let newX = pos.x, newY = pos.y, newZ = pos.z;

    // Rotate position around axis
    if (config.axis === 'x') {
      newY = -pos.z * sign;
      newZ = pos.y * sign;
    } else if (config.axis === 'y') {
      newX = pos.z * sign;
      newZ = -pos.x * sign;
    } else {
      newX = -pos.y * sign;
      newY = pos.x * sign;
    }

    piece.userData.cubePos = {
      x: roundToGrid(newX),
      y: roundToGrid(newY),
      z: roundToGrid(newZ)
    };
    piece.position.set(roundToGrid(newX), roundToGrid(newY), roundToGrid(newZ));

    // Apply rotation to piece orientation
    const rotationMatrix = new THREE.Matrix4();
    if (config.axis === 'x') {
      rotationMatrix.makeRotationX(targetAngle);
    } else if (config.axis === 'y') {
      rotationMatrix.makeRotationY(targetAngle);
    } else {
      rotationMatrix.makeRotationZ(targetAngle);
    }

    const existingMatrix = new THREE.Matrix4().makeRotationFromEuler(piece.rotation);
    const combinedMatrix = rotationMatrix.clone().multiply(existingMatrix);
    piece.rotation.setFromRotationMatrix(combinedMatrix);
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

/**
 * Get current cube size
 */
export const getCurrentSize = () => currentSize;

// Export functions
export const rotateFace = (face, prime = false) => {
  return animateFace(face, !prime);
};

export const rotateFacePrime = (face) => {
  return animateFace(face, false);
};

export { resetCube, rotateCubeView };
