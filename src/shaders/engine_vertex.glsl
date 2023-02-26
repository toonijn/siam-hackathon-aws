varying vec3 vPos;
varying float vTemperature;
attribute float temperature;

void main() {
  vTemperature = temperature;
  vPos = position;
  vec4 pos = vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * pos;
}
