const MaruHeaders = {
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept': 'text/plain, */*; q=0.01',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'Host': 'www.jpmarumaru.com',
  'Origin': 'https://www.jpmarumaru.com',
  'Referer': 'https://www.jpmarumaru.com/tw/toolKanjiFurigana.asp'
}

function RubifiyJapanese(text){
  $.ajax({
    url: "https://www.jpmarumaru.com/tw/api/json_KanjiFurigana.asp",
    headers: MaruHeaders,
    data: `Text=${encodeURIComponent(text)}`,
  });
}

function loadMainStory(){
  let parent = $("#story-main");

  registerCollapseIndicator($("#header-main"));
  $("#loading-indicator").remove();
  $("#main-section").attr('style', '');
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

function start(){
  if(!DataManager.isReady()){
    return setTimeout(() => {
      start();
    }, 300);
  }
  loadMainStory();
  loadEventStory();
  loadCharacterStory();
}

AssetsManager.initialize();
window.addEventListener("load", start);