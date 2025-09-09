import { Shader } from "./shader";
import { loadCubemap, loadTexture, showError } from "../gl-utils";

export class Material
{
    gl: WebGL2RenderingContext;
    shader: Shader;

    /* 
    Texture Array Format
    Diffuse        0
    Specular       1
    Normal(OGL)    2
    Emissive       3 
    Cubemap        4 
    Cubemap        5 
    */

    textures: (WebGLTexture | null) [] = new Array(6);
    texUniformLocations: (WebGLUniformLocation | null)[] = new Array(5);
    modelMatrixUniformLocation: WebGLUniformLocation | null;
    viewProjMatrixUniformLocation: WebGLUniformLocation | null;
    viewPosMatrixUniformLocation: WebGLUniformLocation  | null;
    viewMatrixUniformLocation: WebGLUniformLocation | null;
    projMatrixUniformLocation: WebGLUniformLocation | null;
    isCubemap: boolean = false; // once initialized as cubemap, can't be changed

    posAttrib: number = -1;
    texAttrib: number = -1;
    normAttrib: number = -1;

    constructor
    (
        shader: Shader, isCubemap: boolean = false
    ) {
        this.gl = shader.gl;
        this.shader = shader;
        this.isCubemap = isCubemap;

        if (!shader.shaderProgram)
        {
            throw new Error("Shader program is null!");
        }
        this.texUniformLocations[0] = (shader.gl.getUniformLocation(shader.shaderProgram, "tex0"));
        this.texUniformLocations[1] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex1'));
        this.texUniformLocations[2] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex2'));
        this.texUniformLocations[3] = (shader.gl.getUniformLocation(shader.shaderProgram, 'tex3'));

        this.texUniformLocations[4] = (shader.gl.getUniformLocation(shader.shaderProgram, 'skybox'));
        console.log(isCubemap);

        this.modelMatrixUniformLocation = shader.gl.getUniformLocation(shader.shaderProgram, 'modelMatrix');
        
        let location: WebGLUniformLocation | null;

        this.posAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexPosition');

        if (!isCubemap)
        {
            location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewProjMatrix')
            if (location === null)
            {
                throw new Error('Missing projection view matrix');
            }
            else
            {
                this.viewProjMatrixUniformLocation = location;
            }
            location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewPosition')
            if (location === null)
            {
                throw new Error('Missing view position matrix');
            }
            else
            {
                this.viewPosMatrixUniformLocation = location;
            }

            this.texAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexTexCoord');
            this.normAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexNormal');
        }
        else
        {
            location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewMatrix')
            if (location === null)
            {
                throw new Error('Missing view matrix');
            }
            else
            {
                this.viewMatrixUniformLocation = location;
            }

            location = shader.gl.getUniformLocation(shader.shaderProgram, 'projMatrix')
            if (location === null)
            {
                throw new Error('Missing proj matrix');
            }
            else
            {
                this.projMatrixUniformLocation = location;
            }
        }

        // Default Material Textures

        /*

            ORIENTATION
            -----------------
            POSITIVE_X - RIGHT
            NEGATIVE_X - LEFT
            POSITIVE_Y - TOP
            NEGATIVE_Y - BOTTOM
            NEGATIVE_Z - BACK
            POSITIVE_Z - FRONT

        */
        if (isCubemap)
        {
            this.textures[0] = loadCubemap(this.gl, [
                "textures/cubemaps/darkfantasy/DarkFantasy_E.png", // right | east
                "textures/cubemaps/darkfantasy/DarkFantasy_W.png", // left | west
                "textures/cubemaps/darkfantasy/DarkFantasy_U.png", // top | up
                "textures/cubemaps/darkfantasy/DarkFantasy_D.png", // bottom | down
                "textures/cubemaps/darkfantasy/DarkFantasy_N.png", // front | north
                "textures/cubemaps/darkfantasy/DarkFantasy_S.png", // back | south
            ])
        }
        else
        {
            this.setTex(0, loadTexture(this.gl, "textures/default_diffuse.png"));
            this.setTex(1, loadTexture(this.gl, "textures/default_spec.png"));
            this.setTex(3, loadTexture(this.gl, "textures/default_emis.png"));
        }
    }

    bindTextures()
    {
        if (this.isCubemap && this.texUniformLocations[4])
        {
            this.shader.gl.activeTexture(this.shader.gl.TEXTURE0);
            this.shader.gl.bindTexture(this.shader.gl.TEXTURE_CUBE_MAP, this.textures[0]);
            this.shader.gl.uniform1i(this.texUniformLocations[4], 0);
        }
        else
        {
            // Tex 0
            if (this.texUniformLocations[0] && this.textures[0])
            {
                this.shader.gl.activeTexture(this.shader.gl.TEXTURE0);
                this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[0]);
                this.shader.gl.uniform1i(this.texUniformLocations[0], 0);
            }

            // Tex 1
            if (this.texUniformLocations[1] && this.textures[1])
            {
                this.shader.gl.activeTexture(this.shader.gl.TEXTURE1);
                this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[1]);
                this.shader.gl.uniform1i(this.texUniformLocations[1], 1);
            }
            
            // Tex 2
            if (this.texUniformLocations[2] && this.textures[2])
            {
                this.shader.gl.activeTexture(this.shader.gl.TEXTURE2);
                this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[2]);
                this.shader.gl.uniform1i(this.texUniformLocations[2], 2);
            }

            // Tex 3
            if (this.texUniformLocations[3] && this.textures[3])
            {
                this.shader.gl.activeTexture(this.shader.gl.TEXTURE3);
                this.shader.gl.bindTexture(this.shader.gl.TEXTURE_2D, this.textures[3]);
                this.shader.gl.uniform1i(this.texUniformLocations[3], 3);
            }
        }
    }

    setTex(texIndex: number, texMap: WebGLTexture)
    {
        if (texIndex >= this.textures.length)
        {
            showError('Texture index doesnt exist');
            return;
        }

        this.textures[texIndex] = texMap;
    }
};