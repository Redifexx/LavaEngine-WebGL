export const screenTextureFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D screenTexture;
uniform vec2 screenSize;

void main()
{
    /*
        // Calculate one pixel size in texture coordinates
        vec2 texelSize = 1.0 / screenSize;

        float kernel[9] = float[](
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 0.0
        );

        // Normalize kernel so weights sum to 1
        float kernelSum = 16.0;

        // Offsets for 3x3 neighborhood
        vec2 offsets[9] = vec2[](
            vec2(-1.0,  1.0), // top-left
            vec2( 0.0,  1.0), // top-center
            vec2( 1.0,  1.0), // top-right
            vec2(-1.0,  0.0), // center-left
            vec2( 0.0,  0.0), // center
            vec2( 1.0,  0.0), // center-right
            vec2(-1.0, -1.0), // bottom-left
            vec2( 0.0, -1.0), // bottom-center
            vec2( 1.0, -1.0)  // bottom-right
        );

        vec3 sampleTex[9];
        for(int i = 0; i < 9; i++)
        {
            sampleTex[i] = vec3(texture(screenTexture, TexCoords.st + offsets[i] * texelSize));
        }

        vec3 col = vec3(0.0);
        for (int i = 0; i < 9; i++) {
            col += sampleTex[i] * kernel[i];
        }

        FragColor = vec4(col, 1.0);
        FragColor = texture(screenTexture, TexCoords);
    */

    FragColor = texture(screenTexture, TexCoords);
}`;