const MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

let MainStoryData = {};
let EventStoryData = {};

function RubifiyJapanese(text, ok_handler, err_handler=null){
  if(!err_handler){
    err_handler = (res)=>{ console.error(res); }
  }
  $.ajax({
    url: "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    type: "POST",
    crossDomain: true,
    headers: MaruHeaders,
    data: `Text=${encodeURIComponent(text)}`,
    sucess: ok_handler,
    error: err_handler
  });
}

function loadMainStory(){
  registerCollapseIndicator($("#header-main"));
  $("#loading-indicator").remove();
  $("#main-section").attr('style', '');
  let vols = Object.keys(MainStoryData.Volumes).length;
  let parent = $("#main-section");
  for(let i=0;i<vols;++i){
    let container = $(document.createElement("div"));
    container.attr('id', `main-story-${i+1}`);
    container.attr('class', 'collapse story-main-collapse');
    let section = $(document.createElement('div'));
    section.attr('class', 'card card-body');
    let node = $(document.createElement('a'));
    node.attr('class', 'btn btn-secondary');
    node.attr('href', `/mainstory_map/${i+1}`);
    let text = Vocab['MainStoryVolume'];
    text = text.replace('%i', i+1);
    node.text(text);
    section.append(node);
    container.append(section);
    parent.append(container);
  }
}

function loadEventStory(){
  let parent = $("#event-section");
  for(let i=0;i<EventStoryData.length;++i){
    let scene = EventStoryData[i];
    // Chapter container
    let container = $(document.createElement("div"));
    container.attr('id', `event-story-${scene.MChapterId}`);
    container.attr('class', 'collapse story-events-collapse');
    let section = $(document.createElement('div'));
    section.attr('class', 'card card-body');
    let node = $(document.createElement('a'));
    node.attr('class', 'btn btn-secondary');
    let img = document.createElement('img');
    $(img).css('max-height', '60px');
    img.src = `${ASSET_HOST}/Textures/Banners/Theater/events/${scene.MChapterId}.png`;
    let desc = document.createElement('span');
    let text = scene.Title;
    $(desc).css('padding', '4px');
    $(desc).text(text);
    node.append(img);
    node.append(desc);
    
    // scene container
    var container_id = `section-container-${scene.MChapterId}`;
    node.attr('data-bs-toggle', 'collapse');
    node.attr('aria-controls', `${container_id}`);
    node.attr('href', `#${container_id}`);
    section.append(node);
    registerCollapseIndicator(node);

    var chapter_container = $(document.createElement('div'));
    chapter_container.attr('id', `${container_id}`);
    let eid = scene.MEventId || 0;
    for(let j=0;j<scene.Scenes.length;++j){
      var sc = scene.Scenes[j];
      var chap_btn = $(document.createElement('a'));
      let sid = sc.MSceneId;

      chap_btn.attr('class', 'btn btn-success collapse');
      chap_btn.attr('data-bs-toggle', 'collapse');
      chap_btn.attr('id', `${container_id}`);
      chap_btn.css('margin', '4px');
      chap_btn.on('click', (_)=>{
        window.open(`/story_transcript/${sid}?t=e&c=${eid}`, '_blank').focus();
      });
      var txt = AssetsManager.SceneData[sid].Title;
      chap_btn.text(`${j+1}. ${txt}`);
      chap_btn.append(chap_btn);
      chapter_container.append(chap_btn);
    }

    node.append(chapter_container);
    container.append(section);
    parent.append(container);

  }

  registerCollapseIndicator($("#header-events"));
  $("#loading-indicator2").remove();
  $("#event-section").attr('style', '');
}

function loadCharacterStory(){
  let parent = $("#story-characters");
  var section = $(document.createElement('div'));
  var title = $(document.createElement('a'));
  section.attr('class', 'card card-body');
  title.attr('class', 'btn btn-secondary');
  title.attr('data-bs-toggle', 'collapse');
  title.text(Vocab['UnderConstruction'])
  section.append(title);
  parent.append(section);

  registerCollapseIndicator($("#header-characters"));
  $("#loading-indicator3").remove();
  $("#character-section").attr('style', '');
}

function loadSponsorScene(){
  let parent = $("#story-sponsor");
  var section = $(document.createElement('div'));
  var title = $(document.createElement('a'));
  section.attr('class', 'card card-body');
  title.attr('class', 'btn btn-secondary');
  title.attr('data-bs-toggle', 'collapse');
  title.text(Vocab.SponsorSceneDesc)
  section.append(title);
  parent.append(section);
  $(title).on('click', (_)=>{ processSponsorScene(); });

  registerCollapseIndicator($("#header-sponsor"));
}


function sendSponsorScene(){
  showSponsorOverlay();
  $.ajax({
    method: 'POST',
    url: '/api/SponsorScenes',
    data: {'token': getMTGToken()},
    success: (res) => {
      console.log(res);
      alert(Vocab.SponsorSceneDone);
      hideSponsorOverlay();
      window.onbeforeunload = null;
    },
    error: (res) => {
      if(res.status == 409){
        alert(Vocab.SponsorSceneLocked);
      }
      else if(res.status == 401){
        handleGameConnectionError(res);
      }
      else if(res.status == 403){
        alert(Vocab.UnderMaintenance);
      }
      else{
        alert(Vocab.UnknownError);
      }
      hideSponsorOverlay();
      window.onbeforeunload = null;
    }
  });
}

function processSponsorScene(){
  if(!getMTGToken()){
    handleNotLoggedin();
    return ;
  }
  var ok = confirm(Vocab.SponsorSceneConfirm);
  if(ok){
    window.onbeforeunload = (_)=>{return 'leave page?';};
    sendSponsorScene();
  }
}

function showSponsorOverlay(){
  $("#loading-overlay").modal('show');
}

function hideSponsorOverlay(){
  $("#loading-overlay").modal('hide');
}

function loadStoryData(){
  $.ajax({
    url: "/static/json/mainstory_data.json",
    success: (res) => {
      MainStoryData = res;
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
  $.ajax({
    url: '/static/json/event_scene.json',
    success: (res) => {
      EventStoryData = res;
      AssetsManager.incReadyCounter();
    },
    error: handleAjaxError,
  });
}

function init(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(() => {
      init();
    }, 300);
  }
  loadMainStory();
  loadEventStory();
  loadCharacterStory();
  loadSponsorScene();
}

(function(){
  AssetsManager.loadSceneData();
  AssetsManager.requestAsset(1, loadStoryData);
  window.addEventListener("load", init);
})();