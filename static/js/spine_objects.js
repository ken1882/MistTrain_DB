class Spine_AssetsManager extends spine.webgl.AssetManager{
    BackgroundColor = [0.8, 0.8, 0.8, 1.0];

    constructor(canvas){
        let gl = canvas.getContext('webgl', {
            preserveDrawingBuffer: true,
            premultipliedAlpha: true
        });
        super(gl);
        this.premultipliedAlpha = true;
        this.canvas = canvas;
        this.gl = gl;
        this.viewportScale = [1, 1];
        this.initRenderer();
        this.clear();
    }

    initRenderer(){
        this.renderer = new spine.webgl.SceneRenderer(this.canvas, this.gl);
        this.renderer.debugRendering = false;
        this.renderer.camera.position.x = 0;
	    this.renderer.camera.position.y = 0;
    }

    clear(color=null){
        if(!color){ color = this.BackgroundColor; }
        this.gl.clearColor.apply(this.gl, color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    updateViewport(){
        this.renderer.camera.viewportWidth  = this.canvas.width * this.viewportScale[0];
        this.renderer.camera.viewportHeight = this.canvas.height * this.viewportScale[1];
        this.renderer.resize(spine.webgl.ResizeMode.Fit)
    }
}

class Spine_Character{
    constructor(manager, kwargs={}){
        this._ready = false;
        this.manager = manager;
        Object.assign(this, kwargs);
        this.loadResources();
        this.setup();
    }

    defaultSkin = 'default';
    defaultTimeScale = 15;

    loadResources(rssdat={}){
        Object.assign(this, rssdat);
        this.manager.loadTexture(this.texture);
        this.manager.loadText(this.atlas);
        this.manager.loadBinary(this.skel);
    }

    setup(){
        if(!this.manager.isLoadingComplete()){
            return setTimeout(()=>{ this.setup(); }, 500);
        }
        this.loadSpineData();
        this.postSetup();
        this._ready = true;
    }

    loadSpineData(){
        if(!this.skin){ this.skin = this.defaultSkin; }

        this.atlas = new spine.TextureAtlas(
            this.manager.get(this.atlas),
            (_) => { return this.manager.get(this.texture); }
        );

        let loader = new spine.AtlasAttachmentLoader(this.atlas);
        let skbin  = new spine.SkeletonBinary(loader);
        let skdat  = skbin.readSkeletonData(this.manager.get(this.skel));
        this.skeleton = new spine.Skeleton(skdat);
        this.updateBounds();
        this.changeSkin(this.skin);
        
        this.animationState = new spine.AnimationState(new spine.AnimationStateData(this.skeleton.data));
        let anim = this.defaultAnimation;
        if(!anim){
            for(let a of this.skeleton.data.animations){
                if(a.name){ anim = a.name; break; }
            }
        }
        this.animationState.setAnimation(0, anim, true);
    }

    updateBounds(){
        this.skeleton.setToSetupPose();
        this.skeleton.updateWorldTransform();
        var offset = new spine.Vector2();
        var size = new spine.Vector2();
        this.skeleton.getBounds(offset, size, []);
        this.bounds = { offset: offset, size: size };
        return this.bounds;
    }

    update(dt){
        this.animationState.update(dt);
        this.animationState.apply(this.skeleton);
        this.skeleton.updateWorldTransform();
        this.manager.renderer.drawSkeleton(this.skeleton, this.premultipliedAlpha);
        if(this.manager.renderer.debugRendering){
            this.manager.renderer.drawSkeletonDebug(this.skeleton, this.premultipliedAlpha, ["root"]);
        }
    }

    changeSkin(skname){
        this.skin = skname;
        return this.skeleton.setSkinByName(skname);
    }

    postSetup(){
        let t = this.timeScale;
        if(!t){ t = this.defaultTimeScale; }
        this.timeScale = t;
    }

    get ready(){ return this._ready; }
    get timeScale(){ return this.animationState.timeScale; }
    set timeScale(t){
        this.animationState.timeScale = t;
    }
}

class MTG_Spine extends Spine_Character{
    postSetup(){
        super.postSetup();
        // this.skeleton.scaleY = -1;
        for(let i in this.skeleton.data.slots){
            let sdat = this.skeleton.data.slots[i];
            let bdat = sdat.boneData;
            if(bdat.transformMode == 2){ bdat.transformMode = 1; }
		    if(sdat.blendMode == 1){ sdat.blendMode = 3; }
            if(sdat.name == 'Blush' && sdat.blendMode == 0){
                sdat.blendMode = 2;
            }
        }
    }
}