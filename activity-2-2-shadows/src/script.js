import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

const gui = new dat.GUI()
const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
directionalLight.position.set(2, 2, - 1)
gui.add(directionalLight, 'intensity').min(0).max(1).step(0.001)
gui.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001)
gui.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001)
gui.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001)
directionalLight.castShadow = true
scene.add(directionalLight)

const spotLight = new THREE.SpotLight(0xffffff, 0.4, 10, Math.PI * 0.3)
spotLight.castShadow = false
spotLight.position.set(0, 2, 2)
spotLight.target.position.set(0, 0, 0)
gui.add(spotLight, 'intensity').min(0).max(1).step(0.001)
scene.add(spotLight)
scene.add(spotLight.target)

const pointLight = new THREE.PointLight(0xffffff, 0.3)
pointLight.castShadow = false
pointLight.position.set(- 1, 1, 0)
scene.add(pointLight)

const material = new THREE.MeshStandardMaterial({
    roughness: 0.7,
    metalness: 0.3,
})
gui.add(material, 'metalness').min(0).max(1).step(0.001)
gui.add(material, 'roughness').min(0).max(1).step(0.001)

const textureLoader = new THREE.TextureLoader()
const simpleShadow = textureLoader.load('/textures/simpleShadow.jpg')

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    material
)
sphere.castShadow = true

const plane = new THREE.Mesh(   
    new THREE.PlaneGeometry(5, 5),
    material
)
plane.rotation.x = - Math.PI * 0.5
plane.position.y = - 0.5

const sphereShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        alphaMap: simpleShadow
    })
)
sphereShadow.rotation.x = - Math.PI * 0.5
sphereShadow.position.y = plane.position.y + 0.01
scene.add(sphere, sphereShadow, plane)

const particleCount = 500
const particlesGeometry = new THREE.BufferGeometry()
const positions = new Float32Array(particleCount * 3)

for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    opacity: 0.3,
    transparent: true
})

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

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

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    sphere.position.x = Math.cos(elapsedTime) * 1.5
    sphere.position.z = Math.sin(elapsedTime) * 1.5
    sphere.position.y = Math.abs(Math.sin(elapsedTime * 3))

    sphereShadow.position.x = sphere.position.x
    sphereShadow.position.z = sphere.position.z
    sphereShadow.material.opacity = (1 - sphere.position.y) * 0.3

    spotLight.color.setHSL((elapsedTime * 0.05) % 1, 1, 0.5)
    spotLight.intensity = Math.sin(elapsedTime * 0.5) * 0.5 + 0.5

    camera.position.x += (Math.random() - 0.5) * 0.01
    camera.position.y += (Math.random() - 0.5) * 0.01

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()
