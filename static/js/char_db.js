let CharacterAvatarSet = null;
let CharacterFrameSet  = null;
let CharacterAvatarClip = {};
let IconClipData  = {}
let CharacterData = {};
let CharacterNodeList = {
  iconView: {},
  listView: {}
};
let __CntDataLoaded   = 0;
let __CntDataRequired = 5;
var AvatarCanvas, AvatarContext;
var FrameCanvas, FrameContext;
let AvatarFramePadding = 4;

function clipImage(canvas, image, target, cx, cy, cw, ch, dx=null, dy=null, dw=null, dh=null){
  if(dx == null){ dx = 0; }
  if(dy == null){ dy = 0; }
  if(dw == null){ dw = cw; }
  if(dh == null){ dh = ch; }
  var context = canvas.getContext('2d');
  context.webkitImageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, cx, cy, cw, ch, dx, dy, dw, dh);
  target.src = canvas.toDataURL();
}

function init(){
  AvatarCanvas  = document.createElement("canvas");
  AvatarCanvas.width = __CharacterAvatarWidth;
  AvatarCanvas.height = __CharacterAvatarHeight;
  AvatarContext = AvatarCanvas.getContext('2d');
  FrameCanvas = document.createElement("canvas");
  FrameCanvas.width = __CharacterFrameWidth;
  FrameCanvas.height = __CharacterFrameHeight;
  FrameContext = FrameCanvas.getContext('2d');
  setup();
}

function setup(){
  if(__CntDataLoaded < __CntDataRequired){
    return setTimeout(setup, 100);
  }
  appendCharacterAvatars();
  setupViewChangeButton();
}

function appendCharacterAvatars(){
  let parent = $('#character-list');
  for(let i in CharacterData){
    if(!CharacterData.hasOwnProperty(i)){continue;}
    let container = $(document.createElement('div'));
    container.attr('class', 'avatar-container');
    let block = $(document.createElement('a'))
    block.attr('href', `/character_database/${i}`);  
    container.append(block);
    let img = document.createElement('img');
    let img2 = document.createElement('img');
    $(img).attr('class', 'avatar');
    $(img2).attr('class', 'avatar-frame');
    block.append(img);
    block.append(img2);
    parent.append(container);
    CharacterNodeList.iconView[i] = container;
    let rect = CharacterAvatarClip.frames[`${i}.png`].textureRect.flat();
    let krarity = 'frm_thumb_rare_a';
    switch(CharacterData[i].CharacterRarity){
      case 3:
        krarity = 'frm_thumb_rare_s';
        break;
      case 4:
        krarity = 'frm_thumb_rare_ss';
        break;
    }
    let rect2 = IconClipData[krarity].content.rect;
    AvatarContext.clearRect(0, 0, AvatarCanvas.width, AvatarCanvas.height);
    FrameContext.clearRect(0, 0, FrameCanvas.width, FrameCanvas.height);
    clipImage(
      AvatarCanvas, CharacterAvatarSet, img, 
      rect[0], rect[1], rect[2], rect[3],
      AvatarFramePadding, AvatarFramePadding,
      AvatarCanvas.width - AvatarFramePadding*2, AvatarCanvas.height - AvatarFramePadding*2
    );
    clipImage(
      FrameCanvas, CharacterFrameSet, img2, 
      rect2[0], rect2[1], rect2[2], rect2[3], 
      0, 0, rect2[2], rect2[3]
    );
  }
  $("#loading-indicator").remove();
}

function setupViewChangeButton(){
  let vgrid = $("#gridview-button");
  let vlist = $("#listview-button");
  vgrid[0].addEventListener('click', viewChangeGrid);
  vlist[0].addEventListener('click', viewChangeList);
}

function viewChangeGrid(e){
  let vgrid = $("#gridview-button");
  let vlist = $("#listview-button");
  if(vgrid[0].classList.contains('btn-secondary')){ return; }
  vlist.removeClass('btn-secondary');
  vlist.addClass('btn-outline-secondary')
  vgrid.removeClass('btn-outline-secondary');
  vgrid.addClass('btn-secondary');
}

function viewChangeList(e){
  let vgrid = $("#gridview-button");
  let vlist = $("#listview-button");
  if(vlist[0].classList.contains('btn-secondary')){ return; }
  vgrid.removeClass('btn-secondary');
  vgrid.addClass('btn-outline-secondary')
  vlist.removeClass('btn-outline-secondary');
  vlist.addClass('btn-secondary');
}

function parseXMLKeyValueDict(node){
  let size = node.children.length;
  if(size == 0){
    if(node.tagName == 'false'){return false;}
    if(node.tagName == 'true'){return true;}
    if(node.tagName == 'array'){
      return [];
    }
    return eval(`"${node.textContent}"`)
  }
  for(let i=0;i<size;i+=2){
    let key = node.children[i].textContent;
    if(key.includes('Offset') || key.includes('Size') || key.includes('Rect')){
      let text = node.children[i+1].textContent.replaceAll('{','[').replaceAll('}',']')
      node[key] = eval(text);
    }
    else{
      node[key] = parseXMLKeyValueDict(node.children[i+1]);
    }
  }
  return node;
}

function parseAvatarClipData(xml){
  let root = xml.children[0].children[0];
  CharacterAvatarClip = parseXMLKeyValueDict(root);
  __CntDataLoaded += 1;
}

function parseCharacterData(res){
  for(let i in res){
    let dat = res[i];
    CharacterData[dat['Id']] = dat;
  }
  __CntDataLoaded += 1;
}

function parseIconClipData(res){
  IconClipData = res;
  __CntDataLoaded += 1;
}

(function(){
  var image = new Image(), image2 = new Image();
  image.crossOrigin = "anonymous";
  image.src = "https://assets.mist-train-girls.com/production-client-web-assets/Textures/Icons/Atlas/Layers/character-1.png";
  image.onload = () => {
    CharacterAvatarSet = image;
    __CntDataLoaded += 1;
  };
  image2.src = "/static/assets/icons_party1.png";
  image2.onload = () => {
    CharacterFrameSet = image2;
    __CntDataLoaded += 1;
  };
  $.ajax({
    url: "https://assets.mist-train-girls.com/production-client-web-assets/Textures/Icons/Atlas/Layers/character-1.plist",
    success: (res) => { parseAvatarClipData(res); },
    error: (res) => {
      if(res.status == 403){
        alert(Vocab['UnderMaintenance']);
      }
      else{
        alert(Vocab['UnknownError']);
      }
    }
  });
  $.ajax({
    url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MCharacterViewModel.json",
    success: (res) => { parseCharacterData(res); },
    error: (res) => {
      if(res.status == 403){
        alert(Vocab['UnderMaintenance']);
      }
      else{
        alert(Vocab['UnknownError']);
      }
    }
  });
  $.ajax({
    url: "/static/json/iconinfo.json",
    success: (res) => { parseIconClipData(res); },
    error: (res) => {
      if(res.status == 503){
        alert(Vocab['UnderMaintenance']);
      }
      else{
        alert(Vocab['UnknownError']);
      }
    }
  });
  window.addEventListener("load", init);
})()