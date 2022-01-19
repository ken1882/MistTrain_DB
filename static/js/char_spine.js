var lastFrameTime = Date.now() / 1000;
var BattlerAssetManager, CharacterAssetManager;
var BattlerSkeleton, BattlerAnimState, BattlerBounds;
var CharacterSkeleton, CharacterAnimState, CharacterBounds;
var BattlerRenderer, CharacterRenderer;

var BattlerCanvasWidthScale = 0.6;
var BattlerSkeletonShrinkRate = 2.5;
const BattlerSkeletonShrinkFactor = 10.01;

var CharacterCanvasWidthScale = 0.5;
var CharacterSkeletonShrinkRate = 1.0;

var BattlerCanvas, CharacterCanvas;
var BattlerGL, CharacterGL;

let __FlagBattlerCanvasReady = false;
let __FlagCharacterCanvasReady = false;

const PREMUL_ALPHA = true;

const EmptyBackgroundColor = [0, 0, 0, 0];
const BattlerBackgroundColor   = [0.8, 0.8, 0.8, 1.0];
const CharacterBackgroundColor = [0, 0, 0, 0];
const DefaultBattlerAnimation = 'Idle';
const DefaultCharacterAnimation = 'Idle_Normal';
const DefaultHomepageAnimation = 'Idle';

let BattlerKeyBoneIndex = 1;
let BattlerCameraXFactor = 100;
let BattlerCameraYFactor = 4;

let DrawCharacterBackground = true;
let DrawBattlerBackground = true;

function init () {
	BattlerCanvas = document.getElementById("battler-canvas");
	BattlerCanvas.width = 300;
	BattlerCanvas.height = 250;
	BattlerGL = BattlerCanvas.getContext("webgl",{
		preserveDrawingBuffer: true,
		premultipliedAlpha: PREMUL_ALPHA,
	});
	BattlerRenderer = new spine.webgl.SceneRenderer(BattlerCanvas, BattlerGL);
	BattlerRenderer.debugRendering = false;
	CharacterCanvas = document.getElementById("character-canvas");
	CharacterGL = CharacterCanvas.getContext("webgl", {
		preserveDrawingBuffer: true,
		premultipliedAlpha: PREMUL_ALPHA
	});
	CharacterRenderer = new spine.webgl.SceneRenderer(CharacterCanvas, CharacterGL);
	CharacterRenderer.debugRendering = false;
	BattlerAssetManager = new spine.webgl.AssetManager(BattlerGL);
	CharacterAssetManager = new spine.webgl.AssetManager(CharacterGL);
}

function getBattlerSpineResourcesData(id){
	return {
		png: `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.png`,
		atlas: `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.atlas`,
		skel: `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.skel`,
		name: id,
		anim: DefaultBattlerAnimation
	}
}

function getEventActorSpineResourcesData(id){
	return {
		png: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Events/${id}/${id}.png`,
		atlas: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Events/${id}/${id}.atlas`,
		skel: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Events/${id}/${id}.skel`,
		name: id,
		anim: DefaultCharacterAnimation
	}
}

function getHomepageActorSpineResourcesData(id){
	return {
		png: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Homes/${id}/${id}.png`,
		atlas: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Homes/${id}/${id}.atlas`,
		skel: `https://assets.mist-train-girls.com/production-client-web-assets/Spines/Homes/${id}/${id}.skel`,
		name: id,
		anim: DefaultHomepageAnimation
	}
}

function loadBattlerSpineResources(rssdata){
	BattlerAssetManager.loadTexture(rssdata.png);
	BattlerAssetManager.loadText(rssdata.atlas);
	BattlerAssetManager.loadBinary(rssdata.skel);
	loadBattlerSpineData(rssdata);
}

function loadCharacterSpineResources(rssdata){
	CharacterAssetManager.loadTexture(rssdata.png);
	CharacterAssetManager.loadText(rssdata.atlas);
	CharacterAssetManager.loadBinary(rssdata.skel);
	loadCharacterSpineData(rssdata);
}

function loadBattlerSpineData(rssdata){
	if(!BattlerAssetManager.isLoadingComplete()){
		return setTimeout(() => {
			loadBattlerSpineData(rssdata);
		}, 100);
	}
	var data = loadSkeleton(BattlerAssetManager,rssdata);
	BattlerSkeleton = data.skeleton;
	BattlerAnimState = data.state;
	BattlerBounds = data.bounds;
	for(let i in BattlerAnimState.data.skeletonData.slots){
		let sdat = BattlerAnimState.data.skeletonData.slots[i];
		let bone = BattlerAnimState.data.skeletonData.slots[i].boneData;
		if(bone.transformMode == 2){ bone.transformMode = 0; }
		if(sdat.blendMode == 1){ sdat.blendMode = 3; }
	}
	resizeBattlerCanvas();
	requestAnimationFrame(renderBattler);
	window.addEventListener("resize", resizeBattlerCanvas, true);
	$("#battler-loading-indicator").remove();	
	__FlagBattlerCanvasReady = true;
}

