import * as THREE from 'three'

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js'
import {CutsomPass} from './CutsomPass.js'

import {RGBShiftShader} from 'three/examples/jsm/shaders/RGBShiftShader.js'
// import {DotScreenShader} from 'three/examples/jsm/shaders/DotScreenShader.js'

import {getProject, types as t} from '@theatre/core'
import studio from '@theatre/studio'

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

import fragment from './shader/fragment.glsl'
import vertex from './shader/vertex.glsl'

import t1 from '../img/1468.jpg'
import t2 from '../img/1475.jpg'
import t3 from '../img/2404.jpg'
import t4 from '../img/4417.jpg'

/// Reducing size for scaling purposes
const imgW = 2.766 / 2
const imgH = 3.456 / 2
const gap = imgW * 0.05

//// Replacement for dat.gui
//
studio.initialize()

const proj = getProject(
	// the ID of the project is "My first project"
	'First project'
)

// create a sheet
const sheet = proj.sheet(
	// Our sheet is identified as "Scene"
	'Scene'
)

// create an object
const distortion = sheet.object(
	// The object's key is "Fist object"
	'First object',
	// These are the object's default values (and as we'll later learn, its props types)
	{
		// we pick our first props's name to be "foo". It's default value is 0.
		// Theatre will determine that the type of this prop is a number
		progress: t.number(0, {range: [0, 1]}),
		// Second prop is a boolean called "bar", and it defaults to true.
		bar: true,
		// Last prop is a string
		baz: 'A string',
	}
)

export default class Sketch {
	constructor(options) {
		this.scene = new THREE.Scene()

		this.urls = [t1, t2, t3, t4]
		this.textures = this.urls.map(url => new THREE.TextureLoader().load(url))

		this.container = options.dom
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer = new THREE.WebGLRenderer()
		this.renderer.setPixelRatio(window.devicePixelRatio)
		this.renderer.setSize(this.width, this.height)
		this.renderer.setClearColor(0x161c1e, 1)
		this.renderer.outputEncoding = THREE.sRGBEncoding

		this.container.appendChild(this.renderer.domElement)

		this.camera = new THREE.PerspectiveCamera(
			70,
			window.innerWidth / window.innerHeight,
			0.001,
			1000
		)

		// var frustumSize = 10;
		// var aspect = window.innerWidth / window.innerHeight;
		// this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
		this.camera.position.set(0, 0, 2)
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0

		this.isPlaying = true

		this.initPost()

		this.addObjects()
		this.resize()
		this.render()
		this.setupResize()
		this.settings()

		distortion.onValuesChange(vals => {
			console.log(vals)

			this.effect1.uniforms['progress'].value = vals.progress
		})
	}

	settings() {
		// let that = this;
		this.settings = {
			progress: 0,
			scale: 1,
		}
		this.gui = new dat.GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
		this.gui.add(this.settings, 'scale', 0, 10, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height
		this.camera.updateProjectionMatrix()
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if (!this.isPlaying) {
			this.render()
			this.isPlaying = true
		}
	}

	initPost() {
		this.composer = new EffectComposer(this.renderer)
		this.composer.addPass(new RenderPass(this.scene, this.camera))

		this.effect1 = new ShaderPass(CutsomPass)
		this.composer.addPass(this.effect1)

		// const effect2 = new ShaderPass(RGBShiftShader)
		// effect2.uniforms['amount'].value = 0.0015
		// this.composer.addPass(effect2)
	}

	addObjects() {
		// let that = this;
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable',
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				progress: {value: 0},
				scale: {value: 0},
				resolution: {type: 'v4', value: new THREE.Vector4()},
				uTexture: {value: this.textures[0]},
				uvRate1: {
					value: new THREE.Vector2(1, 1),
				},
			},
			vertexShader: vertex,
			fragmentShader: fragment,
			// wireframe: true,
			// transparent: true,
		})

		this.geometry = new THREE.PlaneBufferGeometry(imgW, imgH, 1, 1)

		this.meshes = []
		this.textures.forEach((t, i) => {
			let m = this.material.clone()
			m.uniforms.uTexture.value = t
			let mesh = new THREE.Mesh(this.geometry, m)

			this.scene.add(mesh)
			this.meshes.push(mesh)
			mesh.position.x =
				(i * imgW) / 2 - (imgW / 2) * (this.textures.length - i) + imgW / 2

			const gapX =
				(i * gap) / 2 - (gap / 2) * (this.textures.length - i) + gap / 2

			mesh.position.x += gapX
		})
	}

	render() {
		if (!this.isPlaying) return

		this.meshes.forEach((m, i) => {
			// m.position.y = -this.settings.progress
			m.position.y = -distortion.value.progress
			// m.rotation.z = (this.settings.progress * Math.PI) / 2
			m.rotation.z = (distortion.value.progress * Math.PI) / 2
		})

		this.time += 0.01
		this.material.uniforms.time.value = this.time
		this.effect1.uniforms['time'].value = this.time
		// this.effect1.uniforms['progress'].value = this.settings.progress
		this.effect1.uniforms['scale'].value = this.settings.scale

		requestAnimationFrame(this.render.bind(this))
		// this.renderer.render(this.scene, this.camera)

		this.composer.render()
	}
}

new Sketch({
	dom: document.getElementById('container'),
})
