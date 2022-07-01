let BedroomCanvas, BedroomGL;
let CharacterSkeletons = [], CharacterAnimStates = [];
let CharacterBounds    = [], CharacterAnimations = [];
let CharacterAssetManager;
let SceneId;

var lastFrameTime = Date.now() / 1000;

var BedroomCanvasWidthScale = 0.9;
var BedroomCameraYFactor = 4;
var CharacterSkeletonShrinkRate = 1.0;

const EmptyBackgroundColor = [0, 0, 0, 0];
const BattlerBackgroundColor   = [0.8, 0.8, 0.8, 1.0];
const CharacterBackgroundColor = [0, 0, 0, 0];
const PREMUL_ALPHA = true;


let __readyReq = 0, __readyCnt = 0;

function init(){
  AssetsManager.loadCharacterData();
  BedroomCanvas = document.getElementById('bedroom-canvas');
  BedroomGL     = BedroomCanvas.getContext('webgl', {
    preserveDrawingBuffer: true,
    premultipliedAlpha: PREMUL_ALPHA,
  });
  CharacterSkeletons = [], CharacterAnimStates = [];
  CharacterBounds    = [], CharacterAnimations = [];
  BedroomRenderer = new spine.webgl.SceneRenderer(BedroomCanvas, BedroomGL);
	BedroomRenderer.debugRendering = false;
	CharacterAssetManager = new spine.webgl.AssetManager(BedroomGL);
  setup();
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  let scenes = AssetsManager.CharacterData[__CharacterId].MCharacterScenes.sort(
    (a,b) => {return a.KizunaRank - b.KizunaRank}
  );
  SceneId = scenes[0].MSceneId+1;
  let baseurl = getBedroombaseUrl();
  $.ajax({
    url: `${baseurl}/still_configuration.json`,
    success: loadBedroomSpineMeta,
  });
}

function getBedroombaseUrl(sid=0){
  if(!sid){ sid = SceneId; }
  let pre = '', n = parseInt(SceneId / 100000);
  while(n > 10){
    pre += parseInt(n % 10);
    n = parseInt(n / 10);
  }
  pre = pre.split('').reverse().join('');
  return `${ASSET_HOST}/Spines/Stills/${pre}/${sid}`;
}

function loadBedroomSpineMeta(res){
  __readyReq = res.Partslength;
  for(let p of res.Parts){
    loadBedroomSpineData( getBedroomSpinePart(p.Path) );
  }
  startRendering();
}

function loadBedroomSpineData(data){
  CharacterAssetManager.loadTexture(data.png);
	CharacterAssetManager.loadText(data.atlas);
	CharacterAssetManager.loadBinary(data.skel);
  setupBedroomSpine(data);
}

function startRendering(){
  if(__readyCnt < __readyReq){
    return setTimeout(startRendering, 300);
  }
  $("#bedroom-loading-indicator").remove();
  setTimeout(() => {
    requestAnimationFrame(renderBedroom);
  }, 1000);
}

function setupBedroomSpine(data){
  if(!CharacterAssetManager.isLoadingComplete()){
		return setTimeout(() => {
			setupBedroomSpine(data);
		}, 100);
	}
  let chdata = loadSkeleton(CharacterAssetManager, data);
  let ord = CharacterSkeletons.length;
	CharacterSkeletons.push(chdata.skeleton);
	CharacterAnimStates.push(chdata.state);
	CharacterBounds.push(chdata.bounds);
  CharacterAnimations.push(chdata.animations);
  for(let i in chdata.state.data.skeletonData.slots){
    let sdat = chdata.state.data.skeletonData.slots[i];
    sdat.blendMode = 3;
	}
  chdata.state.setAnimation(0, chdata.animations[0], true);
  resizeBedroomCanvas();
  window.addEventListener('resize', resizeBedroomCanvas, true);
  __readyCnt += 1;
}

function getBedroomSpinePart(p){
  let baseurl = getBedroombaseUrl() + '/' + p;
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
	BedroomRenderer.camera.position.y = 0; // (CharacterBounds.offset.y + CharacterBounds.size.y / BedroomCameraYFactor);
	// BedroomRenderer.camera.up.y = -1;
	// BedroomRenderer.camera.direction.z = 1;
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
	BedroomRenderer.resize(spine.webgl.ResizeMode.Fit);
}

window.addEventListener('load', init)