export const avgLumFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D uInput;

void main() {
    vec3 c = texture(uInput, TexCoords).rgb;
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    FragColor = vec4(lum, 0.0, 0.0, 1.0);
}`;