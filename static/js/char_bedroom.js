let BedroomCanvas, BedroomGL;
let CharacterSkeletons = [], CharacterAnimStates = [];
let CharacterBounds    = [], CharacterAnimations = [];
let AnimationParts = [];
let CharacterAssetManager;
let CharacterScenes;
let CurrentCharacterData = {};

var lastFrameTime = Date.now() / 1000;

var BedroomCanvasWidthScale = 0.9;
var BedroomCameraYFactor = 4;
var CharacterSkeletonShrinkRate = 1.0;

let BedroomSpineDataCache = {};
var CurrentSceneId = 0;

const EmptyBackgroundColor = [0, 0, 0, 0];
const BattlerBackgroundColor   = [0.8, 0.8, 0.8, 1.0];
const CharacterBackgroundColor = [0, 0, 0, 0];
const PREMUL_ALPHA = true;

let __bedroomReadyReq, __bedroomReadyCnt;

function initBedroom(){
  AssetsManager.loadCharacterData();
  BedroomCanvas = document.getElementById('bedroom-canvas');
  BedroomGL     = BedroomCanvas.getContext('webgl', {
    preserveDrawingBuffer: true,
    premultipliedAlpha: PREMUL_ALPHA,
  });
  CharacterSkeletons  = [];
  CharacterAnimStates = [];
  CharacterBounds     = [];
  CharacterAnimations = [];
  AnimationParts      = [];
  __bedroomReadyReq   = 1;
  __bedroomReadyCnt   = 0;
  BedroomRenderer = new spine.SceneRenderer(BedroomCanvas, BedroomGL);
	BedroomRenderer.debugRendering = false;
	CharacterAssetManager = new spine.AssetManager(BedroomGL);
  setup();
}



function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  CurrentCharacterData = AssetsManager.CharacterData[__CharacterId];
  CharacterScenes = CurrentCharacterData.MCharacterScenes.sort(
    (a,b) => {return a.KizunaRank - b.KizunaRank}
  );
  CurrentSceneId = CharacterScenes[0].MSceneId+1;
  loadBedroomSpineMeta(CurrentSceneId);
  postSetup();
}

function loadBedroomSpineMeta(scene_id){
  __bedroomReadyCnt = 0;
  __bedroomReadyReq = 1;
  if(BedroomSpineDataCache.hasOwnProperty(scene_id)){
    __bedroomReadyCnt = 1;
    return ;
  }
  var baseurl = getBedroombaseUrl(scene_id);
  $.ajax({
    url: `${baseurl}/still_configuration.json`,
    success: (res)=>{parseBedroomSpineMeta(res, scene_id)},
  });
}

function getBedroombaseUrl(sid){
  let pre = '', n = parseInt(sid / 100000);
  while(n > 10){
    pre += parseInt(n % 10);
    n = parseInt(n / 10);
  }
  pre = pre.split('').reverse().join('');
  return `${ASSET_HOST}/Spines/Stills/${pre}/${sid}`;
}

function parseBedroomSpineMeta(res, sid){
  __bedroomReadyReq = res.Parts.length;
  BedroomSpineDataCache[sid] = {
    parts: [],
    skeletons: [],
    animstates: [],
    animations: [],
    bounds: [],
  }
  for(let p of res.Parts){
    loadBedroomSpineData( getBedroomSpinePart(sid, p.Path) );
    BedroomSpineDataCache[sid].parts.push(p);
  }
}

function loadBedroomSpineData(data){
  CharacterAssetManager.loadTexture(data.png);
	CharacterAssetManager.loadText(data.atlas);
	CharacterAssetManager.loadBinary(data.skel);
  setupBedroomSpine(data);
}

function isBedroomLoaded(){
  return __bedroomReadyCnt >= __bedroomReadyReq && __bedroomReadyCnt > 0;
}

function postSetup(){
  if(!isBedroomLoaded()){
    return setTimeout(postSetup, 300);
  }
  window.addEventListener('resize', resizeBedroomCanvas, true);
  setupAvailableScenes();
  prepareBedroomRendering();
}

