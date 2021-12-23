let WorldMap = null;
let MapRect  = new DOMRect();

const __MapURI = {
  '1': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
  '2': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
}

function init(){
  AssetsManager.requestAsset(1, loadWorldMap);
  setup();
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 100);
  }
  let map = document.getElementById("worldmap");
  map.style.width = `${WorldMap.width}px`;
  map.style.height = `${WorldMap.height}px`;
  map.style.backgroundImage = `url(${WorldMap.src})`;
  MapRect = map.getBoundingClientRect();
}

function loadWorldMap(){
  var image = new Image();
  image.crossOrigin = "anonymous";
  image.src = __MapURI[__VolumeId];
  image.onload = () => {
    WorldMap = image;
    AssetsManager.__readyCnt += 1;
  };
}

(function(){
  AssetsManager.initialize();
  window.addEventListener("load", init);
})()