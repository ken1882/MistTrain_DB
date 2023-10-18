let WorldMap = null;
let MapRect  = new DOMRect();
let MainStoryData = {};
let WorldPinData = {};
let LocationData = {};
let WorldData = {};
let QuestData = {};
let SceneData = {};
let TopPinAssets = {};
let BasePinAssets = {};
let ChapterPinIdMap = {};
let OccuptionMap = {};
let ChapterData = {};
let LocationPinCanvas = document.createElement('canvas');
let LocationPinContext = LocationPinCanvas.getContext('2d');
var __VolumeId;
const PinBaseOffset = 82;
const PinScale = 0.5;
LocationPinCanvas.width = 140*PinScale;
LocationPinCanvas.height = 210*PinScale;

const __MapURI = {
  '1': 'https://assets.mist-train-girls.com/production-client-web/83/res/raw-assets/63/63d4f1ac-f1f7-476f-b744-f8f38902a445.jpg',
  '2': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
  '3': 'https://assets.mist-train-girls.com/production-client-web/81/res/raw-assets/61/615148e8-5947-412a-8b5c-eeeb12f5593a.jpg',
  '4': 'https://assets.mist-train-girls.com/production-client-web/83/res/raw-assets/63/63d4f1ac-f1f7-476f-b744-f8f38902a445.jpg',
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
  let front = MainStoryData.Volumes[__VolumeId].FirstStage;
  let rear  = 9999;
  try{
    rear = MainStoryData.Volumes[__VolumeId+1].FirstStage;
  }
  catch(e){
    // do nothing
  }
  let chaps = response.sort((a,b)=>{ return a.MChapterId - b.MChapterId; });
  let parent = $("#worldmap");
  let timg_set = new Set();
  for(let i in chaps){
    let chap = chaps[i];
    let id = chap.MChapterId;
    ChapterData[id] = chap;
    if(id < front || id >= rear){ continue; }
    let px = MapRect.x + MapRect.width / 2 - LocationPinCanvas.width*PinScale/2;
    let py = MapRect.y + MapRect.height / 2 - (LocationPinCanvas.height*PinScale+PinBaseOffset/2)/2;
    let pin_idx = id*2-1;     // use upper part as pin position first
    let timg_idx = pin_idx;   // use upper part as pin icon image first
    if(timg_set.has(ChapterPinIdMap[timg_idx])){ // switch to another part is used in other chapters
      timg_idx += 1;
    } // Pin base image is same in upper/lower so don't care
    timg_set.add(ChapterPinIdMap[timg_idx]);
    let pin_dat = WorldPinData[pin_idx];
    let bimg = BasePinAssets[pin_dat.baseIllustType];
    let timg = TopPinAssets[ChapterPinIdMap[timg_idx]];
    let lx = px + pin_dat.x;
    let ly = py + pin_dat.y * -1;
    let lhash = parseInt(lx/10) + parseInt(ly/10)*1000;
    if(OccuptionMap.hasOwnProperty(lhash)){
      pin_idx = id*2;
      pin_dat = WorldPinData[pin_idx];
      lx = px + pin_dat.x;
      ly = py + pin_dat.y * -1;
      lhash = parseInt(lx/10) + parseInt(ly/10)*1000;
    }
    LocationPinContext.clearRect(0, 0, LocationPinCanvas.width, LocationPinCanvas.height);
    LocationPinContext.drawImage(
      bimg,
      0, PinBaseOffset*PinScale,
      bimg.naturalWidth*PinScale, bimg.naturalHeight*PinScale
    );
    LocationPinContext.drawImage(
      timg,
      0, 0,
      timg.naturalWidth*PinScale, timg.naturalHeight*PinScale
    );
    let node = document.createElement('a');
    let img = document.createElement('img');
    let txt = document.createElement('span');
    if(!OccuptionMap.hasOwnProperty(lhash)){
      OccuptionMap[lhash] = [];
    }
    $(node).attr('class', 'locationpin');
    $(node).attr('id', `loc-pin-${id}`);
    $(node).attr('data-bs-toggle', 'offcanvas');
    $(node).attr('data-bs-target', '#offcanvasBottom');
    $(node).attr('aria-controls', 'offcanvasBottom');
    $(node).css('left', lx);
    $(node).css('top', ly);
    node.addEventListener("click", showChapterContent);
    $(txt).attr('class', 'locationchapter');
    $(txt).text(id < 10 ? '0'+id : id);
    img.src = LocationPinCanvas.toDataURL();
    node.append(img);
    node.append(txt);
    parent.append(node);
    OccuptionMap[lhash].push(i);
  }
  toggleChapTextVisibility();
}

