let WorldMap = null;
let MapRect  = new DOMRect();
let MainStoryData = {};
let WorldPinData = {};
let LocationData = {};
let WorldData = {};
let QuestData = {};
let TopPinAssets = {};
let BasePinAssets = {};
let ChapterPinIdMap = {};
let LocationPinCanvas = document.createElement('canvas');
LocationPinCanvas.width = 500;
LocationPinCanvas.height = 500;
let LocationPinContext = LocationPinCanvas.getContext('2d');
var __VolumeId;

const __MapURI = {
  '1': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
  '2': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
}

function init(){
  loadWorldData();
  setup();
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  setupWorldMap();
  loadVolumeData();
}

function setupWorldMap(){
  let map = document.getElementById("worldmap");
  map.style.width = `${WorldMap.width}px`;
  map.style.height = `${WorldMap.height}px`;
  map.style.backgroundImage = `url(${WorldMap.src})`;
  MapRect = map.getBoundingClientRect();
}

function loadVolumeData(){
  $.ajax({
    url: "/static/json/main_scene.json",
    success: setupChapterPins,
    error: handleAjaxError,
  });
}

function setupChapterPins(response){
  console.log(response);
  let front = MainStoryData.Volumes[__VolumeId].FirstStage;
  let rear  = MainStoryData.Volumes[__VolumeId+1].FirstStage;
  let chaps = response.sort((a,b)=>{ return a.MChapterId - b.MChapterId; });
  let parent = $("#worldmap");
  window.Chapters = chaps;
  for(let i in chaps){
    let chap = chaps[i];
    let id = chap.MChapterId;
    if(id < front || id >= rear){ continue; }
    let pin_idx = id + (id&1);
    let pin_dat = WorldPinData[pin_idx];
    let px = MapRect.x + MapRect.width / 2;
    let py = MapRect.y + MapRect.height / 2;
    LocationPinContext.drawImage(
      BasePinAssets[pin_dat.baseIllustType],
      0, 82
    );
    LocationPinContext.drawImage(
      TopPinAssets[ChapterPinIdMap[pin_idx]],
      0, 0
    );
    let node = document.createElement('a');
    let img = document.createElement('img');
    $(node).attr('class', 'locationpin');
    $(node).attr('id', `loc-pin-${id}`);
    $(node).css('left', px+pin_dat.x);
    $(node).css('top', py+pin_dat.y);
    img.src = LocationPinCanvas.toDataURL();
    node.append(img);
    parent.append(node);
    // console.log(chap);
    console.log(pin_dat);
  }
}

function loadWorldData(){
  AssetsManager.requestSingletonAssets(
    loadWorldMap,
    ()=>{
      $.ajax({
        url: "/static/json/mainstory_data.json",
        success: (res) => {
          MainStoryData = res;
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: `https://assets.mist-train-girls.com/production-client-web-assets/Jsons/WorldPin/worldMapPin${__VolumeId}.json`,
        success: (res) => {
          handlePinData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MWorldViewModel.json",
        success: (res) => {
          handleLocationData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MQuestViewModel.json",
        success: (res) => {
          handleQuestData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
  )
  AssetsManager.queueAssetRequest(()=>{
    let plen = Object.keys(WorldPinData).length;
    AssetsManager.requestAsset(plen, loadPinAssets);
  });
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
  // load pin icons
  for(let i in WorldPinData){
    if(!WorldPinData.hasOwnProperty(i)){ continue; }
    let dat = WorldPinData[i];
    let pid = 0, qid = 0, qdat = null, ldat = null;
    for(let j=5;j>0;j--){
    // for(let j=1;j<=5;++j){
      qid  = getMainQuestId(dat.mAreaId, j);
      qdat = QuestData[qid];
      ldat = LocationData[qdat.MLocationId];
      pid  = ldat.PinType;
      if(pid && !pset.has(pid)){ break; }
    }
    pset.add(pid);
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `https://assets.mist-train-girls.com/production-client-web-assets/Textures/Parts/Icons/Pins/illust/${pid}.png`;
    image.onload = ()=>{
      AssetsManager.incReadyCounter();
    };
    TopPinAssets[pid] = image;
    ChapterPinIdMap[i] = pid;
  }
  // load pin icon base
  let bset = new Set();
  for(let i in WorldPinData){
    if(!WorldPinData.hasOwnProperty(i)){ continue; }
    let dat = WorldPinData[i];
    if(!bset.has(dat.baseIllustType)){
      bset.add(dat.baseIllustType);
    }
  }
  let bar = Array.from(bset);
  AssetsManager.requestAsset(bar.length, ()=>{
    for(let i in bar){
      let bid = bar[i];
      var image = new Image();
      image.crossOrigin = "anonymous";
      image.src = `https://assets.mist-train-girls.com/production-client-web-assets/Textures/Parts/Icons/Pins/base/${bid}.png`;
      image.onload = ()=>{
        AssetsManager.incReadyCounter();
      };
      BasePinAssets[bid] = image;
    }
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

(function(){
  window.addEventListener("load", init);
})();