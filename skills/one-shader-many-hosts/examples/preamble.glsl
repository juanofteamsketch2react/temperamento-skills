#version 450
layout(set = 0, binding = 0) uniform Uniforms {
  float time; float speed; float energy; float beatPhase;
  float beatStrength; float p0; float p1; float p2;
  float p3; int palette; vec2 resolution;
} U;
layout(location = 0) in vec2 v_uv;
layout(location = 0) out vec4 o_color;

vec3 cosine_palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) { return a + b * cos(6.2831853 * (c * t + d)); }
vec3 palette(float t, int i) {
  switch (i) {
    case 1: return cosine_palette(t, vec3(.5), vec3(.5), vec3(1.), vec3(.0, .1, .2));
    case 2: return cosine_palette(t, vec3(.8, .5, .4), vec3(.2, .4, .2), vec3(2., 1., 1.), vec3(.0, .25, .25));
    case 3: return cosine_palette(t, vec3(.5), vec3(.5), vec3(1., 1., .5), vec3(.8, .9, .3));
    default: return cosine_palette(t, vec3(.5), vec3(.5), vec3(1.), vec3(.0, .33, .67));
  }
}
