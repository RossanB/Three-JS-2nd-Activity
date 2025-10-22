import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const gui = new dat.GUI();
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const doorColorTexture = textureLoader.load('textures/door/color.jpg');
const doorAlphaTexture = textureLoader.load('textures/door/alpha.jpg');
const grassColorTexture = textureLoader.load('textures/grass/color.jpg');
const grassNormalTexture = textureLoader.load('textures/grass/normal.jpg');
const grassRoughnessTexture = textureLoader.load('textures/grass/roughness.jpg');

grassColorTexture.repeat.set(8, 8);
grassNormalTexture.repeat.set(8, 8);
grassRoughnessTexture.repeat.set(8, 8);
grassColorTexture.wrapS = THREE.RepeatWrapping;
grassNormalTexture.wrapS = THREE.RepeatWrapping;
grassRoughnessTexture.wrapS = THREE.RepeatWrapping;
grassColorTexture.wrapT = THREE.RepeatWrapping;
grassNormalTexture.wrapT = THREE.RepeatWrapping;
grassRoughnessTexture.wrapT = THREE.RepeatWrapping;

const forest = new THREE.Group();
scene.add(forest);

const cottage = new THREE.Group();
scene.add(cottage);

const cottageWalls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 3, 4),
    new THREE.MeshStandardMaterial({ color: '#ffd1dc' })
);
cottageWalls.position.y = 1.5;
cottage.add(cottageWalls);

const cottageRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 2, 4),
    new THREE.MeshStandardMaterial({ color: '#ffb6c1' })
);
cottageRoof.rotation.y = Math.PI * 0.25;
cottageRoof.position.y = 3.5;
cottage.add(cottageRoof);

const cottageDoor = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        roughness: 0.6,
        metalness: 0.2,
        alphaMap: doorAlphaTexture,
        transparent: true,
        side: THREE.DoubleSide
    })
);
cottageDoor.position.y = 1;
cottageDoor.position.z = 2 + 0.01;
cottage.add(cottageDoor);

const windowGeometry = new THREE.PlaneGeometry(1, 1);
const windowMaterial = new THREE.MeshStandardMaterial({
    color: '#87cefa',
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    side: THREE.DoubleSide
});

const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
window1.position.set(-1.5, 2, 2.01);
cottage.add(window1);

const window2 = new THREE.Mesh(windowGeometry, windowMaterial);
window2.position.set(1.5, 2, 2.01);
cottage.add(window2);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
        normalMap: grassNormalTexture,
        roughnessMap: grassRoughnessTexture
    })
);
floor.geometry.setAttribute('uv2', new THREE.Float32BufferAttribute(floor.geometry.attributes.uv.array, 2));
floor.rotation.x = - Math.PI * 0.5;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

const ambientLight = new THREE.AmbientLight('#ffffff', 0.32);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight('#ffebcc', 0.9);
moonLight.position.set(6, 12, -6);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 4096;
moonLight.shadow.mapSize.height = 4096;
moonLight.shadow.camera.far = 200;
moonLight.shadow.camera.left = -60;
moonLight.shadow.camera.right = 60;
moonLight.shadow.camera.top = 60;
moonLight.shadow.camera.bottom = -60;
scene.add(moonLight);

const helperLight = new THREE.DirectionalLight('#fff6e6', 0.25);
helperLight.position.set(-6, 8, 6);
scene.add(helperLight);

const loader = new GLTFLoader();

let bunny1 = null;
let pumpkin = null;
let chestnut = null;

function placeModelOnGround(model, desiredPosition, scale) {
    model.scale.set(scale, scale, scale);
    const bbox = new THREE.Box3().setFromObject(model);
    const height = bbox.max.y - bbox.min.y || 1;
    model.position.set(desiredPosition.x, desiredPosition.y + height / 2, desiredPosition.z);
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material && child.material.color) child.material.needsUpdate = true;
        }
    });
    scene.add(model);
}

