if(!Rect){
class Rect{
    constructor(x, y, w, h, z=0, c=null){
        if(c == null){ c = [0, 0, 0, 1.0]; }
        if(c.length == 3){ c.push(1.0); }
        this.set(
            x, y, w, h,
            z,
            new spine4.Color(c[0], c[1], c[2], c[3])
        );
    }

    /**
     * Collision detection, center of canvas is 0,0
     * @param  {...any} args Rect-like single paramter or xywh
     * @returns bool
     */
    isCollided(...args){
        let x2, y2, w2, h2;
        if(args.length == 1){
            x2 = args[0].x;
            y2 = args[0].y;
            w2 = args[0].width;
            h2 = args[0].height;
        }
        else{
            x2 = args[0];
            y2 = args[1];
            w2 = args[2];
            h2 = args[3];
        }
        if(x2+w2 < this.x){ return false; }
        if(y2+h2 < this.y){ return false; }
        if(this.x + this.width < x2){ return false; }
        if(this.y + this.height < y2){ return false; }
        return true;
    }

    set(x=null, y=null, w=null, h=null, z=null, c=null){
        if(x !== null){this.x = x;}
        if(y !== null){this.y = y;}
        if(w !== null){this.width = w;}
        if(h !== null){this.height = h;}
        if(z !== null){this.z = z;}
        if(c !== null){this.color = c;}
    }
}}

class Spine4_AssetsManager extends spine4.AssetManager{
    BackgroundColor = [0.8, 0.8, 0.8, 0];

    EditUnactiveColor = new spine4.Color(1.0, 0.0, 0.0, 1.0);
    EditActiveColor   = new spine4.Color(0.3, 0.5, 1.0, 1.0);
    ResizeFactor = 1000;
    
    constructor(canvas){
        let gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
            premultipliedAlpha: true
        });
        super(gl);
        this.canvas = canvas;
        this.gl = gl;
        this.objects = [];
        this.initAttributes();
        this.initRenderer();
        this.initInput();
        this.clear();
    }

    initRenderer(){
        this.renderer = new spine4.SceneRenderer(this.canvas, this.gl);
        this.renderer.debugRendering = false;
        this.renderer.camera.position.x = 0;
	    this.renderer.camera.position.y = 0;
    }

    initInput(){
        this.mousePos = new spine4.Vector3();
        this.lastMousePos = new spine4.Vector3();
        this.mouseTarget = null;
        this.input = new spine4.Input(this.canvas);
        this.mouseResize = false;
        this.input.addListener({
            down: (x,y)=>{ 
                this.handleInputDown(x,y); 
            },
			up: (x, y) => {
				this.handleInputUp(x, y);
			},
			dragged: (x, y) => {
				this.handleInputDrag(x, y);
			},
			moved: (x, y) => {
                this.handleInputMoved(x,y);
            }
		});
    }

    initAttributes(){
        this.premultipliedAlpha = true;
        this.viewportScale  = [1, 1];
        this.editLock       = false;
        this.visible        = true;
        this.paused         = false;
    }

    handleInputDown(x, y){
        this.renderer.camera.screenToWorld(this.mousePos.set(x, y, 0), this.canvas.width, this.canvas.height);
        for(let sp of this.objects){
            if(!sp.isMovable()){ continue; }
            if(sp.isCollided(this.mousePos.x, this.mousePos.y, 1, 1)){
                this.lastMousePos.set(this.mousePos.x, this.mousePos.y, this.mousePos.z);
                if(this.mouseTarget && sp.z < this.mouseTarget.z){ break; }
                this.mouseTarget = sp;
            }
        }
        
    }

    handleInputUp(x, y){
        this.mouseTarget= null;
    }

    handleInputDrag(x, y){
        this.renderer.camera.screenToWorld(this.mousePos.set(x, y, 0), this.canvas.width, this.canvas.height);
        let dx = this.mousePos.x - this.lastMousePos.x;
        let dy = this.mousePos.y - this.lastMousePos.y;
        if(dx == 0 && dy == 0){ return; }
        if(this.mouseTarget){
            if(this.mouseResize){
                let s = dx / this.ResizeFactor;
                this.mouseTarget.skeleton.scaleX = Math.min(Math.max(0.05, this.mouseTarget.skeleton.scaleX+s), 3.0);
                this.mouseTarget.skeleton.scaleY = Math.min(Math.max(0.05, this.mouseTarget.skeleton.scaleY+s), 3.0);
                this.mouseTarget.updateBounds();
            }
            else{
                this.mouseTarget.move(dx, dy);
            }
        }
        this.lastMousePos.set(this.mousePos.x, this.mousePos.y, this.mousePos.z);
    }

    handleInputMoved(x, y){
        this.renderer.camera.screenToWorld(this.mousePos.set(x, y, 0), this.canvas.width, this.canvas.height);
        let t = null;
        for(let sp of this.objects){
            if(!sp.isMovable()){ continue; }
            if(sp.isCollided(this.mousePos.x, this.mousePos.y, 1, 1)){
                if(t && sp.z < t.z){ break; }
                t = sp;
            }
            sp.hitbox.color = this.EditUnactiveColor;
        }
        if(t){
            t.hitbox.color = this.EditActiveColor;
        }
    }

    clear(color=null){
        if(!color){ color = this.BackgroundColor; }
        this.gl.clearColor.apply(this.gl, color);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    updateViewport(){
        this.renderer.camera.viewportWidth  = this.canvas.width * this.viewportScale[0];
        this.renderer.camera.viewportHeight = this.canvas.height * this.viewportScale[1];
        this.renderer.resize(spine4.ResizeMode.Fit)
    }

    update(dt){
        if(this.paused){ dt = 0; }
        this.renderer.begin()
        this.updateObjects(dt);
        this.renderer.end()
    }

    updateObjects(dt){
        for(let sp of this.objects){
            if(!sp.ready || !sp.visible){ continue; }
            sp.update(dt);
        }

    }

    addObject(obj){
        this.objects.push(obj);
        this.sortObjects();
        
    }

    sortObjects(){
        this.objects.sort((a,b)=>{
            var az = 0, bz = 0;
            if(a.hitbox){az = a.hitbox.z; }
            if(a.z){ az = a.z; }
            if(b.hitbox){bz = b.hitbox.z; }
            if(b.z){ bz = b.z; }
            return bz - az;
        });
    }
}