function showChapterContent(event){
  let chid = event.target.parentElement.id.split('-').reverse()[0];
  let title = Vocab['StoryChapter'].replace("%i", chid) + ' ';
  if(Vocab.MainStoryChapterTitle.hasOwnProperty(chid*2)){
    title += Vocab.MainStoryChapterTitle[chid*2].stageName;
  }
  else{
    title += WorldPinData[chid*2].stageName;
  }
  $("#chapter-title").text(title);
  let parent = $("#chapter-storylist");
  parent[0].innerHTML = '';
  let chapter = ChapterData[chid];
  let scenes  = chapter.Scenes.sort((a,b) => {
    return a.MSceneId - b.MSceneId;
  });
  console.log(scenes);
  for(let i=0;i<scenes.length;++i){
    let li = document.createElement('li');
    let node = document.createElement('a');
    let scene = SceneData[scenes[i].MSceneId];
    $(node).attr('href', `/story_transcript/${scene.Id}?t=m`);
    $(node).attr('target', '_blank');
    let txt = scene.Title;
    if(Vocab.SceneTitle.hasOwnProperty(scene.Id)){
      txt = Vocab.SceneTitle[scene.Id];
    }
    $(node).text(`${i+1}. ${txt}`);
    li.append(node);
    parent.append(li);
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
        url: `${ASSET_HOST}/Jsons/WorldPin/worldMapPin${__VolumeId}.json`,
        success: (res) => {
          handlePinData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: `${STATIC_HOST}/MasterData/MWorldViewModel.json`,
        success: (res) => {
          handleLocationData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: `${STATIC_HOST}/MasterData/MQuestViewModel.json`,
        success: (res) => {
          handleQuestData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    },
    ()=>{
      $.ajax({
        url: `${STATIC_HOST}/MasterData/MSceneViewModel.json`,
        success: (res) => {
          handleSceneData(res);
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      })
    }
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
    // for(let j=5;j>0;j--){
    for(let j=1;j<=5;++j){
      qid  = getMainQuestId(dat.mAreaId, j);
      qdat = QuestData[qid];
      ldat = LocationData[qdat.MLocationId];
      pid  = ldat.PinType;
      if(pid && !pset.has(pid)){ break; }
    }
    pset.add(pid);
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `${ASSET_HOST}/Textures/Parts/Icons/Pins/illust/${pid}.png`;
    image.onload = ()=>{
      AssetsManager.incReadyCounter();
    };
    image.onerror = ()=>{
      console.error(`Failed to load image: ${image.src}`);
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
      image.src = `${ASSET_HOST}/Textures/Parts/Icons/Pins/base/${bid}.png`;
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

function handleSceneData(res){
  for(let i=0;i<res.length;++i){
    let scene = res[i];
    SceneData[scene.Id] = scene;
  }
}

function toggleChapTextVisibility(){
  let nodes = document.getElementsByClassName('locationchapter');
  let checked = $("#ckb_chapterid").prop('checked');
  for(let i in nodes){
    if(!nodes.hasOwnProperty(i)){continue;}
    let node = nodes[i];
    if(checked){ $(node).show(); }
    else{ $(node).hide(); }
  }
}

(function(){
  window.addEventListener("load", init);
})();