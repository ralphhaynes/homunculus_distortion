import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

import t1 from "../img/1468.jpg";
import t2 from "../img/1475.jpg";
import t3 from "../img/2404.jpg";
import t4 from "../img/4417.jpg";

/// Reducing size for scaling purposes
const imgW = 2.766 / 2;
const imgH = 3.456 / 2;
const gap  = imgW;

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.urls = [t1, t2, t3, t4];
    this.textures = this.urls.map((url) => new THREE.TextureLoader().load(url));

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x161c1e, 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings()
  }

  settings() {
    // let that = this;
    this.settings = {
      progress: 0
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  addObjects() {
    // let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { type: "v4", value: new THREE.Vector4() },
        uTexture: { value: this.textures[0] },
        uvRate1: {
          value: new THREE.Vector2(1, 1)
        }
      },
      vertexShader: vertex,
      fragmentShader: fragment
      // wireframe: true,
      // transparent: true,
    });

    this.geometry = new THREE.PlaneBufferGeometry(imgW, imgH, 1, 1);

    this.meshes = [];
    this.textures.forEach((t, i) => {
      let m = this.material.clone();
      m.uniforms.uTexture.value = t;
      let mesh = new THREE.Mesh(this.geometry, m);

      this.scene.add(mesh);
      this.meshes.push(mesh);
      // mesh.position.x = (imgW - (((imgW/2) * (this.textures.length - i)))) + ((imgW/2) * (i - 1));
      mesh.position.x = ((i * imgW/2) - ((imgW/2) * (this.textures.length - i))) + imgW/2
    });
  }

  render() {
    if (!this.isPlaying) return;

    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});