class Spine4_Character{
    constructor(manager, kwargs={}){
        this._ready = false;
        this.manager = manager;
        this.showHitbox = false;
        this.hitbox = new Rect(0, 0, 1, 1, 0, [1.0, 0, 0, 1.0]);
        this.visible = true;
        Object.assign(this, kwargs);
        this.loadResources();
        this.setup();
    }

    DEFAULT_SKIN = 'default';
    DEFAULT_TIMESCALE = 15;
    HITBOX_LINE_WIDTH = 2;

    loadResources(rssdat={}){
        Object.assign(this, rssdat);
        this.manager.loadTexture(this.texture);
        this.manager.loadTextureAtlas(this.atlas, null, null, {[this.textureName]: this.texture});
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
        if(!this.skin){ this.skin = this.DEFAULT_SKIN; }

        this.atlas = new spine4.TextureAtlas(
            this.manager.get(this.atlas),
            (_) => { return this.manager.get(this.texture); }
        );

        let loader = new spine4.AtlasAttachmentLoader(this.manager.get(this.atlas));
        let skbin  = new spine4.SkeletonBinary(loader);
        let skdat  = skbin.readSkeletonData(this.manager.get(this.skel));
        this.skeleton = new spine4.Skeleton(skdat);
        this.updateBounds();
        this.changeSkin(this.skin);
        
        this.animationState = new spine4.AnimationState(new spine4.AnimationStateData(this.skeleton.data));
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
        var offset = new spine4.Vector2();
        var size = new spine4.Vector2();
        this.skeleton.getBounds(offset, size, []);
        this.bounds = { offset: offset, size: size };
        this.hitbox.set(
            this.bounds.offset.x, 
            this.bounds.offset.y,
            this.bounds.size.x,
            this.bounds.size.y,
        );
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
        if(this.showHitbox){ this.drawHitbox(); }
    }

    drawHitbox(){
        let rend = this.manager.renderer;
        // upper,right,down,left bounds
        let x = this.hitbox.x, y = this.hitbox.y;
        let w = this.hitbox.width, h = this.hitbox.height;
        let c = this.hitbox.color, l = this.HITBOX_LINE_WIDTH;
        rend.rectLine(true, x, y, x+w, y, l, c);
        rend.rectLine(true, x+w, y, x+w, y+h, l, c);
        rend.rectLine(true, x, y+h, x+w, y+h, l, c);
        rend.rectLine(true, x, y, x, y+h, l, c);
    }

    changeSkin(skname){
        this.skin = skname;
        return this.skeleton.setSkinByName(skname);
    }

    postSetup(){
        let t = this.timeScale;
        if(!t){ t = this.DEFAULT_TIMESCALE; }
        this.timeScale = t;
    }

    move(dx, dy){
        if(!this.skeleton){ return; }
        this.skeleton.x += dx;
        this.skeleton.y += dy;
        this.updateBounds();
    }

    isMovable(){
        if(!this.ready){ return false; }
        if(!this.visible){ return false; }
        if(this.editLock){ return false; }
        return true;
    }

    isCollided(...args){ return this.hitbox.isCollided(...args); }

    get x(){return this.hitbox.x; }
    get y(){return this.hitbox.y; }
    get z(){return this.hitbox.z; }
    get ready(){ return this._ready; }
    get timeScale(){ return this.animationState.timeScale; }
    set timeScale(t){
        this.animationState.timeScale = t;
    }
}
