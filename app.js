import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'
 
import particleTexture from './particle.png'

function lerp(a,b,t) {
	return a * (1-t)+ b * t
}

export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding


		this.raycaster = new THREE.Raycaster()
		this.pointer = new THREE.Vector2()
		this.point = new THREE.Vector3()
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 

		this.materials = []
		let opts = [
			{
				min_radius: 0.3,
				max_radius: 1.5,
				color: '#f7b373',
				size: 1,
				amp: 1,
			},
			{
				min_radius: 0.3,
				max_radius: 1.5,
				color: '#88b3ce',
				size: .5,
				amp: 3,
			}
		]

		opts.forEach(op => {
			this.addObjects(op)
		})


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 100
		)
 
		this.camera.position.set(0, 2, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


	 

		this.isPlaying = true

		//this.addObjects()		 
		this.resize()
		this.render()
		this.setupResize()
		this.raycasterEvent()
 
	}
	raycasterEvent() {

		let mesh = new THREE.Mesh(
			new THREE.PlaneGeometry(10, 10, 10, 10).rotateX(-Math.PI / 2),
			 new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}) )
 
			 let test = new THREE.Mesh(
				new THREE.SphereGeometry(0.1, 10, 10),
				 new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true}) )

 

		window.addEventListener('pointermove', event => {
			this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
			this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1

			this.raycaster.setFromCamera(this.pointer, this.camera)

			const intersects = this.raycaster.intersectObjects([
				mesh
			])
		 
			if(intersects[0]) {
				console.log(intersects[0].point);
				test.position.copy(intersects[0].point)
				this.point.copy(intersects[0].point)
			}


		})

		 

	}


	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
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


	addObjects(ops) {
		let that = this
		let count = 10000
		let min_radius = ops.min_radius
		let max_radius = ops.max_radius
		this.geometry = new THREE.BufferGeometry()
		// let geo = new THREE.InstancedBufferGeometry()
		// geo.instanceCount = count
		// geo.setAttribute('position', particlegeo.getAttribute('position'))
		// geo.index = particlegeo.index
		let pos = new Float32Array(count * 3)
 

		for (let i = 0; i < count; i++) {
			let angle = Math.random() * 2 * Math.PI
			let r = lerp(min_radius, max_radius, Math.random())

			let x = r* Math.sin(angle)
			let y = (Math.random() - 0.5) * 0.1
			let z = r* Math.cos(angle)

			
			pos.set([
				x,y,z
			], i * 3)



			// nick if you will need just usual plane you may utilize this
			// let angle = Math.random() * 2 * Math.PI
			// let r = lerp(2, 4, Math.random())

			// let x = Math.sin(r* Math.cos(angle))
			// let y =  r* Math.sin(angle  )
			// let z =   (Math.random() - 0.5) * 0.1


			 
			// positioin.set([x,y,z], i * 3);
			
	 
		}

		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos,3))
	 

		// geo.setAttribute('pos', new THREE.InstancedBufferAttribute(pos, 3, false))


		let material = new THREE.ShaderMaterial({
			// extensions: {
			// 	derivatives: '#extension GL_OES_standard_derivatives : enable'
			// },
			side: THREE.DoubleSide,
			uniforms: {
				uTexture: {value: new THREE.TextureLoader().load(particleTexture)},
				time: {value: 0},
				texturePosition: {value: null},
				textureVelocity: {value: null},
				u_hue: {value: 0},
				size: {value: ops.size},
				uAmp: {value: ops.amp},
				uMouse: {value: new THREE.Vector3()},
				uColor: {value: new THREE.Color(ops.color)},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader,
			transparent: true,
			vertexColors: true,
			depthTest: false,
		})
		
		this.materials.push(material)
		 
		this.points = new THREE.Points(this.geometry, material)
		//this.points.frustumCulled = false
		this.scene.add(this.points)
 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}

	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05

		this.materials.forEach(m => {
			m.uniforms.time.value = this.time * .5
			m.uniforms.uMouse.value = this.point
		 
		})
		
		//this.renderer.setRenderTarget(this.renderTarget)
		this.renderer.render(this.scene, this.camera)
		//this.renderer.setRenderTarget(null)
 
		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 