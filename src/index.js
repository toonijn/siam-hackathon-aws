// Visualize a simple cube in three.js with orbit controls

import * as THREE from "three";
window.THREE = THREE;
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import testdata from "./assets/test400k_reduced.json";
import engineVertexShader from "./shaders/engine_vertex.glsl";
import engineFragmentShader from "./shaders/engine_fragment.glsl";
import CrossSection from "./cross_section";
import matcap from "./assets/matcap-porcelain-white.jpg";

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xffffff, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Add a vertical plane to the scene:
const plane = new THREE.Plane();

// Create cube
let geometry = new THREE.BufferGeometry();

// Read the geometry from testdata, a json with fields vertices and triangles
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(testdata.vertices.flat(), 3)
);
let max = testdata.temperature.reduce((a, b) => Math.max(a, b));
let min = testdata.temperature.reduce((a, b) => Math.min(a, b));
geometry.setAttribute(
  "temperature",
  new THREE.Float32BufferAttribute(
    testdata.temperature.map((a) => (a - min) / (max - min)),
    1
  )
);
geometry.setIndex(testdata.triangles.flat());
geometry.computeBoundingSphere();
const scaling = geometry.boundingSphere.radius;
const translation = geometry.boundingSphere.center.clone();
geometry.translate(-translation.x, -translation.y, -translation.z);
geometry.scale(1 / scaling, 1 / scaling, 1 / scaling);
geometry.computeBoundingSphere();
geometry = geometry.toNonIndexed();
geometry.computeVertexNormals();
geometry.normalizeNormals();

const textureLoader = new THREE.TextureLoader();
const engineMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    cs_offset: { value: 0 },
    cs_direction: { value: new THREE.Vector3() },
    u_matcap: { value: textureLoader.load(matcap) },
  },
  vertexShader: engineVertexShader,
  fragmentShader: engineFragmentShader,
  side: THREE.DoubleSide,
});

const engine = new THREE.Mesh(geometry, engineMaterial);
scene.add(engine);

// Set camera position
camera.position.x = -0.5;
camera.position.y = 1;
camera.position.z = 1.5;
controls.update();

const cs = new CrossSection(scene, plane, engine, translation, scaling);

cs.renderTexture(renderer);
// Add a textured plane. The texture is a render of the scene with an orhtographic camera camera

const slider = document.getElementById("cs-slider");

const cs_direction = new THREE.Vector3(1, 1, 0).normalize();
let last_slider = -10; // Some random value;
// Render scene
const animate = function () {
  requestAnimationFrame(animate);
  if (slider.value != last_slider) {
    last_slider = slider.value;
    cs.setCrossSection(cs_direction, slider.value);
    engineMaterial.uniforms.cs_offset.value = last_slider;
    engineMaterial.uniforms.cs_direction.value.copy(cs_direction);
    cs.renderTexture(renderer);
  }

  engineMaterial.uniforms.time.value += 0.01;
  // let t = 0.0001*+new Date();
  // plane.normal.set(Math.sin(t), 0, Math.cos(t));

  // Render scene
  renderer.render(scene, camera);
};

animate();
