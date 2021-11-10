var lastFrameTime = Date.now() / 1000;
var canvas, gl;
var assetManager;
var skeleton, state, bounds;
var renderer;
// const glCanvas  = document.createElement("canvas");
// const glContext = glCanvas.getContext('webgl');

var skelName = __CharacterId;
var animName = "Idle";

var CanvasWidthScale = 0.8; // window.innerwidth * this
var SkeletonShrinkRate = 1.8;

function init () {
	canvas = document.getElementById("char-canvas");
	gl = canvas.getContext("webgl");

	renderer = new spine.webgl.SceneRenderer(canvas, gl);
	renderer.debugRendering = false;
	// enable debug rendering
	// skeletonRenderer.debugRendering = true;
	// enable the triangle renderer, supports meshes, but may produce artifacts in some browsers
	// skeletonRenderer.triangleRendering = true;
	
	assetManager = new spine.webgl.AssetManager(gl);

	var rss = makeSpineResourcesPaths(skelName);
	loadSpineResources(rss[0], rss[1], rss[2]);
}

function makeSpineResourcesPaths(id){
	return [
		`https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.png`,
		`https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.atlas`,
		`https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.skel`,
	]
}

function loadSpineResources(png, atlas, skel){
	assetManager.loadTexture(png);
	assetManager.loadText(atlas);
	assetManager.loadBinary(skel);
	requestAnimationFrame(load);
}

function load(){
	if (assetManager.isLoadingComplete()) {
		var data = loadSkeleton(skelName, animName, "default");
		skeleton = data.skeleton;
		state = data.state;
		bounds = data.bounds;
		for(let i in state.data.skeletonData.slots){
			let bone = state.data.skeletonData.slots[i].boneData;
			console.log(bone.transformMode);
			if(bone.transformMode == 2){ bone.transformMode = 0; }
		}
		resizeCharacterCanvas();
		requestAnimationFrame(render);
		window.addEventListener("resize", resizeCharacterCanvas, true);
		$("#loading-indicator").remove();
	}
	else{
		requestAnimationFrame(load);
	}
}

function loadSkeleton(name, initialAnimation, skin) {
	if (skin === undefined) skin = "default";
	var rss_paths = makeSpineResourcesPaths(name);

	// Load the texture atlas using name.atlas and name.png from the AssetManager.
	// The function passed to TextureAtlas is used to resolve relative paths.
	atlas = new spine.TextureAtlas(
		assetManager.get(rss_paths[1]), 
		(_) => {
			return assetManager.get(rss_paths[0]);
		}
	);
  
	// Create a AtlasAttachmentLoader, which is specific to the WebGL backend.
	atlasLoader = new spine.AtlasAttachmentLoader(atlas);

	// Create a SkeletonBinary instance for parsing the .json file.
	var SkeletonBinary = new spine.SkeletonBinary(atlasLoader);

	// Set the scale to apply during parsing, parse the file, and create a new skeleton.
	var skeletonData = SkeletonBinary.readSkeletonData(assetManager.get(rss_paths[2]));
	var skeleton = new spine.Skeleton(skeletonData);
	skeleton.scaleY = -1;
	var bounds = calculateBounds(skeleton);
	skeleton.setSkinByName(skin);

	// Create an AnimationState, and set the initial animation in looping mode.
	var animationState = new spine.AnimationState(new spine.AnimationStateData(skeleton.data));
	animationState.setAnimation(0, initialAnimation, true);
	animationState.addListener({
		event: function(trackIndex, event) {
			// console.log("Event on track " + trackIndex + ": " + JSON.stringify(event));
		},
		complete: function(trackIndex, loopCount) {
			// console.log("Animation on track " + trackIndex + " completed, loop count: " + loopCount);
		},
		start: function(trackIndex) {
			// console.log("Animation on track " + trackIndex + " started");
		},
		end: function(trackIndex) {
			// console.log("Animation on track " + trackIndex + " ended");
		}
	});
	
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

function render () {
	var now = Date.now() / 1000;
	var delta = now - lastFrameTime;
	lastFrameTime = now;

	resize();

	// context.save();
	// context.setTransform(1, 0, 0, 1, 0, 0);
	// context.fillStyle = "#cccccc";
	// context.fillRect(0, 0, canvas.width, canvas.height);
	// context.restore();
	
	renderer.begin()

	state.update(delta);
	state.apply(skeleton);
	skeleton.updateWorldTransform();

	gl.clearColor(0.8, 0.8, 0.8, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	renderer.begin();
	renderer.drawSkeleton(skeleton, true);
	if(renderer.debugRendering){
		renderer.drawSkeletonDebug(skeleton, false, ["root"]);
	}

	renderer.end()

	// context.strokeStyle = "green";
	// context.beginPath();
	// context.moveTo(-1000, 0);
	// context.lineTo(1000, 0);
	// context.moveTo(0, -1000);
	// context.lineTo(0, 1000);
	// context.stroke();

	requestAnimationFrame(render);
}

function resizeCharacterCanvas(){
	var portion = canvas.clientWidth / canvas.clientHeight;
	var w = window.innerWidth * CanvasWidthScale;
	var h = w / portion;
	canvas.width = w;
	canvas.height = h;
	renderer.camera.position.x = 0; // bounds.offset.x + bounds.size.x / 2;
	renderer.camera.position.y = bounds.offset.y + bounds.size.y / 2;
	renderer.camera.up.y = -1;
	renderer.camera.direction.z = 1;
	renderer.camera.viewportWidth = bounds.size.x * SkeletonShrinkRate;
	renderer.camera.viewportHeight = bounds.size.y * SkeletonShrinkRate;
	renderer.resize(spine.webgl.ResizeMode.Fit);
}

function resize () {
	var w = canvas.clientWidth;
	var h = canvas.clientHeight;
	
	if (canvas.width != w || canvas.height != h) {
		canvas.width = w;
		canvas.height = h;
	}

}

(function() { 
	addEventListener("load", init);
}());