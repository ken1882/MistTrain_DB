const MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

let MainStoryData = {};

function RubifiyJapanese(text){
  $.ajax({
    url: "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    headers: MaruHeaders,
    data: `Text=${encodeURIComponent(text)}`,
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
  let parent = $("#story-events");
  var section = $(document.createElement('div'));
  var title = $(document.createElement('a'));
  section.attr('class', 'card card-body');
  title.attr('class', 'btn btn-secondary');
  title.attr('data-bs-toggle', 'collapse');
  title.text(Vocab['UnderConstruction'])
  section.append(title);
  parent.append(section);

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

function loadStoryData(){
  $.ajax({
    url: "/static/json/mainstory_data.json",
    success: (res) => {
      MainStoryData = res;
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
}

(function(){
  AssetsManager.requestAsset(1, loadStoryData);
  window.addEventListener("load", init);
})();