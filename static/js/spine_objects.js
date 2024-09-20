class Rect{
    constructor(x, y, w, h, z=0, c=null){
        if(c == null){ c = [0, 0, 0, 1.0]; }
        if(c.length == 3){ c.push(1.0); }
        this.set(
            x, y, w, h,
            z,
            new spine.Color(c[0], c[1], c[2], c[3])
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
}

class Spine_AssetsManager extends spine.webgl.AssetManager{
    BackgroundColor = [0.8, 0.8, 0.8, 0];

    EditUnactiveColor = new spine.Color(1.0, 0.0, 0.0, 1.0);
    EditActiveColor   = new spine.Color(0.3, 0.5, 1.0, 1.0);
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
        this.renderer = new spine.webgl.SceneRenderer(this.canvas, this.gl);
        this.renderer.debugRendering = false;
        this.renderer.camera.position.x = 0;
        this.renderer.camera.position.y = 0;
    }

    initInput(){
        this.mousePos = new spine.webgl.Vector3();
        this.lastMousePos = new spine.webgl.Vector3();
        this.mouseTarget = null;
        this.input = new spine.webgl.Input(this.canvas);
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
        this.renderer.resize(spine.webgl.ResizeMode.Fit)
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

class Spine_Character{
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
        console.log("Loading resources:", this.texture, this.atlas, this.skel);
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
        if(!this.skin){ this.skin = this.DEFAULT_SKIN; }

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

class MTG_Spine extends Spine_Character{
    PATCH_BLEND_SLOT = {
        1: [
            /light/i
        ],
        2: [
            /blush/i, /cheek/i, /nose/i, /shadow/i,
            /bubble/i, /howa/i, /_highlight/i,
            /^eF_\d+$/,

            /^normal\s2$/i, // blush alternative name
        ],
        3: [
            /body/i, /arm/i, /leg/i, /foot/i,
            /chest/i, /finger/i,
            /eye(s)?$/i, /^eyes_hl$/i,
            /brow/i, /mouth/i, /matsuge/i, /thigh/i,
        ],
    }
    postSetup(){
        super.postSetup();
        this.version = '3.8.95';
        // this.skeleton.scaleY = -1;
        for(let i in this.skeleton.data.slots){
            let sdat = this.skeleton.data.slots[i];
            let bdat = sdat.boneData;
            if(bdat.transformMode == 2){ bdat.transformMode = 1; }
		    if(sdat.blendMode == 1 && !this.PATCH_BLEND_SLOT[1][0].exec(sdat.name)){
                sdat.blendMode = 3;
            }
            if(sdat.blendMode == 0){
                for(let m in this.PATCH_BLEND_SLOT){
                    for(let re of this.PATCH_BLEND_SLOT[m]){
                        if(re.exec(sdat.name)){
                            sdat.blendMode = parseInt(m);
                        }
                    }
                }
            }
        }
    }
}

class SpineFileLoader{
    constructor(textures, atlas, skel){
        this.handler = {
            'loaded': null,
            'error': null,
        };
        this.version = null;
        this.textures = [];
        this.textureNames = [];
        for(let t of textures){
            this.textures.push(URL.createObjectURL(t));
            this.textureNames.push(t.name);
        }
        this.atlas   = URL.createObjectURL(atlas);
        this.skel    = URL.createObjectURL(skel);
        this._disposed  = false;
        this._readyCnt = 0;
        this._readyReq = 2;
        this.loadVersion(skel);
        this.verifyAtlasTextureName(atlas);
    }

    verifyAtlasTextureName(atlas){
        fbread(atlas, (buffer)=>{
            let content = new TextDecoder().decode(buffer);
            content = content.replaceAll('\r\n', '\n');
            for(let line of content.split('\n')){
                if(line.split('.').last() != 'png'){ continue; }
                if(!this.textureNames.includes(line)){
                    this.dispose();
                    alert(`${Vocab.SpineErrors['TextureNameUnmatch']}\nexpected ${line}\ngot ${this.textureNames.join(' ')}`);
                    return ;
                }
            }
            this._readyCnt += 1;
            this.callLoadedHandler();
        });
    }

    loadVersion(skel){
        fbread(skel, (buffer)=>{
            let content = new TextDecoder().decode(buffer);
            let match = content.match(/\b\d+\.\d+\.\d+\b/);
            if(match){
                this.version = match[0];
                console.log("Load spine version: "+this.version);
            }
            else{
                this.dispose();
                alert(Vocab.SpineErrors['UnsupportedVersion']);
                return;
            }
            this._readyCnt += 1;
            this.callLoadedHandler();
        }, 0, 0x30);
    }

    isReady(){ return this._readyCnt >= this._readyReq; }

    callLoadedHandler(){
        if(!this.isReady() || !this.handler['loaded']){ return ;}
        this.handler['loaded'](this);
    }

    setLoadedHandler(callback){
        this.handler['loaded'] = callback;
    }

    dispose(){
        return (this._disposed = false);
    }

    get disposed(){ return this._disposed; }
}