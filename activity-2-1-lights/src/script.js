import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

const gui = new dat.GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

/**
 * Lights
 */
const spotLight = new THREE.SpotLight(0x78ff00, 5, 10, Math.PI * 0.1, 0.25, 1)
spotLight.position.set(0, 9, 3)
spotLight.target.position.x = 0.72
scene.add(spotLight)
scene.add(spotLight.target)

const spotLightHelper = new THREE.SpotLightHelper(spotLight)
scene.add(spotLightHelper)

const ambientLight = new THREE.AmbientLight(0x404040, 0.7)  // Brighter ambient light
scene.add(ambientLight)

/**
 * Objects
 */
const material = new THREE.MeshStandardMaterial({
    roughness: 0.2,    // Lower roughness for shinier surfaces
    metalness: 0.6,    // Increase metalness for a shinier, more defined look
})

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    material
)
sphere.position.x = -1.5

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.75, 0.75),
    material
)

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.3, 0.2, 32, 64),
    material
)
torus.position.x = 1.5

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(5, 5),
    material
)
plane.rotation.x = -Math.PI * 0.5
plane.position.y = -0.65

scene.add(sphere, cube, torus, plane)

/**
 * Particles
 */
const particlesGeometry = new THREE.BufferGeometry()
const particlesCount = 500   // Reduced particle count for a cleaner look
const positions = new Float32Array(particlesCount * 3)

for (let i = 0; i < particlesCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,   // Smaller particle size for subtlety
    opacity: 0.5,  // Reduced opacity for a softer effect
    transparent: true
})

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Mouse Interaction
 */
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    spotLight.position.x = Math.sin(elapsedTime) * 5
    spotLight.position.z = Math.cos(elapsedTime) * 5
    spotLight.color.setHSL((elapsedTime * 0.05) % 1, 1, 0.5)

    sphere.rotation.y = 0.1 * elapsedTime
    cube.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime

    sphere.rotation.x = 0.15 * elapsedTime
    cube.rotation.x = 0.15 * elapsedTime
    torus.rotation.x = 0.15 * elapsedTime

    raycaster.ray.origin.copy(camera.position)
    raycaster.ray.direction.set(mouse.x, mouse.y, 1).unproject(camera).sub(camera.position).normalize()

    const intersects = raycaster.intersectObject(cube)
    if (intersects.length > 0) {
        cube.scale.set(1.5, 1.5, 1.5)
    } else {
        cube.scale.set(1, 1, 1)
    }

    controls.update()

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()