function loadCharacterSpineData(rssdata){
	if(!CharacterAssetManager.isLoadingComplete()){
		return setTimeout(() => {
			loadCharacterSpineData(rssdata);
		}, 100);
	}
	var data = loadSkeleton(CharacterAssetManager,rssdata);
	CharacterSkeleton = data.skeleton;
	CharacterAnimState = data.state;
	CharacterBounds = data.bounds;
	for(let i in CharacterAnimState.data.skeletonData.slots){
		let sdat = CharacterAnimState.data.skeletonData.slots[i];
		let bone = CharacterAnimState.data.skeletonData.slots[i].boneData;
		if(bone.transformMode == 2){ bone.transformMode = 0; }
		if(sdat.blendMode == 1){ sdat.blendMode = 3; }
	}
	resizeCharacterCanvas();
	requestAnimationFrame(renderCharacter);
	window.addEventListener("resize", resizeCharacterCanvas, true);
	$("#character-loading-indicator").remove();
	__FlagCharacterCanvasReady = true;
	CharacterAnimState.timeScale = 15;
}

function loadSkeleton(astmgr, rssdata) {
	if(!rssdata.skin) rssdata.skin = "default";
	atlas = new spine.TextureAtlas(
		astmgr.get(rssdata.atlas), 
		(_) => {
			return astmgr.get(rssdata.png);
		}
	);
  
	// Create a AtlasAttachmentLoader, which is specific to the WebGL backend.
	atlasLoader = new spine.AtlasAttachmentLoader(atlas);

	// Create a SkeletonBinary instance for parsing the .json file.
	var SkeletonBinary = new spine.SkeletonBinary(atlasLoader);

	// Set the scale to apply during parsing, parse the file, and create a new skeleton.
	var skeletonData = SkeletonBinary.readSkeletonData(astmgr.get(rssdata.skel));
	var skeleton = new spine.Skeleton(skeletonData);
	skeleton.scaleY = -1;
	var bounds = calculateBounds(skeleton);
	skeleton.setSkinByName(rssdata.skin);

	// Create an AnimationState, and set the initial animation in looping mode.
	var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
	animationState.setAnimation(0, rssdata.anim, true);
	// animationState.addListener({
	// 	event: function(trackIndex, event) {
	// 		console.log("Event on track " + trackIndex + ": " + JSON.stringify(event));
	// 	},
	// 	complete: function(trackIndex, loopCount) {
	// 		console.log("Animation on track " + trackIndex + " completed, loop count: " + loopCount);
	// 	},
	// 	start: function(trackIndex) {
	// 		console.log("Animation on track " + trackIndex + " started");
	// 	},
	// 	end: function(trackIndex) {
	// 		console.log("Animation on track " + trackIndex + " ended");
	// 	}
	// });
	
	// Pack everything up and return to caller.
	return { skeleton: skeleton, state: animationState, bounds: bounds };
}

function calculateBounds(skeleton) {
	skeleton.setToSetupPose();
	skeleton.updateWorldTransform();
	var offset = new spine.Vector2();
	var size = new spine.Vector2();
	skeleton.getBounds(offset, size, []);
	return { offset: offset, size: size };
}

function renderBattler(){
	var now = Date.now() / 1000;
	var delta = now - lastFrameTime;
	var gl = BattlerGL;
	lastFrameTime = now;
	updateCanvasSize(BattlerCanvas);
	BattlerRenderer.begin()
	BattlerAnimState.update(delta);
	BattlerAnimState.apply(BattlerSkeleton);
	BattlerSkeleton.updateWorldTransform();
	if(DrawBattlerBackground){
		gl.clearColor.apply(gl, BattlerBackgroundColor);
	}
	else{
		gl.clearColor.apply(gl, EmptyBackgroundColor);
	}
	gl.clear(gl.COLOR_BUFFER_BIT);
	BattlerRenderer.begin();
	BattlerRenderer.drawSkeleton(BattlerSkeleton, PREMUL_ALPHA);
	if(BattlerRenderer.debugRendering){
		BattlerRenderer.drawSkeletonDebug(BattlerSkeleton, PREMUL_ALPHA, ["root"]);
	}
	BattlerRenderer.end()
	BattlerRenderer.camera.position.x = BattlerSkeleton.bones[BattlerKeyBoneIndex].x - BattlerCameraXFactor;
	BattlerRenderer.camera.position.y = (BattlerBounds.offset.y + BattlerBounds.size.y / BattlerCameraYFactor) - BattlerSkeleton.bones[BattlerKeyBoneIndex].y;
	requestAnimationFrame(renderBattler);
}

