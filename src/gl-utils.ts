import { glMatrix, quat, vec3 } from "gl-matrix";

export function showError(errorText: string) 
{
    console.log(errorText);
    const errorBoxDiv = document.getElementById('error-box');
    if (errorBoxDiv === null)
    {
        return;
    }
    const errorElement = document.createElement('p');
    errorElement.innerText = errorText;
    errorBoxDiv.appendChild(errorElement);
}

export function createStaticIndexBuffer(gl: WebGL2RenderingContext, data: ArrayBufferView)
{
    const buffer = gl.createBuffer();
    if (!buffer)
    {
        showError('Failed to allocate buffer');
        return null;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return buffer;
}

export function createStaticVertexBuffer(gl: WebGL2RenderingContext, data: ArrayBufferView)
{
    const buffer = gl.createBuffer();
    if (!buffer)
    {
        showError('Failed to allocate buffer');
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return buffer;
}

export function createProgram(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string)
{
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();

    if (!vertexShader || !fragmentShader || !program)
    {
        console.log("SHADER ERROR");
        throw new Error('Failed to allocate GL objects ('
            + 'vs=${!!vertexShader}, '
            + 'fs=${!!fragmentShader}, '
            + 'program=${!!program})');
    }

    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
    {
        console.log("SHADER ERROR");
        const errorMessage = gl.getShaderInfoLog(vertexShader);
        throw new Error(`Failed to compile vertex shader: ${errorMessage}`);
    }

    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
        console.log("SHADER ERROR");
        const errorMessage = gl.getShaderInfoLog(fragmentShader);
        throw new Error(`Failed to compile fragment shader: ${errorMessage}`);
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        console.log("SHADER ERROR");
        const errorMessage = gl.getProgramInfoLog(program);
        throw new Error(`Failed to link GPU program: ${errorMessage}`);
    }
    
    return program;
}

export function getContext(canvas: HTMLCanvasElement)
{
    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl)
    {
        const isWebGl1Supported = !!(document.createElement('canvas')).getContext('webgl');
        if (isWebGl1Supported)
        {
            throw new Error('WebGL 1 is supported, but not v2 - try using a different device or browser');
        }
        else
        {
            console.log('WEB GL 2');
            throw new Error('WebGL is not supported on this device - try using a different device or browser');
        }
    }
    console.log('WEB GL 2');
    return gl;
}

export function getExtension(gl: WebGL2RenderingContext, extension: string)
{
    const ext = gl.getExtension(extension);
    if (!ext)
    {
        throw new Error('Extension not found.')
    }
    return ext;
}

export function getRandomInRange(min: number, max: number)
{
    return Math.random() * (max - min) + min;
}

// THANK YOU MOZILLA
function isPowerOf2(value: number)
{
    return (value & (value - 1)) === 0;
}

export function createTexture(gl: WebGL2RenderingContext,
    texWidth: number = 512,
    texHeight: number = 512,
    mipLevel: number = 0,
    internalFormat: number = gl.RGBA,
    srcFormat: number = gl.RGBA,
    border: number = 0,
    srcType: number = gl.UNSIGNED_BYTE,
    data: Uint8Array | null = null,
    texType: number = gl.TEXTURE_2D
)
{
    const texture = gl.createTexture();

    gl.bindTexture(texType, texture);

    gl.texImage2D(
        texType,
        mipLevel,
        internalFormat,
        texWidth,
        texHeight,
        border,
        srcFormat,
        srcType,
        data,
    );
    
    // WebGL1 has different requirements for power of 2 images
    if (isPowerOf2(texWidth) && isPowerOf2(texHeight))
    {
        gl.generateMipmap(texType);
        gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    else
    {
        gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    return texture;
}

export function loadTexture(gl: WebGL2RenderingContext, url: string, texType: number = gl.TEXTURE_2D)
{
    // Temp pixel to fill item while image is loading
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    const texture = createTexture(gl, width, height, level, internalFormat, srcFormat, border, srcType, pixel, texType);

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(texType, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(
            texType,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image,
        );

        // WebGL1 has different requirements for power of 2 images
        if (isPowerOf2(image.width) && isPowerOf2(image.height))
        {
            gl.generateMipmap(texType);
            gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        else
        {
            gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
    };

    image.src = url;

    return texture;
}

export function loadCubemap(
    gl: WebGL2RenderingContext,
    urls: string[]
): WebGLTexture | null
{
    if (urls.length !== 6)
    {
        showError("Cubemap needs 6 textures");
        return null;
    }

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    
    for (let i = 0; i < 6; i++)
    {
        gl.texImage2D(
            gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
            level,
            internalFormat,
            width,
            height,
            border,
            srcFormat,
            srcType,
            pixel,
        );
    }

    urls.forEach((url, i) => {
        const image = new Image();
        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, level, internalFormat, srcFormat, srcType, image);

            // mipmaps
            if (i === 5)
            {
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }
        };
        image.src = url;
    });

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    return texture;
}

export function eulerToDirection(pitch_: number, yaw_: number, roll_: number)
{
    const q = quat.create();
    quat.fromEuler(q, pitch_, -yaw_, roll_);
    
    const forward = vec3.fromValues(0, 0, -1);
    const dir = vec3.create();
    vec3.transformQuat(dir, forward, q);
    vec3.normalize(dir, dir);
    return dir;

}

// thanks to stefnotch from github
export function eulerToQuat(r: vec3): quat
{
    const roll = r[2] * Math.PI/180;
    const pitch = r[0] * Math.PI/180;
    const yaw = r[1] * Math.PI/180;
    let cr = Math.cos(roll * 0.5);
    let sr = Math.sin(roll * 0.5);
    let cp = Math.cos(pitch * 0.5);
    let sp = Math.sin(pitch * 0.5);
    let cy = Math.cos(yaw * 0.5);
    let sy = Math.sin(yaw * 0.5);

    let q = quat.create();
    q[3] = cr * cp * cy + sr * sp * sy;
    q[0] = sr * cp * cy - cr * sp * sy;
    q[1] = cr * sp * cy + sr * cp * sy;
    q[2] = cr * cp * sy - sr * sp * cy;

    return q;
}

export function quatToEuler(q: quat): vec3
{
    let out = vec3.create();

    // roll (z-axis rotation)
    let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
    let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    out[2] = Math.atan2(sinr_cosp, cosr_cosp) * 180/Math.PI;

    // pitch (x-axis rotation)
    let sinp = Math.sqrt(1 + 2 * (q[3] * q[1] - q[0] * q[2]));
    let cosp = Math.sqrt(1 - 2 * (q[3] * q[1] - q[0] * q[2]));
    out[0] = (2 *  Math.atan2(sinp, cosp) - Math.PI / 2) * 180/Math.PI;

    // yaw (y-axis rotation)
    let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
    let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
    out[1] =  Math.atan2(siny_cosp, cosy_cosp) * 180/Math.PI;

    return out;
}