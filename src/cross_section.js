import * as THREE from "three";
import engineVertexShader from "./shaders/engine_vertex.glsl";
import engineDepthFragmentShader from "./shaders/engine_depth_fragment.glsl";
import neuralVertexShader from "./shaders/neural_vertex.glsl";
import neuralFragmentShader from "./shaders/neural_fragment.glsl";
import neworkData from "./assets/neural/temperature_net.json";
import NeuralNet from "./neural_net";

const texture_size = 1024;

const depthEngineMaterial = new THREE.ShaderMaterial({
  uniforms: {
    cs_offset: { value: 0 },
    cs_direction: { value: [0, 0, 0] },
  },
  vertexShader: engineVertexShader,
  fragmentShader: engineDepthFragmentShader,
  side: THREE.DoubleSide,
  depthTest: false,
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
});

const scale_min = new THREE.Vector3(
  -1.71175567626953125e2,
  1.953493881225585938e1,
  5.863470458984375e1
);
const scale_max = new THREE.Vector3(
  7.7680419921875e1,
  2.099969635009765625e2,
  2.1848291015625e2
);

export default class CrossSection {
  constructor(scene, sourcePlane, engine, translation, scaling) {
    const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
    });
    this.planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(this.planeMesh);
    this.scene = scene;
    this.engine = engine;

    this.sourcePlane = sourcePlane;
    this.neuralNetwork = NeuralNet.fromJSON(neworkData);

    // Create an orthographic camera, and set its position
    this.orthoCamera = new THREE.OrthographicCamera(1, -1, 1, -1, -10, 10);

    // Create a render target, and set the texture of the plane to the render target
    this.depthTarget = new THREE.WebGLRenderTarget(texture_size, texture_size, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RedFormat,
      type: THREE.FloatType,
    });

    this.neuralTarget = new THREE.WebGLRenderTarget(
      texture_size,
      texture_size,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType,
      }
    );

    planeMaterial.map = this.neuralTarget.texture;
    {
      this.neuralScene = new THREE.Scene();
      const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
      planeGeometry.setAttribute(
        "worldPosition",
        (this.neuralPlanePosition = new THREE.Float32BufferAttribute(
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          3
        ))
      );
      this.neuralPlanePosition.setUsage(THREE.DynamicDrawUsage);

      const uniforms = {
        u_inside: { value: this.depthTarget.texture },
        u_scale: { value: scaling },
        u_translate: { value: translation },
        u_net_min: { value: scale_min },
        u_net_max: { value: scale_max },
      };
      this.neuralNetwork.setUniforms(uniforms);

      this.neuralMaterial = new THREE.ShaderMaterial({
        vertexShader: neuralVertexShader,
        fragmentShader:
          this.neuralNetwork.code("predictTemperature") + neuralFragmentShader,
        uniforms: uniforms,
        side: THREE.DoubleSide,
      });
      const planeMesh = new THREE.Mesh(planeGeometry, this.neuralMaterial);
      this.neuralScene.add(planeMesh);
      this.neuralCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    }
  }

  setCrossSection(direction, offset) {
    this.planeMesh.position.copy(direction).multiplyScalar(offset);
    this.planeMesh.lookAt(new THREE.Vector3());
  }

  renderTexture(renderer) {
    const mat = this.engine.material;
    depthEngineMaterial.uniforms.cs_offset.value = mat.uniforms.cs_offset.value;
    depthEngineMaterial.uniforms.cs_direction.value =
      mat.uniforms.cs_direction.value;
    this.planeMesh.lookAt(mat.uniforms.cs_direction.value);
    this.planeMesh.visible = false;
    this.orthoCamera.lookAt(mat.uniforms.cs_direction.value);
    this.engine.material = depthEngineMaterial;

    renderer.setRenderTarget(this.depthTarget);
    renderer.render(this.scene, this.orthoCamera);

    const alpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    [
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, -1, 0),
    ].forEach((v, i) => {
      v.applyMatrix4(this.planeMesh.matrixWorld);
      this.neuralPlanePosition.setXYZ(i, v.x, v.y, v.z);
    });
    this.neuralPlanePosition.needsUpdate = true;
    this.neuralMaterial.uniforms.u_inside.value = this.depthTarget.texture;
    renderer.setRenderTarget(this.neuralTarget);
    renderer.render(this.neuralScene, this.neuralCamera);
    renderer.setClearAlpha(alpha);

    renderer.setRenderTarget(null);
    this.planeMesh.visible = true;
    this.engine.material = mat;
  }
}
