uniform float cs_offset;
uniform vec3 cs_direction;
uniform sampler2D u_matcap;
varying vec3 vViewPosition;
varying vec3 vNormal;

vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);
vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
vec4 white = vec4(1.0, 1.0, 1.0, 1.0);

vec4 color_scale(float s) {
  s *= 2.0;
  if (s < 1.0)
    return mix(blue, red, s);
  else
    return mix(red, white, s - 1.0);
}

varying vec3 vPos;
varying float vTemperature;
uniform float time;
void main() {
  if (dot(vPos, cs_direction) > cs_offset)
    discard;

  vec3 normal = vNormal;
  if (gl_FrontFacing)
    normal = -normal;
  vec3 viewDir = normalize(vViewPosition);
  vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
  vec3 y = cross(viewDir, x);
  vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 +
            0.5; // 0.495 to remove artifacts caused by undersized matcap disks
  vec4 matcapColor = texture2D(u_matcap, uv);

  gl_FragColor = (0.2 + 0.8 * matcapColor) * color_scale(vTemperature);
}