function loadModel(path, position, scale, color, assignName) {
    loader.load(path, (gltf) => {
        const model = gltf.scene;
        if (color) {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m) => { if (m.color) m.color.set(color); m.needsUpdate = true; });
                    } else {
                        if (child.material.color) child.material.color.set(color);
                        child.material.needsUpdate = true;
                    }
                }
            });
        }
        placeModelOnGround(model, position, scale);
        if (assignName === 'bunny') bunny1 = model;
        if (assignName === 'pumpkin') pumpkin = model;
        if (assignName === 'chestnut') chestnut = model;
    }, undefined, () => {});
}

loadModel('gltf/choco_bunny/scene.gltf', { x: 0, y: -1, z: 5 }, 0.6, '#a3a3c2', 'bunny');
loadModel('gltf/cute_pumpkin_3d/scene.gltf', { x: -3, y: -1, z: 6 }, 0.45, '#d6d6d6', 'pumpkin');
loadModel('gltf/little_chestnut/scene.gltf', { x: 3, y: -1, z: 6 }, 0.35, '#8f8f7c', 'chestnut');

const treeGroup = new THREE.Group();
forest.add(treeGroup);

const treeCount = 90;
const treeMinRadius = 18;
const treeMaxRadius = 30;
const frontAngle = Math.PI / 2;
const frontClearHalf = (30 * Math.PI) / 180 / 2;

function angleDiff(a, b) {
    let d = Math.abs(a - b) % (Math.PI * 2);
    if (d > Math.PI) d = Math.abs(d - Math.PI * 2);
    return d;
}

for (let i = 0; i < treeCount; i++) {
    let angle = Math.random() * Math.PI * 2;
    const radius = treeMinRadius + Math.random() * (treeMaxRadius - treeMinRadius);
    if (angleDiff(angle, frontAngle) < frontClearHalf) {
        angle += frontClearHalf + 0.1 + Math.random() * (Math.PI - frontClearHalf);
    }
    const jitter = (Math.random() - 0.5) * 0.5;
    const finalAngle = angle + jitter;
    const x = Math.cos(finalAngle) * radius;
    const z = Math.sin(finalAngle) * radius;
    const type = Math.random() > 0.5 ? 'pine' : 'oak';
    if (type === 'pine') {
        const cone = new THREE.ConeGeometry(1.6, 6, 6);
        const mat = new THREE.MeshStandardMaterial({ color: '#7fcf7f' });
        const tree = new THREE.Mesh(cone, mat);
        const scale = 0.9 + Math.random() * 2.2;
        tree.scale.set(scale, scale, scale);
        tree.position.set(x, 3 * scale, z);
        tree.castShadow = true;
        tree.receiveShadow = false;
        treeGroup.add(tree);
    } else {
        const trunk = new THREE.CylinderGeometry(0.4, 0.5, 2.6, 8);
        const foliage = new THREE.SphereGeometry(2.2, 10, 10);
        const trunkMesh = new THREE.Mesh(trunk, new THREE.MeshStandardMaterial({ color: '#6b3f2b' }));
        const foliageMesh = new THREE.Mesh(foliage, new THREE.MeshStandardMaterial({ color: '#98fb98' }));
        const scale = 0.8 + Math.random() * 1.8;
        trunkMesh.scale.set(scale, scale, scale);
        foliageMesh.scale.set(scale, scale, scale);
        trunkMesh.position.set(x, 1.3 * scale, z);
        foliageMesh.position.set(x, 3.2 * scale, z);
        trunkMesh.castShadow = true;
        foliageMesh.castShadow = true;
        treeGroup.add(trunkMesh);
        treeGroup.add(foliageMesh);
    }
}

const flowerGroup = new THREE.Group();
scene.add(flowerGroup);
const mushroomGroup = new THREE.Group();
scene.add(mushroomGroup);

function randomPointInFrontYard(minR, maxR) {
    const spread = Math.PI * 0.6;
    const base = Math.PI;
    const angle = base + (Math.random() - 0.5) * spread;
    const radius = minR + Math.random() * (maxR - minR);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 4;
    return new THREE.Vector3(x, 0, z);
}

