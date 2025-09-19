import { glMatrix, quat, vec3 } from "gl-matrix";

export const degToRad = Math.PI / 180;
export const radToDeg = 180 / Math.PI;

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

export function createFrameBuffer(gl: WebGL2RenderingContext)
{
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer)
    {
        showError('Failed to allocate framebuffer');
        return null;
    }

    return framebuffer;
}

export function createRenderBuffer(gl: WebGL2RenderingContext)
{
    const renderbuffer = gl.createRenderbuffer();
    if (!renderbuffer)
    {
        showError('Failed to allocate framebuffer');
        return null;
    }

    return renderbuffer;
}

// Use this if making an attachment without needing to sample (depth/stencil)
export function allocateRenderBufferStorage(gl: WebGL2RenderingContext, rb: WebGLRenderbuffer, attachmentType: number, width: number = 512, height: number = 512): void
{
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorage(gl.RENDERBUFFER, attachmentType, width, height);
}


export function setFrameBufferColorAttachment(gl: WebGL2RenderingContext, framebuffer: WebGLFramebuffer, width: number = 512, height: number = 512, colorAttachmentIndex: number = 0)
{
    const texture = createTexture(gl, width, height, 0, gl.RGBA8, gl.RGBA, 0, gl.UNSIGNED_BYTE, null, gl.TEXTURE_2D);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + colorAttachmentIndex, gl.TEXTURE_2D, texture, 0);
    logFramebufferStatus(gl, "setFrameBufferColorAttachment");
    return texture;
}

// Use this if planning to sample from framebuffer
export function setFrameBufferDepthStencilAttachment(gl: WebGL2RenderingContext, framebuffer: WebGLFramebuffer, width: number = 512, height: number = 512): void
{
    const texture = createTexture(gl, width, height, 0, gl.DEPTH24_STENCIL8, gl.DEPTH_STENCIL, 0, gl.UNSIGNED_INT_24_8, null, gl.TEXTURE_2D);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, texture, 0);
    logFramebufferStatus(gl, "setFrameBufferDepthStencilAttachment");
}

export function attachRenderBufferToFrameBuffer(gl: WebGL2RenderingContext, fb: WebGLFramebuffer, rb: WebGLRenderbuffer, attachmentType: number)
{
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentType, gl.RENDERBUFFER, rb);
    logFramebufferStatus(gl, "attachRenderBufferToFrameBuffer");
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

export function createTexture(
    gl: WebGL2RenderingContext,
    texWidth: number = 512,
    texHeight: number = 512,
    mipLevel: number = 0,
    internalFormat: number = gl.RGBA8,
    srcFormat: number = gl.RGBA,
    border: number = 0,
    srcType: number = gl.UNSIGNED_BYTE,
    data: Uint8Array | null = null,
    texType: number = gl.TEXTURE_2D,
    hasMipmaps: boolean = true
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
        gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);

        if (hasMipmaps)
        {
            gl.generateMipmap(texType);
            gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        }
        else
        {
            gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    else
    {
        gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(texType, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }

    gl.bindTexture(texType, null);
    return texture;
}

export function loadTexture(gl: WebGL2RenderingContext, url: string, internalFormat: number = gl.RGBA8, texType: number = gl.TEXTURE_2D, hasMipmaps: boolean = true)
{
    // Temp pixel to fill item while image is loading
    const level = 0;
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
            gl.texParameteri(texType, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(texType, gl.TEXTURE_WRAP_T, gl.REPEAT);
            if (hasMipmaps)
            {
                gl.generateMipmap(texType);
                gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }
            else
            {
                gl.texParameteri(texType, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
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
    gl.bindTexture(texType, null);
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
export function eulerToQuatLocal(r: vec3): quat
{
    let q = quat.create();
    
    quat.rotateY(q, q, r[1] * degToRad);
    quat.rotateX(q, q, r[0] * degToRad);
    quat.rotateZ(q, q, r[2] * degToRad);

    return q;
}

export function eulerToQuatWorld(r: vec3): quat
{
    let q = quat.create();
    let temp = quat.create();

    quat.setAxisAngle(temp, [0, 1, 0], r[1] * degToRad); // Y
    quat.multiply(q, q, temp);

    quat.setAxisAngle(temp, [1, 0, 0], r[0] * degToRad); // X
    quat.multiply(q, q, temp);

    quat.setAxisAngle(temp, [0, 0, -1], r[2] * degToRad); // Z
    quat.multiply(q, q, temp);

    quat.normalize(q, q);

    return q;
}

export function quatToEuler(q: quat): vec3
{
    const out = vec3.create();

    // extract matrix elements
    const x = q[0], y = q[1], z = q[2], w = q[3];

    // yaw (Y)
    const sinYaw = 2 * (w * y + x * z);
    const cosYaw = 1 - 2 * (y * y + z * z);
    out[1] = Math.atan2(sinYaw, cosYaw);

    // pitch (X)
    const sinPitch = 2 * (w * x - y * z);
    // clamp to handle numerical errors
    out[0] = Math.abs(sinPitch) >= 1
        ? Math.sign(sinPitch) * Math.PI / 2
        : Math.asin(sinPitch);

    // roll (Z)
    const sinRoll = 2 * (w * z + x * y);
    const cosRoll = 1 - 2 * (x * x + z * z);
    out[2] = Math.atan2(sinRoll, cosRoll);

    // convert to degrees if you want
    vec3.scale(out, out, 180 / Math.PI);
    return out;
}

export function getQuatForward(q: quat): vec3
{
    const forward = vec3.fromValues(0, 0, -1);

    quat.normalize(q, q);
    vec3.transformQuat(forward, forward, q);

    return forward;
}

export function getQuatRight(q: quat): vec3
{
    const right = vec3.fromValues(1, 0, 0);

    quat.normalize(q, q);
    vec3.transformQuat(right, right, q);

    return right;
}

export function getQuatUp(q: quat): vec3
{
    const up = vec3.fromValues(0, 1, 0);

    quat.normalize(q, q);
    vec3.transformQuat(up, up, q);

    return up;
}

export function logFramebufferStatus(gl: WebGL2RenderingContext, label: string) {
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    let msg = "UNKNOWN";
    switch (status) {
        case gl.FRAMEBUFFER_COMPLETE: msg = "FRAMEBUFFER_COMPLETE"; break;
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: msg = "INCOMPLETE_ATTACHMENT"; break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: msg = "MISSING_ATTACHMENT"; break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: msg = "INCOMPLETE_DIMENSIONS (deprecated)"; break;
        case gl.FRAMEBUFFER_UNSUPPORTED: msg = "UNSUPPORTED"; break;
        case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: msg = "INCOMPLETE_MULTISAMPLE"; break;
        default: msg = `Unknown status: ${status}`;
    }
    if (msg !== "FRAMEBUFFER_COMPLETE")
    {
        console.warn(`[FBO status] ${label}: ${msg} (${status})`);
    }
    return status;
}