function renderCharacter(){
	var now = Date.now() / 1000;
	var delta = now - lastFrameTime;
	var gl = CharacterGL;
	lastFrameTime = now;
	updateCanvasSize(CharacterCanvas);
	CharacterRenderer.begin()
	CharacterAnimState.update(delta);
	CharacterAnimState.apply(CharacterSkeleton);
	CharacterSkeleton.updateWorldTransform();
	if(DrawCharacterBackground){
		gl.clearColor.apply(gl, CharacterBackgroundColor);
	}
	else{
		gl.clearColor.apply(gl, EmptyBackgroundColor);
	}
	gl.clear(gl.COLOR_BUFFER_BIT);
	CharacterRenderer.begin();
	CharacterRenderer.drawSkeleton(CharacterSkeleton, false);
	if(CharacterRenderer.debugRendering){
		CharacterRenderer.drawSkeletonDebug(CharacterSkeleton, false, ["root"]);
	}
	CharacterRenderer.end()
	requestAnimationFrame(renderCharacter);
}

function resizeBattlerCanvas(){
	var portion = BattlerCanvas.clientWidth / BattlerCanvas.clientHeight;
	var w = window.innerWidth * BattlerCanvasWidthScale;
	var h = w / portion;
	BattlerCanvas.width = w;
	BattlerCanvas.height = h;
	BattlerRenderer.camera.position.x = 0;
	BattlerRenderer.camera.position.y = (BattlerBounds.offset.y + BattlerBounds.size.y / BattlerCameraYFactor);
	BattlerRenderer.camera.up.y = -1;
	BattlerRenderer.camera.direction.z = 1;
	BattlerRenderer.camera.viewportWidth = BattlerBounds.size.x * BattlerSkeletonShrinkRate;
	BattlerRenderer.camera.viewportHeight = BattlerBounds.size.y * BattlerSkeletonShrinkRate;
	BattlerRenderer.resize(spine.webgl.ResizeMode.Fit);
	var ch = BattlerCanvas.height - 32;
	var lh = 28;
	$("#battler-act-list").attr('size', parseInt(ch / lh));
}

function resizeCharacterCanvas(){
	// var portion = CharacterCanvas.clientWidth / CharacterCanvas.clientHeight;
	var portion = CharacterBounds.size.x / CharacterBounds.size.y;
	var w = window.innerWidth * CharacterCanvasWidthScale;
	var h = w / portion;
	var h2 = window.innerHeight * 0.9;
	if(h > h2){
		h = h2;
		w = portion * h;
	}
	CharacterCanvas.width = w;
	CharacterCanvas.height = h;
	CharacterRenderer.camera.position.x = CharacterBounds.offset.x + CharacterBounds.size.x / 2;
	CharacterRenderer.camera.position.y = CharacterBounds.offset.y + CharacterBounds.size.y / 2;
	CharacterRenderer.camera.up.y = -1;
	CharacterRenderer.camera.direction.z = 1;
	CharacterRenderer.camera.viewportWidth = CharacterBounds.size.x * CharacterSkeletonShrinkRate;
	CharacterRenderer.camera.viewportHeight = CharacterBounds.size.y * CharacterSkeletonShrinkRate;
	CharacterRenderer.resize(spine.webgl.ResizeMode.Fit);
	var ch = CharacterCanvas.height - 32;
	var lh = 28;
	$("#char-act-list").attr('size', parseInt(ch / lh));
}

function updateCanvasSize(canvas){
	var w = canvas.clientWidth;
	var h = canvas.clientHeight;
	if(canvas.width != w || canvas.height != h){
		canvas.width = w;
		canvas.height = h;
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

function exportCharacterCanvas(){
	if(!__FlagCharacterCanvasReady){ return; }
	let canvas = createGlContextSnapshot(CharacterGL);
	window.open(canvas.toDataURL("image/png"));
	canvas.remove();
}

function exportBattlerCanvas(){
	if(!__FlagBattlerCanvasReady){ return; }
	let canvas = createGlContextSnapshot(BattlerGL);
	window.open(canvas.toDataURL("image/png"));
	canvas.remove();
}

(function() { 
	addEventListener("load", init);
}());