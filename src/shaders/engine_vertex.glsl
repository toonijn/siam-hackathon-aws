varying vec3 vPos;
varying float vTemperature;
varying vec3 vViewPosition;
attribute float temperature;
varying vec3 vNormal;

void main() {
  vNormal = (modelMatrix * vec4(normal, 0.0)).xyz;

  vTemperature = temperature;
  vPos = position;
  vec4 pos = vec4(position, 1.0);
  vec4 mvPosition = modelViewMatrix * pos;
  gl_Position = projectionMatrix * mvPosition;
  vViewPosition = -mvPosition.xyz;
}
