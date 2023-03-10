
uniform float cs_offset;
uniform vec3 cs_direction;

varying vec3 vPos;
varying float vTemperature;
uniform float time;
void main() {
  if (dot(vPos, cs_direction) > cs_offset)
    discard;
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
