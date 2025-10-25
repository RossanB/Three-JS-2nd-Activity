import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Base setup
 */
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const particleTexture = textureLoader.load('/textures/particles/9.png')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3, 3, 7)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x0a0515, 1)

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.maxDistance = 15;
controls.minDistance = 3;

/**
 * Handle resize
 */
window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/** 
 *   Waves
 */ 
const count = 20000
const positions = new Float32Array(count * 3)
const colors = new Float32Array(count * 3)

for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const angle = Math.random() * Math.PI * 2
    const radius = (Math.random() * Math.random()) * 8 + 1
    const height = (Math.random() - 0.5) * 8
    
    positions[i3] = Math.cos(angle) * radius
    positions[i3 + 1] = height
    positions[i3 + 2] = Math.sin(angle) * radius

    const hue = (i / count) * 0.3 + 0.6;
    const saturation = 0.7 + Math.random() * 0.3;
    const lightness = 0.5 + Math.random() * 0.4;

    const color = new THREE.Color()
    color.setHSL(hue, saturation, lightness)

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
}

const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.15,
    sizeAttenuation: true,
    transparent: true,
    alphaMap: particleTexture,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
})

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Animation
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    particles.rotation.y = elapsedTime * 0.07
    particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05

    const positions = particlesGeometry.attributes.position.array
    for (let i = 0; i < count; i++) {
        const i3 = i * 3
        const x = positions[i3]
        const z = positions[i3 + 2]
        
        const wave1 = Math.sin(elapsedTime * 0.5 + x * 0.8 + z * 0.4) * 1.2
        const wave2 = Math.sin(elapsedTime * 0.8 + x * 0.3 + z * 0.7) * 0.6
        const wave3 = Math.cos(elapsedTime * 0.2 + x * 0.5 + z * 0.9) * 0.4

        positions[i3 + 1] = wave1 + wave2 + wave3;
    }
    particlesGeometry.attributes.position.needsUpdate = true

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()