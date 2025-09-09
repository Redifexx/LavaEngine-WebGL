import { Scene } from "../gameobjects/scene";
import { showError } from "../gl-utils";

export abstract class Project
{
    scenes: Set<Scene> = new Set();
    GL_CONTEXT: WebGL2RenderingContext;
    abstract MAIN_SCENE: Scene;

    constructor(gl: WebGL2RenderingContext)
    {
        this.GL_CONTEXT = gl;
    }

    public abstract Setup(): void;
    public abstract Start(): void;
    public abstract Update(): void;
    
    CreateScene()
    {
        const newScene = new Scene(this.GL_CONTEXT);
        this.scenes.add(newScene);
        return newScene;
    }

    RemoveScene(sceneRef: Scene)
    {
        return this.scenes.delete(sceneRef);
    }
}