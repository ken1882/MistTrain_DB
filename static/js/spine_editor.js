let SpineManager, ResizeListener;
let oldCanvasSize;
let TargetScaleHeight = 400;
let AvailableTypeCache  = {};

let CurrentCharacterId = null;
let lastFrameTime = Date.now() / 1000;
let BackgroundColor = [0.8, 0.8, 0.8, 0];
let AnimationRecorder;
let MouseToolMode = 'move';

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

const BICON_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
</svg>`;

const BICON_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
<path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
</svg>`;

const AVAILABLE_TYPE_BITSET = {
    'a': 1,
    'e': 2,
    'h': 4,
    'b': 8,
}

let DrawableObjectTypeList = {
    'character': [],
    'character_ss': [],
    'npc': []
};


function initSPEdit(){
    if(!DataManager.isReady()){
        return setTimeout(initSPEdit, 100);
    }
    SpineManager = new Spine_AssetsManager(document.getElementById('main-canvas'));
    BackgroundColor = SpineManager.BackgroundColor;
    $('#inp_bgcolor').val(rgb2hex(BackgroundColor));
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
    setupOptions();
}

function setupSPEditor(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setupSPEditor, 300);
    }
    
    setupEditableCharacters();
    
    for(let k in AVAILABLE_TYPE_BITSET){
        $(`#btn-add-${k}`).on('click', (_)=>{
            onTypeAddClick(CurrentCharacterId, `${k}`);
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
    SpineManager.clear(BackgroundColor);
    SpineManager.updateViewport();
}

function renderObjects(){
    var now = Date.now() / 1000;
    var delta = now - lastFrameTime;

    lastFrameTime = now;
    SpineManager.clear(BackgroundColor);
    SpineManager.update(delta);
    requestAnimationFrame(renderObjects);
}

function setupOptions(){
    setupTypeFilters();
    $('#inp_bgcolor').on('change', (e)=>{
        BackgroundColor = hex2rgb(e.target.value).concat(0);
    });
    setupMouseTools();
}

function setupTypeFilters(){
    let ch_list = $('#char-type-list');
    let ly_list = $('#layer-type-list');
    let ch_types = {
        all: Vocab.All,
        character: Vocab.Character,
        character_ss: Vocab.Character+' (SS)',
        npc: Vocab.NPC,
    }
    let ly_types = {
        character: Vocab.CharacterObject,
        back: Vocab.BackgroundObject,
    }
    for(let k in ch_types){
        ch_list.append($('<option>',{
            value: k,
            text: ch_types[k]
        }));
    }
    for(let k in ly_types){
        ly_list.append($('<option>',{
            value: k,
            text: ly_types[k]
        }));
    }
    ch_list.on('change', (e)=>{
        switchDrawableList(e.target.value);
    });
}

function setupMouseTools(){
    let list = $('#sel-mousetool');
    list.on('change', (e)=>{
        MouseToolMode = e.target.value;
        SpineManager.mouseResize = (MouseToolMode == 'resize');
    });
    let opt = $('<option>',{
        value: 'move',
        text: Vocab.MouseTool.Move,
    });
    list.append(opt);
    opt = $('<option>',{
        value: 'resize',
        text: Vocab.MouseTool.Resize,
    });
    list.append(opt);

    $(document).on('keydown', (e)=>{
        switch(e.key){
        case 'shift':
        case 'Shift':
            SpineManager.mouseResize = true;
        }
    });
    $(document).on('keyup', (e)=>{
        switch(e.key){
        case 'shift':
        case 'Shift':
            SpineManager.mouseResize = false || MouseToolMode == 'resize';
        }
    });
}

function setupCavnasListener(){
    // let canvas = SpineManager.canvas;
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
        sp.showHitbox = $('#ckb_showhitbox').prop('checked');
        if(callback){ callback(sp); }
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
    ids.sort((a,b)=>{return a - b;})
    for(let id of ids){
        let btn_html = `
            <button class="btn btn-primary btn-handler" type="button" onclick="onListAddClick(${id})">
            ${BICON_PLUS}
            </button>
        `;
        let r = createAvatarRow(id, btn_html);
        if(id < 1000){
            DrawableObjectTypeList['npc'].push(r);
        }
        else{
            DrawableObjectTypeList['character'].push(r);
            if(id % 1000 > 400){
                DrawableObjectTypeList['character_ss'].push(r);
            }
        }
    }
    switchDrawableList('all');

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

function onTypeAddClick(cid, t){
    let uid = parseInt(Math.random() * 10**16);
    let loader = document.createElement('tr');
    $(loader).attr('id', `loader-${uid}`);
    loader.innerHTML = `<div class="spinner-border center">
        <span class="sr-only"></span>
    </div>`;
    $('#layer-tbody').append(loader);
    let proc = (sp) => {
        let btn_html = `
        <button class="btn btn-primary btn-handler" type="button" onclick="onLayerRemoveClick(this)">
        ${BICON_MINUS}
        </button>
        `;
        let r = createAvatarRow(cid, btn_html);
        $(`#loader-${uid}`).remove();
        r.attr('pid', cid);
        r.attr('data-index', $('#layer-tbody').children().length);
        let sel = document.createElement('select');
        for(let anim of sp.skeleton.data.animations){
            let an = Vocab.CharacterAnimationName[anim.name];
            if(!an){ an = anim.name; }
            $(sel).append($('<option>', {
                value: anim.name,
                text: an
            }));
            if(anim.name == sp.defaultAnimation){
                $(sel).val(anim.name);
            }
        }
        $(sel).on('change', (e)=>{
            sp.animationState.setAnimation(0, e.target.value, true);
        });
        r.children()[1].append(sel);
        $('#layer-tbody').append(r);
    };

    let sp = addCharacter(t, cid, proc);
    sp.plistId = cid;
    $('#charadd-overlay').modal('hide');
    $('#btn-export-anim').removeAttr('disabled');
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
    setTimeout(() => {
        let temp = Array(SpineManager.objects);
        let list = [];
        for(let ch of $('#layer-tbody').children()){
            console.log(ch);
            if($(ch).attr('data-index')){
                list.push(ch)
            }
        }
        for(let i=0;i<list.length;++i){
            let oi = $(list[i]).attr('data-index');
            console.log(`${oi} => ${i}`);
            temp[i] = SpineManager.objects[oi];
            $(list[i]).attr('data-index', i);
        }
        SpineManager.objects = temp;
    }, 500);
}

function switchDrawableList(t=null){
    if(!t){ t = $('#char-type-list').val(); }
    let tbody = $('#character-tbody');
    for(let c of tbody.children()){
        $(c).remove();
    }
    if(t == 'all'){
        let dup = ['character_ss'];
        for(let k in DrawableObjectTypeList){
            if(dup.includes(k)){ continue; }
            for(let c of DrawableObjectTypeList[k]){
                tbody.append(c);
            }
        }
        return;
    }
    if(!DrawableObjectTypeList.hasOwnProperty(t)){ return; }
    for(let c of DrawableObjectTypeList[t]){
        tbody.append(c);
    }
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

function toggleSceneAnimationPause(){
    SpineManager.paused ^= true;
    if(SpineManager.paused){
        $('#scene-anim-pause').html(BICON_PLAY);
    }
    else{
        $('#scene-anim-pause').html(BICON_PAUSE);
    }
}

function toggleHitboxDraw(b=null){
    for(let sp of SpineManager.objects){
        if(b == null){
            sp.showHitbox ^= true;
        }
        else{
            sp.showHitbox = b;
        }
    }
}


function createGlContextSnapshot(gl){
    let width  = gl.drawingBufferWidth;
	let height = gl.drawingBufferHeight;
	let pixels = new Uint8Array(width * height * 4);
	let tmp = new Uint8Array(width * height * 4)
	let row = width * 4;
	let end = (height - 1) * row;
	
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, tmp);
	for(var i=0;i<tmp.length;i+=row){
		pixels.set(tmp.subarray(i,i+row), end - i);
	}
    
	// alpha channel binarization
	// for(var i=0;i<pixels.length;i+=4){
	// 	if(pixels[i+3] < 0x70){pixels[i+3] = 0;}
	// 	else{ pixels[i+3] = 0xff; }
	// }

	let canvas 		= document.createElement('canvas');
	canvas.width 	= width;
	canvas.height = height;
	let context 	= canvas.getContext('2d');
	let imgdata 	= context.createImageData(width, height);
    
	for(var i=0;i<pixels.length;++i){
        imgdata.data[i] = pixels[i];
	}
    
	context.putImageData(imgdata, 0, 0);
	return canvas;
}

function exportSceneCanvas(){
    let canvas = createGlContextSnapshot(SpineManager.gl);
    window.open(canvas.toDataURL("image/png"));
    canvas.remove();
}

function updateSceneSettings(){
    
}

function prepareSceneAnimRecord(){
    AnimationRecorder = setupSceneAnimRecord();
}

function setupSceneAnimRecord(){
    let chunks = [];
    let anim_stream = SpineManager.canvas.captureStream();
    rec = new MediaRecorder(anim_stream);
    rec.ondataavailable = (e) => {
        chunks.push(e.data);
    };
    rec.onstop = (_)=>{
        exportSceneAnimation( new Blob(chunks, {type: 'video/webm'}) );
    };
    
    let target = SpineManager.objects[0];
    let rec_start_proc = ()=>{
      if(target.animationState.timeScale > 0){
        target.animationState.setAnimation(
            0,
            target.animationState.tracks[0].animation.name,
            true
        );
        rec.start();
      }
      else{
        setTimeout(rec_start_proc, 100);
      }
    };
  
    let listner = {
      complete: (state)=>{
        rec.stop();
        target.animationState.removeListener(listner);
      }
    };
    target.animationState.addListener(listner);
    
    rec_start_proc();
    return rec;
}

function exportSceneAnimation(blob){
    let vid = document.createElement('video');
    vid.src = URL.createObjectURL(blob);
    vid.controls = true;
    document.body.appendChild(vid);
    const a = document.createElement('a');
    a.download = 'scene.webm';
    a.href = vid.src;
    a.textContent = Vocab['Download'];
    document.body.appendChild(a);
    $("#btn-export-anim").prop('disabled', false);
    $("#battler-act-list").prop('disabled', false);
    $('body,html').animate({
      scrollTop: Math.max(0, a.offsetTop - (window.innerHeight - a.offsetHeight)/2)
    }, 800);
}

function setupGifExport(){
       
}

window.addEventListener('load', initSPEdit);