import * as THREE from 'three'
import gsap from 'gsap'
import * as dat from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const particleVertexShader = `
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uTime;

  attribute float aScale;
  attribute float aRandomness;

  varying float vRandomness;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    float angle = atan(modelPosition.x, modelPosition.z);
    float distanceToCenter = length(modelPosition.xz);
    float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
    angle += angleOffset;
    modelPosition.x = cos(angle) * distanceToCenter;
    modelPosition.z = sin(angle) * distanceToCenter;
    modelPosition.y += sin(uTime + aRandomness * 10.0) * 0.1;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vRandomness = aRandomness;
  }
`;

const particleFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform sampler2D uAlphaMap;

  varying float vRandomness;

  void main() {
    float alpha = 1.0;

    if (vRandomness > 0.6) {
      float shimmerTime = uTime * (vRandomness * 2.5);
      alpha = 0.5 + sin(shimmerTime) * 0.5;
    }
    
    vec4 textureColor = texture2D(uAlphaMap, gl_PointCoord);
    gl_FragColor = vec4(uColor, alpha * textureColor.r);
  }
`;

const gui = new dat.GUI();
const parameters = {
  materialColor: 'ffc2d4', 
  titleText: 'Portfolio',
  font: 'Helvetiker' 
};

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const gradientTexture = textureLoader.load('textures/gradients/5.jpg');
gradientTexture.magFilter = THREE.NearestFilter;

const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
  transparent: true,
  opacity: 0.8
});

let titleMesh = null;
let currentFont = null;
const fontLoader = new FontLoader();
const fonts = {
  Helvetiker: './fonts/helvetiker_regular.typeface.json',
  Gentilis: './fonts/gentilis_regular.typeface.json'
};

function createTitle(textValue) {
  if (!currentFont) return;

  if (titleMesh) {
    scene.remove(titleMesh);
    titleMesh.geometry.dispose();
    titleMesh.material.dispose();
  }

  const titleGeometry = new TextGeometry(textValue, {
    font: currentFont,
    size: 0.45,
    height: 0.15,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3
  });
  titleGeometry.center();

  const titleMaterial = new THREE.MeshToonMaterial({
    color: parameters.materialColor,
    gradientMap: gradientTexture,
    emissive: '#ff99ff', 
    emissiveIntensity: 0.5
  });

  titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
  titleMesh.position.set(0, 1.1, 0);
  scene.add(titleMesh);

  gsap.to(titleMaterial, {
    emissiveIntensity: 0.8,
    duration: 2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1
  });
}

function loadFont(fontPath) {
  fontLoader.load(fontPath, (font) => {
    currentFont = font;
    createTitle(parameters.titleText);
  });
}

loadFont(fonts[parameters.font]);

const objectsDistance = 4;
const crystalMaterial = material.clone();
crystalMaterial.opacity = 0.5;

const mesh1 = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), crystalMaterial);
const mesh2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), material);
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);
const mesh4 = new THREE.Mesh(new THREE.DodecahedronGeometry(1), material);
const mesh5 = new THREE.Mesh(new THREE.TetrahedronGeometry(1.1, 0), material);

const glowSphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const glowSphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xff77ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const glowSphere = new THREE.Mesh(glowSphereGeometry, glowSphereMaterial);
mesh1.add(glowSphere);

mesh1.position.set(2, -0.8, 0);
mesh2.position.set(-2, -objectsDistance * 1, 0);
mesh3.position.set(2, -objectsDistance * 2, 0);
mesh4.position.set(-2, -objectsDistance * 3, 0);
mesh5.position.set(2, -objectsDistance * 4, 0);

scene.add(mesh1, mesh2, mesh3, mesh4, mesh5);
const sectionMeshes = [mesh1, mesh2, mesh3, mesh4, mesh5];

const directionalLight = new THREE.DirectionalLight('#ff99ff', 0.9);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);
scene.add(new THREE.AmbientLight('#ffccff', 0.5));

const particleTexture = textureLoader.load('textures/particles/8.png');
const particlesCount = 800;
const positions = new Float32Array(particlesCount * 3);
const scales = new Float32Array(particlesCount);
const randomness = new Float32Array(particlesCount);

for (let i = 0; i < particlesCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * 10;
  positions[i3 + 1] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length;
  positions[i3 + 2] = (Math.random() - 0.5) * 10;

  scales[i] = Math.random();
  randomness[i] = Math.random();
}

const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
particlesGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 1));

const particlesMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  transparent: true,
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 40.0 },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#ff77ff') }, 
    uAlphaMap: { value: particleTexture }
  }
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const bgParticleTexture = textureLoader.load('./textures/9.png');
const bgParticlesCount = 1000;
const bgPositions = new Float32Array(bgParticlesCount * 3);
const bgScales = new Float32Array(bgParticlesCount);

for (let i = 0; i < bgParticlesCount; i++) {
  const i3 = i * 3;
  bgPositions[i3] = (Math.random() - 0.5) * 50;
  bgPositions[i3 + 1] = (Math.random() - 0.5) * 50;
  bgPositions[i3 + 2] = (Math.random() - 0.5) * 50;
  bgScales[i] = Math.random() * 1.5;
}

const bgParticlesGeometry = new THREE.BufferGeometry();
bgParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
bgParticlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(bgScales, 1));

const bgParticlesMaterial = new THREE.ShaderMaterial({
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  transparent: true,
  vertexShader: `
    uniform float uPixelRatio;
    uniform float uSize;
    attribute float aScale;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectionPosition = projectionMatrix * viewPosition;

      gl_Position = projectionPosition;
      gl_PointSize = uSize * aScale * uPixelRatio;
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(1.0, 0.8, 1.0, 0.8); 
    }
  `,
  uniforms: {
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 5.0 }
  }
});

const bgParticles = new THREE.Points(bgParticlesGeometry, bgParticlesMaterial);
scene.add(bgParticles);

const sizes = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  particlesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  bgParticlesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
});

const cameraGroup = new THREE.Group();
scene.add(cameraGroup);
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
cameraGroup.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0);

let scrollY = window.scrollY;
let currentSection = 0;
window.addEventListener('scroll', () => {
  scrollY = window.scrollY;
  const newSection = Math.round(scrollY / sizes.height);
  if (newSection !== currentSection) {
    currentSection = newSection;
    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: 'power2.inOut',
      x: '+=6',
      y: '+=3',
      z: '+=1.5'
    });
  }
});

const cursor = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

gui.addColor(parameters, 'materialColor').name('Accent Color').onChange(() => {
  material.color.set(parameters.materialColor);
  crystalMaterial.color.set(parameters.materialColor);
  particlesMaterial.uniforms.uColor.value.set(parameters.materialColor);
  if (titleMesh) titleMesh.material.color.set(parameters.materialColor);
});

gui.add(parameters, 'titleText').name('Edit 3D Text').onFinishChange((value) => {
  createTitle(value);
});

gui.add(parameters, 'font', Object.keys(fonts)).name('Font Style').onChange((selected) => {
  loadFont(fonts[selected]);
});

const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  camera.position.y = -scrollY / sizes.height * objectsDistance;

  const parallaxX = cursor.x * 0.3;
  const parallaxY = -cursor.y * 0.3;
  cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime;
  cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime;

  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
    mesh.position.y += Math.sin(elapsedTime + mesh.position.x) * 0.002;
  }

  particles.material.uniforms.uTime.value = elapsedTime;
  bgParticles.rotation.y = elapsedTime * 0.02;

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
