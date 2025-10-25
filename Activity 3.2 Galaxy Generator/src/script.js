import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

/**
 * Base setup
 */
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

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
camera.position.set(4, 3, 6)
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor(0x050010, 1) // Even darker, almost black background

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Resize handling
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
 * Ambient and Point Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xff00ff, 3) // Intense pink/purple light
pointLight.position.set(8, 8, 8) // Further out, more dramatic
scene.add(pointLight)

const secondaryPointLight = new THREE.PointLight(0x00ffff, 2.5); // Cyan/blue secondary light
secondaryPointLight.position.set(-8, -8, -8);
scene.add(secondaryPointLight);


/**
 * Galaxy Generation
 */

const parameters = {}
parameters.count = 100000
parameters.size = 0.01
parameters.radius = 5
parameters.branches = 3
parameters.spin = 1
parameters.randomness = 0.2
parameters.randomnessPower = 3
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

let geometry = null
let material = null
let points = null

/**
 * Nebula :DD
 */
const customParams = {
    ...parameters,
    count: 250000, // Significantly more particles
    size: 0.015,   // Slightly larger particles
    radius: 7,     // Larger overall spread
    branches: 7,   // More branches for complexity
    spin: 1.8,     // Adjusted spin
    randomness: 0.4, // Increased randomness
    randomnessPower: 2.5, // Slightly less power for a softer spread
    insideColor: '#EE82EE', // Violet
    outsideColor: '#00FFFF', // Cyan
    midColor: '#FFD700' // Gold for a central glow
}

const generateGalaxy = () =>
{
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(customParams.count * 3)
    const colors = new Float32Array(customParams.count * 3)

    const colorInside = new THREE.Color(customParams.insideColor)
    const colorOutside = new THREE.Color(customParams.outsideColor)
    const colorMid = new THREE.Color(customParams.midColor);


    for(let i = 0; i < customParams.count; i++)
    {
        const i3 = i * 3
        const radius = Math.random() * customParams.radius
        const spinAngle = radius * customParams.spin
        const branchAngle = (i % customParams.branches) / customParams.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), customParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * customParams.randomness * radius
        const randomY = Math.pow(Math.random(), customParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * customParams.randomness * radius * 1.5 // Increased Y randomness for vertical spread
        const randomZ = Math.pow(Math.random(), customParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * customParams.randomness * radius

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius + randomX
        positions[i3 + 1] = randomY
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

        const mixedColor = colorInside.clone()
        mixedColor.lerp(colorOutside, radius / customParams.radius)
        if (radius < customParams.radius * 0.3) { // Blend with midColor near the center
            mixedColor.lerp(colorMid, (1 - radius / (customParams.radius * 0.3)));
        }
        
        colors[i3] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    material = new THREE.PointsMaterial({
        size: customParams.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    })

    points = new THREE.Points(geometry, material)
    scene.add(points)
}


generateGalaxy()

/**
 * Floating Stars
 */
const starGeometry = new THREE.BufferGeometry()
const starCount = 3000 // More background stars
const starPositions = new Float32Array(starCount * 3)

for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 150 // Wider spread for stars
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.07, // Slightly larger background stars
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8
})

const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)


/**
 * GUI Controls
 */
gui.add(parameters, 'count').min(100).max(200000).step(100).onFinishChange(generateGalaxy)
gui.add(parameters, 'size').min(0.001).max(0.05).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'radius').min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy)
gui.add(parameters, 'branches').min(2).max(20).step(1).onFinishChange(generateGalaxy)
gui.add(parameters, 'spin').min(-5).max(5).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomness').min(0).max(2).step(0.001).onFinishChange(generateGalaxy)
gui.add(parameters, 'randomnessPower').min(1).max(10).step(0.001).onFinishChange(generateGalaxy)
gui.addColor(parameters, 'insideColor').onFinishChange(generateGalaxy)
gui.addColor(parameters, 'outsideColor').onFinishChange(generateGalaxy)

gui.addColor(customParams, 'insideColor').onChange(generateGalaxy)
gui.addColor(customParams, 'outsideColor').onChange(generateGalaxy)
gui.addColor(customParams, 'midColor').onChange(generateGalaxy) // Add midColor to GUI
gui.add(customParams, 'count').min(1000).max(500000).step(1000).onChange(generateGalaxy)
gui.add(customParams, 'radius').min(1).max(30).step(1).onChange(generateGalaxy)
gui.add(customParams, 'branches').min(2).max(20).step(1).onChange(generateGalaxy)
gui.add(customParams, 'spin').min(-5).max(5).step(0.01).onChange(generateGalaxy)
gui.add(customParams, 'randomness').min(0).max(3).step(0.01).onChange(generateGalaxy)
gui.add(customParams, 'randomnessPower').min(1).max(10).step(0.1).onChange(generateGalaxy)


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    if(points) points.rotation.y = elapsedTime * 0.04
    
    stars.rotation.y = elapsedTime * 0.005 // Slower rotation for background stars

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()