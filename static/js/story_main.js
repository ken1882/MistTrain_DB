let WorldMap = null;
let MapRect  = new DOMRect();
let MainStoryData = {};
let WorldPinData = {};
let LocationData = {};
let WorldData = {};
let QuestData = {};
let PinAssets = {};
let BasePinAssets = {};
var __VolumeId;

const __MapURI = {
  '1': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
  '2': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
}

function init(){
  AssetsManager.requestAsset(5, loadWorldData);
  setup();
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  let map = document.getElementById("worldmap");
  map.style.width = `${WorldMap.width}px`;
  map.style.height = `${WorldMap.height}px`;
  map.style.backgroundImage = `url(${WorldMap.src})`;
  MapRect = map.getBoundingClientRect();
}

function loadWorldData(){
  loadWorldMap();
  loadLocationData();
  let plen = Object.keys(WorldPinData).length;
  AssetsManager.requestAsset(plen, loadPinAssets);
}

function loadWorldMap(){
  var image = new Image();
  image.crossOrigin = "anonymous";
  image.src = __MapURI[__VolumeId];
  image.onload = () => {
    WorldMap = image;
    AssetsManager.incReadyCounter();
  };
}

function getMainQuestId(stage, part){
  return 100000000 + parseInt((stage+1)/2)*1000000 + stage*1000 + 500 + part;
}

function loadPinAssets(){
  let pset = new Set();
  for(let i in WorldPinData){
    if(!WorldPinData.hasOwnProperty(i)){ continue; }
    let dat = WorldPinData[i];
    
  }
  let bset = new Set();
  for(let i in WorldPinData){
    if(!WorldPinData.hasOwnProperty(i)){ continue; }
    let dat = WorldPinData[i];
    if(!bset.has(dat.baseIllustType)){
      bset.add(dat.baseIllustType);
    }
  }
  AssetsManager.requestAsset(Array.from(bset).length, ()=>{

  });
}


function handlePinData(res){
  for(let i=0;i<res.length;++i){
    let obj = res[i];
    WorldPinData[obj.mAreaId] = obj;
  }
}

function handleLocationData(res){
  WorldData = res;
  for(let i=0;i<res.length;++i){
    let obj = res[i];
    for(let j=0;j<obj.Areas.length;j++){
      let area = obj.Areas[j];
      for(let k=0;k<area.Locations.length;++k){
        let loc = area.Locations[k];
        LocationData[loc.Id] = loc;
      }
    }
  }
}

function handleQuestData(res){
  for(let i=0;i<res.length;++i){
    let quest = res[i];
    QuestData[quest.Id] = quest;
  }
}

function loadLocationData(){
  $.ajax({
    url: "/static/json/mainstory_data.json",
    success: (res) => {
      MainStoryData = res;
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
  $.ajax({
    url: `https://assets.mist-train-girls.com/production-client-web-assets/Jsons/WorldPin/worldMapPin${__VolumeId}.json`,
    success: (res) => {
      handlePinData(res);
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
  $.ajax({
    url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MWorldViewModel.json",
    success: (res) => {
      handleLocationData(res);
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
  $.ajax({
    url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MQuestViewModel.json",
    success: (res) => {
      handleQuestData(res);
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
}


(function(){
  window.addEventListener("load", init);
})();