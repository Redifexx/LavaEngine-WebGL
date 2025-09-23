export const downsampleFragSdrSourceCode = `#version 300 es
precision mediump float;

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D uInput;
uniform vec2 uTexelSize;

uniform int mipLevel;

vec3 PowVec3(vec3 v, float p)
{
    return vec3(pow(v.x, p), pow(v.y, p), pow(v.z, p));
}

const float invGamma = 1.0 / 2.2;
vec3 ToSRGB(vec3 v)   { return PowVec3(v, invGamma); }

float sRGBToLuma(vec3 col)
{
    //return dot(col, vec3(0.2126f, 0.7152f, 0.0722f));
	return dot(col, vec3(0.299, 0.587, 0.114));
}

float KarisAverage(vec3 col)
{
	// Formula is 1 / (1 + luma)
	float luma = sRGBToLuma(ToSRGB(col)) * 0.25;
	return 1.0 / (1.0 + luma);
}


void main()
{
    vec2 srcTexelSize = uTexelSize;
    float x = srcTexelSize.x;
    float y = srcTexelSize.y;

    
    // Take 13 samples around current texel:
    // a - b - c
    // - j - k -
    // d - e - f
    // - l - m -
    // g - h - i
    // === ('e' is the current texel) ===

    float xp2 = TexCoords.x + 2.0 * x;
    float xn2 = TexCoords.x - 2.0 * x;
    float yp2 = TexCoords.y + 2.0 * y;
    float yn2 = TexCoords.y - 2.0 * y;
    
    vec3 a = texture(uInput, vec2(xn2, yp2)).rgb;
    vec3 b = texture(uInput, vec2(TexCoords.x,       yp2)).rgb;
    vec3 c = texture(uInput, vec2(xp2, yp2)).rgb;
    
    vec3 d = texture(uInput, vec2(xn2, TexCoords.y)).rgb;
    vec3 e = texture(uInput, vec2(TexCoords.x,       TexCoords.y)).rgb;
    vec3 f = texture(uInput, vec2(xp2, TexCoords.y)).rgb;

    vec3 g = texture(uInput, vec2(xn2, yn2)).rgb;
    vec3 h = texture(uInput, vec2(TexCoords.x,       yn2)).rgb;
    vec3 i = texture(uInput, vec2(xp2, yn2)).rgb;

    vec3 j = texture(uInput, vec2(TexCoords.x - x, TexCoords.y + y)).rgb;
    vec3 k = texture(uInput, vec2(TexCoords.x + x, TexCoords.y + y)).rgb;
    vec3 l = texture(uInput, vec2(TexCoords.x - x, TexCoords.y - y)).rgb;
    vec3 m = texture(uInput, vec2(TexCoords.x + x, TexCoords.y - y)).rgb;

    // Apply weighted distribution:
    // 0.5 + 0.125 + 0.125 + 0.125 + 0.125 = 1
    // a,b,d,e * 0.125
    // b,c,e,f * 0.125
    // d,e,g,h * 0.125
    // e,f,h,i * 0.125
    // j,k,l,m * 0.5
    // This shows 5 square areas that are being sampled. But some of them overlap,
    // so to have an energy preserving downsample we need to make some adjustments.
    // The weights are the distributed, so that the sum of j,k,l,m (e.g.)
    // contribute 0.5 to the final color output. The code below is written
    // to effectively yield this sum. We get:
    // 0.125*5 + 0.03125*4 + 0.0625*4 = 1

    // Check if we need to perform Karis average on each block of 4 samples
    vec3 downsample3 = vec3(0.0);
	vec3 groups[5];
	switch (mipLevel)
	{
	case 0:
	  // We are writing to mip 0, so we need to apply Karis average to each block
	  // of 4 samples to prevent fireflies (very bright subpixels, leads to pulsating
	  // artifacts).
	  groups[0] = (a+b+d+e) * (0.125/4.0);
	  groups[1] = (b+c+e+f) * (0.125/4.0);
	  groups[2] = (d+e+g+h) * (0.125/4.0);
	  groups[3] = (e+f+h+i) * (0.125/4.0);
	  groups[4] = (j+k+l+m) * (0.5/4.0);
	  groups[0] *= KarisAverage(groups[0]);
	  groups[1] *= KarisAverage(groups[1]);
	  groups[2] *= KarisAverage(groups[2]);
	  groups[3] *= KarisAverage(groups[3]);
	  groups[4] *= KarisAverage(groups[4]);
	  downsample3 = groups[0]+groups[1]+groups[2]+groups[3]+groups[4];
	  downsample3 = max(downsample3, 0.0001);
	  break;
	default:
	  downsample3 = e*0.125;                // ok
	  downsample3 += (a+c+g+i)*0.03125;     // ok
	  downsample3 += (b+d+f+h)*0.0625;      // ok
	  downsample3 += (j+k+l+m)*0.125;       // ok
	  break;
	}

    FragColor = vec4(downsample3, 1.0);
}`;