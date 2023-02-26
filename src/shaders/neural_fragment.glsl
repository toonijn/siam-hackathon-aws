varying vec2 vPos;
uniform mediump sampler2D u_inside;
uniform vec3 u_translate;
uniform float u_scale;
uniform vec3 u_net_min;
uniform vec3 u_net_max;
varying vec3 vWorldPosition;

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

void main() {
  vec2 uv = 0.5 * (1.0 + vPos);
  float is_inside = texture(u_inside, uv).r;
  if (int(is_inside + 0.5) % 2 == 0)
    discard;

  vec3 position = ((vWorldPosition * u_scale + u_translate) - u_net_min) /
                  (u_net_max - u_net_min);

  float temp =
      predictTemperature(float[3](position.x, position.y, position.z))[0];
  gl_FragColor = color_scale(temp);
}
