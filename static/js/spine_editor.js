let SpineManager, ResizeListener;
let oldCanvasSize;
let HitboxWidth = 400;

let lastFrameTime = Date.now() / 1000;

function initSPEdit(){
    SpineManager = new Spine_AssetsManager(document.getElementById('main-canvas'));

    // resize event will be called again due to inner canvas resize,
    // so use third element as detection flag
    oldCanvasSize = [SpineManager.canvas.width, SpineManager.canvas.height, false];
    ResizeListener = new ResizeObserver((e)=>{
        let target = e[0].target;
        let tw = target.clientWidth, th = target.clientHeight;
        if(tw != oldCanvasSize[0] || th != oldCanvasSize[1]){
            if(!oldCanvasSize[2]){
                resizeCanvas(tw, th);
                oldCanvasSize = [tw, th, true];
            }
            else{
                oldCanvasSize = [tw, th, false];
            }
        }
    });
    ResizeListener.observe(document.getElementById('main-canvas-container'));
    $("#main-canvas-container").trigger('resize');
    let dw = parseInt(window.innerWidth * 0.9);
    let dh = parseInt(window.innerHeight * 0.8);
    $("#main-canvas-container").css('width', dw);
    $("#main-canvas-container").css('height', dh);
    setupCavnasListener();
    setTimeout(() => {
        requestAnimationFrame(renderObjects);
    }, 1000);
}

function resizeCanvas(w, h){
    SpineManager.canvas.width = w;
    SpineManager.canvas.height = h;
    SpineManager.clear();
    SpineManager.updateViewport();
}

function renderObjects(){
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;

    lastFrameTime = now;
    SpineManager.clear();
    SpineManager.update(delta);
    requestAnimationFrame(renderObjects);
}

function setupCavnasListener(){
    let canvas = SpineManager.canvas;
    // $(canvas).on('click', (e)=>{
    //     var rect = canvas.getBoundingClientRect();
    //     var x = e.clientX - rect.left;
    //     var y = e.clientY - rect.top;
    //     console.log(x, y); 
    // });
}

function getBattlerSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.skel`,
		name: id,
	}
}

function getEventActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Events/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Events/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Events/${id}/${id}.skel`,
		name: id,
	}
}

function getHomepageActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Homes/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Homes/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Homes/${id}/${id}.skel`,
		name: id,
	}
}

function getAdventureActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.skel`,
		name: id,
	}
}

function loadCharacter(type, id){
    let rdat = {};
    switch(type){
    case 'a':
    case 'adv':
        rdat = getAdventureActorSpineResourcesData(id);
        break;
    case 'b':
    case 'sd':
        rdat = getBattlerSpineResourcesData(id);
        break;
    case 'e':
    case 'event':
    case 'events':
        rdat = getEventActorSpineResourcesData(id);
        break;
    case 'h':
    case 'home':
        rdat = getHomepageActorSpineResourcesData(id);
        break;
    }
    if(!rdat.name){
        console.error(`Invalid id #${id} of type ${types}`);
        return ;
    }
    return new MTG_Spine(SpineManager, rdat);
}

function resizeScale(sp){
    window.spo = sp;
    let scale = HitboxWidth / sp.bounds.size.x;
    sp.skeleton.scaleX = scale;
    sp.skeleton.scaleY = scale;
    sp.updateBounds();
    return sp;
}

function addCharacter(type, id){
    let sp = loadCharacter(type, id);
    if(!sp){ return ; }
    let proc = ()=>{
        if(!sp.ready){ return setTimeout(proc, 500); }
        resizeScale(sp);
        SpineManager.addObject(sp);
        sp.showHitbox = true;
    };
    proc();
    return sp;
}



window.addEventListener('load', initSPEdit);