function nearModels(x, z) {
    const d1 = Math.hypot(x - 0, z - 5);
    const d2 = Math.hypot(x + 3, z - 6);
    const d3 = Math.hypot(x - 3, z - 6);
    return Math.min(d1, d2, d3);
}

const flowerColors = ['#ffd1dc', '#ffeff5', '#ffe4b5', '#e6ffe6', '#f3e8ff'];

for (let i = 0; i < 70; i++) {
    let p = randomPointInFrontYard(3, 10);
    let tries = 0;
    while (nearModels(p.x, p.z) < 1.8 && tries < 15) {
        p = randomPointInFrontYard(3, 10);
        tries++;
    }
    const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), new THREE.MeshStandardMaterial({ color: color }));
    flower.position.set(p.x, 0.06, p.z);
    flower.castShadow = false;
    flower.receiveShadow = false;
    flowerGroup.add(flower);
}

for (let i = 0; i < 28; i++) {
    let p = randomPointInFrontYard(4, 10);
    let tries = 0;
    while (nearModels(p.x, p.z) < 2.2 && tries < 15) {
        p = randomPointInFrontYard(4, 10);
        tries++;
    }
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 8), new THREE.MeshStandardMaterial({ color: '#fff3e0' }));
    stem.position.set(p.x, 0.14, p.z);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: '#ffd1dc' }));
    cap.scale.y = 0.62;
    cap.position.set(p.x, 0.28, p.z);
    stem.castShadow = false;
    cap.castShadow = false;
    mushroomGroup.add(stem);
    mushroomGroup.add(cap);
}

const fireflyGroup = new THREE.Group();
scene.add(fireflyGroup);
const fireflies = [];
const fireflyCount = 28;
for (let i = 0; i < fireflyCount; i++) {
    const geo = new THREE.SphereGeometry(0.07, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffd88a', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
    const m = new THREE.Mesh(geo, mat);
    const radius = 2 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    m.userData = {
        baseRadius: radius,
        angle: angle,
        speed: 0.15 + Math.random() * 0.6,
        verticalOffset: Math.random() * 1.6 + 0.6,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.8 + Math.random() * 1.8
    };
    m.position.set(Math.cos(angle) * radius, 1 + Math.random() * 1.6, Math.sin(angle) * radius + 4);
    m.castShadow = false;
    m.receiveShadow = false;
    fireflyGroup.add(m);
    fireflies.push(m);
}

const sizes = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 400);
camera.position.set(10, 5, 18);
scene.add(camera);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 0.8, 4);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#f8fbff');
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const clock = new THREE.Clock();

function animateFireflies(elapsedTime) {
    for (let i = 0; i < fireflies.length; i++) {
        const f = fireflies[i];
        const d = f.userData;
        d.angle += d.speed * 0.008;
        const x = Math.cos(d.angle) * d.baseRadius;
        const z = Math.sin(d.angle) * d.baseRadius + 4;
        const y = Math.max(0.6, 0.8 + Math.sin(elapsedTime * d.speed + d.phase) * 0.6 + Math.sin(elapsedTime * 0.5 + i) * 0.12);
        f.position.set(x, y + d.verticalOffset, z);
        const pulse = (Math.sin(elapsedTime * d.pulseSpeed + d.phase) + 1) / 2;
        f.material.opacity = 0.15 + pulse * 0.85;
        const s = 0.35 + pulse * 1.0;
        f.scale.setScalar(s);
    }
}

function animateCharacters(elapsedTime) {
    if (bunny1) {
        const hop = Math.abs(Math.sin(elapsedTime * 1.9)) * 0.45 + 0.12;
        bunny1.position.y = hop;
        bunny1.position.z = 5;
    }
    if (pumpkin) {
        pumpkin.position.z = 6;
    }
    if (chestnut) {
        chestnut.position.z = 6;
    }
}

function tick() {
    const elapsedTime = clock.getElapsedTime();
    animateFireflies(elapsedTime);
    animateCharacters(elapsedTime);
    controls.update();
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
}

tick();
