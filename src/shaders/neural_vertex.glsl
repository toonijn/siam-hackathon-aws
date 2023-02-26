varying vec2 vPos;
attribute vec3 worldPosition;
varying vec3 vWorldPosition;

void main() {
  vPos = position.xy;
  vWorldPosition = worldPosition;
  vec4 pos = vec4(position, 1.0);
  gl_Position = projectionMatrix * modelViewMatrix * pos;
}
