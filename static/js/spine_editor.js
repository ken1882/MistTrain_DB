let SpineManager, ResizeListener;
let oldCanvasSize;
let SceneObjects = [];

let lastFrameTime = Date.now() / 1000;

function initSPEdit(){
    SpineManager = new Spine_AssetsManager(document.getElementById('main-canvas'));
    SpineManager.viewportScale = [5, 5];
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
    let dh = parseInt(window.innerHeight * 0.7);
    $("#main-canvas-container").css('width', dw);
    $("#main-canvas-container").css('height', dh);
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
    if(!SceneObjects){ return ; }

    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;

    lastFrameTime = now;
    SpineManager.clear();

    SpineManager.renderer.begin()
    for(let i in SceneObjects){
        if(!SceneObjects[i].ready){ continue; }
        SceneObjects[i].update(delta);
    }
    SpineManager.renderer.end()
    requestAnimationFrame(renderObjects);
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

function addCharacter(type, id){
    let sp = loadCharacter(type, id);
    if(!sp){ return ; }
    SceneObjects.push(sp);
    return sp;
}



window.addEventListener('load', initSPEdit);