function prepareBedroomRendering(){
  if(!isBedroomLoaded()){
    return setTimeout(prepareBedroomRendering, 300);
  }
  swapCurrentScene(CurrentSceneId);
  setupAnimationSteps();
  setupPartSelection();
  startRendering();
}

function startRendering(){
  if(!isBedroomLoaded()){
    return setTimeout(startRendering, 300);
  }
  setTimeout(() => {
    requestAnimationFrame(renderBedroom);
  }, 500);
  setTimeout(() => {
    $("#bedroom-loading-indicator").css('display', 'none');
    $(BedroomCanvas).css('display', 'inline');
    $('#bedroom-list').attr('disabled', null);
    resizeBedroomCanvas();
  }, 1000);
}

function setupBedroomSpine(data){
  if(!CharacterAssetManager.isLoadingComplete()){
		return setTimeout(() => {
			setupBedroomSpine(data);
		}, 100);
	}
  let chdata = loadSkeleton(CharacterAssetManager, data);
  
	BedroomSpineDataCache[CurrentSceneId].skeletons.push(chdata.skeleton);
	BedroomSpineDataCache[CurrentSceneId].animstates.push(chdata.state);
	BedroomSpineDataCache[CurrentSceneId].bounds.push(chdata.bounds);
  BedroomSpineDataCache[CurrentSceneId].animations.push(chdata.animations);
  for(let i in chdata.state.data.skeletonData.slots){
    let sdat = chdata.state.data.skeletonData.slots[i];
    sdat.blendMode = 3;
	}
  chdata.state.setAnimation(0, chdata.animations[0], true);
  __bedroomReadyCnt += 1;
}

function getBedroomSpinePart(sid, p){
  let baseurl = getBedroombaseUrl(sid) + '/' + p;
  return {
    png: `${baseurl}.png`,
    atlas: `${baseurl}.atlas`,
    skel: `${baseurl}.skel`
  }
}

function loadSkeleton(astmgr, rssdata){
  if(!rssdata.skin){ rssdata.skin = 'default'; }
  
	atlas = new spine.TextureAtlas(
		astmgr.get(rssdata.atlas), 
		(_) => {
			return astmgr.get(rssdata.png);
		}
	);
	
  atlasLoader = new spine.AtlasAttachmentLoader(atlas);
	var SkeletonBinary = new spine.SkeletonBinary(atlasLoader);
	var skeletonData = SkeletonBinary.readSkeletonData(astmgr.get(rssdata.skel));
	var skeleton = new spine.Skeleton(skeletonData);

	var bounds = calculateBounds(skeleton);
	skeleton.setSkinByName(rssdata.skin);
	
  var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
  var anims = [];
  for(let anim of skeleton.data.animations){
    anims.push(anim.name);
  }

	return { skeleton: skeleton, state: animationState, bounds: bounds, animations: anims};
}

function calculateBounds(skeleton) {
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform();
	var offset = new spine.Vector2();
	var size = new spine.Vector2();
	skeleton.getBounds(offset, size, []);
	return { offset: offset, size: size };
}

function renderBedroom(){
  if(!CurrentSceneId){ return ; }

  var now = Date.now() / 1000;
	var delta = now - lastFrameTime;
	var gl = BedroomGL;
	lastFrameTime = now;
	// updateCanvasSize(BedroomCanvas);
	BedroomRenderer.begin()
  for(let i in CharacterSkeletons){
    CharacterAnimStates[i].update(delta);
    CharacterAnimStates[i].apply(CharacterSkeletons[i]);
    CharacterSkeletons[i].updateWorldTransform();
  }

  gl.clearColor.apply(gl, EmptyBackgroundColor);
	gl.clear(gl.COLOR_BUFFER_BIT);
	BedroomRenderer.begin();
  for(let i in CharacterSkeletons){
    BedroomRenderer.drawSkeleton(CharacterSkeletons[i], PREMUL_ALPHA);
    if(BedroomRenderer.debugRendering){
      BedroomRenderer.drawSkeletonDebug(CharacterSkeletons[i], PREMUL_ALPHA, ["root"]);
    }
  }
	BedroomRenderer.end()
	requestAnimationFrame(renderBedroom);
}

