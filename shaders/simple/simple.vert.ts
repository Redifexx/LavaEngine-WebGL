export const simpleVertSdrSourceCode = `#version 300 es
layout(location = 0) in vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.5, 1.0); // z = 0.5 in clip-space -> depth ~0.5
}`;