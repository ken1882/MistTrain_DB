let SpineManager, ResizeListener;
let oldCanvasSize;
let TargetScaleHeight = 400;
let AvailableTypeCache  = {};

let CurrentCharacterId = null;
let lastFrameTime = Date.now() / 1000;

const BICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-square" viewBox="0 0 16 16">
<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
</svg>`;

const BICON_MINUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-square" viewBox="0 0 16 16">
<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
</svg>`;

const BICON_ARROW_UPDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
</svg>`;

const AVAILABLE_TYPE_BITSET = {
    'a': 1,
    'e': 2,
    'h': 4,
    'b': 8,
}

function initSPEdit(){
    if(!DataManager.isReady()){
        return setTimeout(initSPEdit, 100);
    }
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
    
    AssetsManager.loadCharacterAssets();
    setupCavnasListener();
    setupSPEditor();
}

function setupSPEditor(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setupSPEditor, 300);
    }
    
    setupEditableCharacters();
    
    for(let k in AVAILABLE_TYPE_BITSET){
        $(`#btn-add-${k}`).on('click', (_)=>{
            onTypeAddClick(`${k}`);
        });
    }

    setTimeout(() => {
        requestAnimationFrame(renderObjects);
    }, 1000);
    $('#loading-indicator').remove();
    $('#character-table').css('display', '');
    $('#layer-table').css('display', '');
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
        defaultAnimation: 'Idle',
	}
}

function getEventActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Events/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Events/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Events/${id}/${id}.skel`,
		name: id,
        defaultAnimation: 'Idle_Normal',
	}
}

function getHomepageActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Homes/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Homes/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Homes/${id}/${id}.skel`,
		name: id,
        defaultAnimation: 'Idle',
	}
}

function getAdventureActorSpineResourcesData(id){
	return {
		texture: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.png`,
		atlas: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.atlas`,
		skel: `${ASSET_HOST}/Spines/Adventures/${id}/${id}.skel`,
		name: id,
        defaultAnimation: 'Idle_Normal',
	}
}

function getSpineTypeDetectors(id){
    return {
        'a': `${ASSET_HOST}/Spines/Adventures/${id}/${id}.atlas`,
        'e': `${ASSET_HOST}/Spines/Events/${id}/${id}.atlas`,
        'h': `${ASSET_HOST}/Spines/Homes/${id}/${id}.atlas`,
        // 'b': `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.atlas`,
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
    if(rdat.name == null){
        console.error(`Invalid id #${id} of type ${type}`);
        return ;
    }
    return new MTG_Spine(SpineManager, rdat);
}

function resizeScale(sp){
    window.spo = sp;
    let scale = TargetScaleHeight / sp.bounds.size.y;
    sp.skeleton.scaleX = scale;
    sp.skeleton.scaleY = scale;
    sp.updateBounds();
    return sp;
}

function addCharacter(type, id, callback=null){
    let sp = loadCharacter(type, id);
    if(!sp){ return ; }
    let proc = ()=>{
        if(!sp.ready){ return setTimeout(proc, 500); }
        resizeScale(sp);
        SpineManager.addObject(sp);
        sp.showHitbox = true;
        if(callback){ callback(); }
    };
    proc();
    return sp;
}

function setupEditableCharacters(){
    let parent = $("#character-table");
    let ids = [];
    for(let id in AssetsManager.CharacterAvatarClip){
        id = parseInt(id.split('.')[0]);
        ids.push(id);
    }
    ids.sort((a,b)=>{return a > b;})
    for(let id of ids){
        let btn_html = `
            <button class="btn btn-primary btn-handler" type="button" onclick="onListAddClick(${id})">
            ${BICON_PLUS}
            </button>
        `;
        parent.append(createAvatarRow(id, btn_html));
    }
    
    $('#character-tbody').sortable({
        handle: '.btn-handler',
        change: onListMove,
    });
    $('#layer-tbody').sortable({
        handle: '.btn-handler',
        change: onLayerMove,
    });
    
    setTimeout(() => {
        fixTableOverflow(parent);
        fixTableOverflow($('#layer-table')); 
    }, 500);
}

function createAvatarRow(id, btn_html){
    let tr = document.createElement('tr');
    $(tr).attr('pid', id);
    let cells = [];
    for(let i=0;i<4;++i){
        let node = document.createElement('td');
        cells.push(node);
        tr.append(node);
    }
    $(cells[0]).append(AssetsManager.createCharacterAvatarNode(id));
    $(cells[2]).html(btn_html);
    $(cells[3]).html(`
        <a class="btn btn-primary btn-handler" type="button">
        ${BICON_ARROW_UPDOWN}
        </a>
    `);
    return $(tr);
}

function fixTableOverflow(btable){
    let offset = parseInt(btable.css('margin-top')) * -1 + 1;
    btable.parent().parent().css('padding-bottom', `${offset}px`);
}

function onListAddClick(id){
    for(let k in AVAILABLE_TYPE_BITSET){
        $(`#btn-add-${k}`).attr('disabled', 'true');    
    }
    let t = checkAvailableTypes(id);
    if(t >= 0xffff){
        return setTimeout(() => {
            onListAddClick(id);
        }, 500);;
    }
    for(let k in AVAILABLE_TYPE_BITSET){
        if(t & AVAILABLE_TYPE_BITSET[k]){
            $(`#btn-add-${k}`).removeAttr('disabled');
        }
    }
    CurrentCharacterId = id;
    $('#charadd-overlay').modal('show');
}

function onTypeAddClick(t){
    let uid = parseInt(Math.random() * 10**16);
    let loader = document.createElement('tr');
    $(loader).attr('id', `loader-${uid}`);
    loader.innerHTML = `<div class="spinner-border center">
        <span class="sr-only"></span>
    </div>`;
    $('#layer-tbody').append(loader);
    let cid = CurrentCharacterId;
    let proc = () => {
        let btn_html = `
        <button class="btn btn-primary btn-handler" type="button" onclick="onLayerRemoveClick(this)">
        ${BICON_MINUS}
        </button>
        `;
        let r = createAvatarRow(cid, btn_html);
        $(`#loader-${uid}`).remove();
        r.attr('pid', cid);
        r.attr('data-index', $('#layer-tbody').children().length);
        $('#layer-tbody').append(r);
    };

    let sp = addCharacter(t, CurrentCharacterId, proc);
    sp.plistId = CurrentCharacterId;
    CurrentCharacterId = null;
    $('#charadd-overlay').modal('hide');
}

function onLayerRemoveClick(e){
    let idx = parseInt($(e.parentElement.parentElement).attr('data-index'));
    let list = $('#layer-tbody').children();
    for(let i=idx+1;i<list.length;++i){
        $(list[i]).attr('data-index', i-1);
    }
    $(list[idx]).remove();
    return SpineManager.objects.splice(idx, 1);
}

function onListMove(e, u){

}

function onLayerMove(e, u){
    
}

function checkAvailableTypes(id){
    if(AvailableTypeCache.hasOwnProperty(id)){
        return AvailableTypeCache[id];
    }
    AvailableTypeCache[id] = 0xffff;
    let durls = getSpineTypeDetectors(id);
    let ar = [];
    for(let t in durls){
        ar.push($.ajax({
            url: durls[t],
            success: (_) => {
                AvailableTypeCache[id] |= (AVAILABLE_TYPE_BITSET[t] << 16);
            }
        }));
    }
    Promise.allSettled(ar).then((_) => {
        AvailableTypeCache[id] >>= 16;
    });
    return 1 << 16;
}

window.addEventListener('load', initSPEdit);