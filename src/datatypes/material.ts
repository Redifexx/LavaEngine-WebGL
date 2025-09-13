import { Shader } from "./shader";
import { loadCubemap, loadTexture, showError } from "../gl-utils";
import { LavaEngine } from "../engine/lava-engine";
import { vec3 } from "gl-matrix";

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
    materialSettingUniformLocations: (WebGLUniformLocation | null)[] = new Array(5); // mat settings
    modelMatrixUniformLocation: WebGLUniformLocation | null;
    viewProjMatrixUniformLocation: WebGLUniformLocation | null;
    viewPosMatrixUniformLocation: WebGLUniformLocation  | null;
    viewMatrixUniformLocation: WebGLUniformLocation | null;
    projMatrixUniformLocation: WebGLUniformLocation | null;

    isCubemap: boolean = false; // once initialized as cubemap, can't be changed

    // ---- MATERIAL SETTINGS -------
    diffuseTint: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    specularFactor: number = 0.0;
    emissiveTint: vec3 = vec3.fromValues(1.0, 1.0, 1.0);
    emissiveFactor: number = 0.0;
    roughnessFactor: number = 1.0;


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
        
        this.materialSettingUniformLocations[0] = (shader.gl.getUniformLocation(shader.shaderProgram, 'material.diffuseTint'));
        this.materialSettingUniformLocations[1] = (shader.gl.getUniformLocation(shader.shaderProgram, 'material.specularFactor'));
        this.materialSettingUniformLocations[2] = (shader.gl.getUniformLocation(shader.shaderProgram, 'material.emissiveTint'));
        this.materialSettingUniformLocations[3] = (shader.gl.getUniformLocation(shader.shaderProgram, 'material.emissiveFactor'));
        this.materialSettingUniformLocations[4] = (shader.gl.getUniformLocation(shader.shaderProgram, 'material.roughnessFactor'));

        this.modelMatrixUniformLocation = shader.gl.getUniformLocation(shader.shaderProgram, 'modelMatrix');
        if (!this.modelMatrixUniformLocation && !isCubemap)
        {
            console.log("missing model matrix");
        }
        
        let location: WebGLUniformLocation | null;

        this.posAttrib = this.gl.getAttribLocation(shader.shaderProgram, 'vertexPosition');
        if (this.posAttrib < 0)
        {
            console.log("NO POS ATTRIB");
        }
        
        if (!isCubemap)
        {
            location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewProjMatrix')
            if (location === null)
            {
                
            }
            else
            {
                this.viewProjMatrixUniformLocation = location;
            }
            location = shader.gl.getUniformLocation(shader.shaderProgram, 'viewPosition')
            if (location === null)
            {
                
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
            this.setTex(1, loadTexture(this.gl, "textures/default_diffuse.png"));
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
            // Apply material settings
            this.shader.gl.uniform3fv(this.materialSettingUniformLocations[0], this.diffuseTint);
            this.shader.gl.uniform1f(this.materialSettingUniformLocations[1], this.specularFactor);
            this.shader.gl.uniform3fv(this.materialSettingUniformLocations[2], this.emissiveTint);
            this.shader.gl.uniform1f(this.materialSettingUniformLocations[3], this.emissiveFactor);
            this.shader.gl.uniform1f(this.materialSettingUniformLocations[4], this.roughnessFactor);

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

            //Skybox
            if (this.texUniformLocations[4] && LavaEngine.project.MAIN_SCENE.skybox)
            {
                this.shader.gl.activeTexture(this.shader.gl.TEXTURE4);
                this.shader.gl.bindTexture(this.shader.gl.TEXTURE_CUBE_MAP, LavaEngine.project.MAIN_SCENE.skybox);
                this.shader.gl.uniform1i(this.texUniformLocations[4], 4);
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

    getTex(texIndex: number): WebGLTexture | null
    {
        if (texIndex >= this.textures.length || texIndex < 0)
        {
            showError('Texture index doesnt exist');
            return null;
        }

        return this.textures[texIndex];
    }
};