function resizeBedroomCanvas(){
	var w = window.innerWidth * BedroomCanvasWidthScale;
	var h = window.innerHeight;
  BedroomCanvas.width = w;
	BedroomCanvas.height = h;
	BedroomRenderer.camera.position.x = 0;
	BedroomRenderer.camera.position.y = 0;
  let maxn = 0;
  for(let b of CharacterBounds){
    let sum = Math.abs(b.size.x) + Math.abs(b.size.y);
    if(sum < 10 || sum > 0xffff){ continue; }
    if(sum > maxn){
      BedroomRenderer.camera.viewportWidth = b.size.x * CharacterSkeletonShrinkRate;
      BedroomRenderer.camera.viewportHeight = b.size.y * CharacterSkeletonShrinkRate;
      maxn = sum;
    }
  }
	BedroomRenderer.resize(spine.ResizeMode.Fit);
}

function setAnimationStep(n){
  for(let i in CharacterAnimStates){
    CharacterAnimStates[i].setAnimation(0, CharacterAnimations[i][n], true);
  }
}

function exportCharacterCanvas(){
	let canvas = createGlContextSnapshot(BedroomGL);
	window.open(canvas.toDataURL("image/png"));
	canvas.remove();
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
	for(var i=0;i<pixels.length;i+=4){
		if(pixels[i+3] < 0x70){pixels[i+3] = 0;}
		else{ pixels[i+3] = 0xff; }
	}

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

function setupAvailableScenes(){
  let list_bedroom = $('#bedroom-list');
  let scene_list = [CharacterScenes[0].MSceneId];
  if(AssetsManager.CharacterData[__CharacterId].CharacterRarity == 4){
    scene_list.push(CharacterScenes[2].MSceneId);
  }
  for(let sid of scene_list){
    let name = AssetsManager.SceneData[sid].Title;
    let opt = document.createElement("option");
    $(opt).attr('value', sid+1);
    if(sid == CharacterScenes[0].MSceneId){$(opt).attr('selected','')}
    opt.innerText = name;
    list_bedroom.append(opt);
  }
  list_bedroom.on('change', (e)=>{
    var sid = e.target.value;
    CurrentSceneId = 0;
    $("#bedroom-loading-indicator").css('display', '');
    $(BedroomCanvas).css('display', 'none');
    $('#bedroom-list').attr('disabled', '');
    $('#anim-list').html('');
    $('#part-list').html('');
    setTimeout(() => {
      CurrentSceneId = sid;
      loadBedroomSpineMeta(sid);
      prepareBedroomRendering();
    }, 1000);
  });
}

function setupAnimationSteps(){
  let list_anim = $('#anim-list');
  for(let i in CharacterAnimations[0]){
    let name = CharacterAnimations[0][i];
    let opt = document.createElement("option");
    $(opt).attr('value', i);
    if(i == 0){$(opt).attr('selected','')}
    opt.innerText = name;
    list_anim.append(opt);
  }
  list_anim.on('change', (e)=>{
    setAnimationStep(e.target.value);
  });
}

function setupPartSelection(){
  let plist = $('#part-list');
  for(let i in AnimationParts){
    let p = AnimationParts[i];
    let section = document.createElement('p');
    section.innerHTML = `
      <input type="checkbox" id="ckb_part-${i}" checked>
      <label for="ckb_part-${i}">${p.Path}</label>
    `
    $(section).addClass('item');
    plist.append(section);
    $(`#ckb_part-${i}`).on('change', (e)=>{
      if(e.target.checked){
        CharacterSkeletons[i].scaleX = 1;
      }
      else{
        CharacterSkeletons[i].scaleX = 0;
      }
    });
  }

}

function swapCurrentScene(sid){
  AnimationParts      = BedroomSpineDataCache[sid].parts;
  CharacterSkeletons  = BedroomSpineDataCache[sid].skeletons;
  CharacterAnimStates = BedroomSpineDataCache[sid].animstates;
  CharacterAnimations = BedroomSpineDataCache[sid].animations;
  CharacterBounds     = BedroomSpineDataCache[sid].bounds;
}
window.addEventListener('load', initBedroom)