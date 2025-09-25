declare var requirejs: { (arg0: string[], arg1: () => void): void; (arg0: string[], arg1: () => void): void; config: any; };
requirejs.config({
   baseUrl: "js",
   paths: {
       "gl-matrix": "https://cdn.jsdelivr.net/npm/gl-matrix@3.3.0/gl-matrix-min",
       "ammojs-typed": "https://dl.dropboxusercontent.com/s/e5iytx67noqoew7/ammo"
   }
});

requirejs(["main"], () => { });