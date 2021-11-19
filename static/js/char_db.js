let CharacterAvatarSet = null;
let CharacterFrameSet  = null;
let CharacterAvatarClip = {};
let IconClipData  = {};
let CharacterData = {};
let MaxGearStatusData = {};
let CharacterAvatarNode = {};
let __CntDataLoaded   = 0;
let __CntDataRequired = 6;
var AvatarCanvas, AvatarContext;
var FrameCanvas, FrameContext;
let AvatarFramePadding = 4;

const DefaultViewSetting = 'list';

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
  if(!DataManager.isReady()){
    return setTimeout(init, 100);
  }
  AvatarCanvas  = document.createElement("canvas");
  AvatarCanvas.width = __CharacterAvatarWidth;
  AvatarCanvas.height = __CharacterAvatarHeight;
  AvatarContext = AvatarCanvas.getContext('2d');
  FrameCanvas = document.createElement("canvas");
  FrameCanvas.width = __CharacterFrameWidth;
  FrameCanvas.height = __CharacterFrameHeight;
  FrameContext = FrameCanvas.getContext('2d');
  setup();
  loadPreferredDisplay();
}

function loadPreferredDisplay(){
  let dis = DataManager.getSetting('chdb-display');
  if(!dis){ dis = DefaultViewSetting; }
  if(dis == 'list'){
    $("#character-list").css('display', '');
    DataManager.changeSetting('chdb-display', 'list');
    viewChangeList();
  }
  if(dis == 'grid'){
    $("#character-grid").css('display', '');
    DataManager.changeSetting('chdb-display', 'grid');
    viewChangeGrid();
  }
}

function setup(){
  if(__CntDataLoaded < __CntDataRequired){
    return setTimeout(setup, 100);
  }
  appendCharacterAvatars();
  appendCharacterList();
  setupViewChangeButton();
  setupTableUtils();
  $("#loading-indicator").remove();
}

function setupTableUtils(){
  let params = {
    height: window.innerHeight*0.8,
    sortReset: true,
    search: true,
    columns: [
      {sortable: false},
      {sortable: false},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
      {sortable: true},
    ],
    onAll: (e)=>{
      if(e == 'post-body.bs.table'){
        if($("#loading-indicator")[0]){ return ;}
        setTimeout(reloadAvatars(), 100);
      }
      relocateTableHeader();
    }
  };
  
  for(let key in Vocab.BootstrapTable){
    if(!Vocab.BootstrapTable.hasOwnProperty(key)){ continue; }
    let name = Vocab.BootstrapTable[key];
    params[key] = ()=>{ return name; };
  }
  $("#character-table").bootstrapTable(params);
  
  localizeBootstrapTable($("#character-table"));
  $(".multi-sort")[0].children[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filter" viewBox="0 0 16 16"><path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>';
  $(".fixed-table-container").css('padding-bottom', '50px');
}

function relocateTableHeader(){
  let rect = $("#character-table")[0].getBoundingClientRect();
  $($(".fixed-table-header")[0].children[0]).css('margin-left', rect.x)
}

function appendCharacterAvatars(){
  let parent = $('#character-grid');
  for(let id in CharacterData){
    if(!CharacterData.hasOwnProperty(id)){continue;}
    let container = $(document.createElement('div'));
    container.attr('class', 'avatar-container');
    container.attr('id', `grid-avatar-${id}`);
    let inner_container = $(document.createElement('div'));
    inner_container.attr('class', 'avatar-container');
    container.append(inner_container);
    let block = $(document.createElement('a'))
    block.attr('href', `/character_database/${id}`);  
    block.attr('class', 'avatar-container');
    inner_container.append(block);
    let img = document.createElement('img');
    let img2 = document.createElement('img');
    $(img).attr('class', 'avatar');
    $(img2).attr('class', 'avatar-frame');
    block.append(img);
    block.append(img2);
    parent.append(container);
    CharacterAvatarNode[id] = inner_container;
    let rect = CharacterAvatarClip.frames[`${id}.png`].textureRect.flat();
    let krarity = 'frm_thumb_rare_a';
    switch(CharacterData[id].CharacterRarity){
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
}

function appendCharacterList(){
  let names = [];
  let head_attrs = [];
  for(let i in Vocab.StatusName){
    if(!Vocab.StatusName.hasOwnProperty(i)){ continue; }
    names.push(Vocab.StatusName[i]);
    head_attrs.push(i);
  }
  for(let i=1;i<names.length;++i){
    $(`#th-status-${i}`).text(names[i]);
  }
  let parent = $("#character-table");
  for(let id in CharacterData){
    if(!CharacterData.hasOwnProperty(id)){continue;}
    let data = CharacterData[id];
    let tr = document.createElement('tr');
    let cells = [];
    for(let i=0;i<3+8;++i){
      let node = document.createElement('td');
      cells.push(node);
      tr.append(node);
    }
    parent.append(tr);

    let chname = Vocab.CharacterName[id];
    if(!chname){
      chname = `${data.Name} ${data.MCharacterBase.Name}`
    }
    $(cells[0]).attr('id', `list-avatar-${id}`);
    $(cells[1]).text(chname);
    let wtype = data.MCharacterBase.WeaponEquipType;
    $(cells[2]).text(Vocab.WeaponTypeList[wtype]);
    for(let i=3;i<cells.length;++i){
      let attr = head_attrs[i-2];
      let base = 100;
      let minn = base, maxn = base;
      try{
        minn += data.LevelStatus[`Min${attr}`] / 100;
        maxn += data.LevelStatus[`Max${attr}`] / 100;
        maxn += MaxGearStatusData[id][attr] / 100;
        // $(cells[i]).text(`${minn} / ${maxn}`);
        $(cells[i]).text(`${maxn}`);
      }
      catch(_){
        $(cells[i]).text(`-`);
      }
    }
  }
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
  DataManager.changeSetting('chdb-display', 'grid');
  $('#character-grid').css('display', '');
  $('#character-list').css('display', 'none');
  for(let id in CharacterAvatarNode){
    $(CharacterAvatarNode[id]).appendTo(`#grid-avatar-${id}`);
  }
}

function viewChangeList(e){
  let vgrid = $("#gridview-button");
  let vlist = $("#listview-button");
  if(vlist[0].classList.contains('btn-secondary')){ return; }
  vgrid.removeClass('btn-secondary');
  vgrid.addClass('btn-outline-secondary')
  vlist.removeClass('btn-outline-secondary');
  vlist.addClass('btn-secondary');
  DataManager.changeSetting('chdb-display', 'list');
  $('#character-grid').css('display', 'none');
  $('#character-list').css('display', '');
  for(let id in CharacterAvatarNode){
    $(CharacterAvatarNode[id]).appendTo(`#list-avatar-${id}`);
  }
}

function reloadAvatars(){
  console.log("Reload avatars");
  let tmp = $('body');
  for(let id in CharacterAvatarNode){
    let node = CharacterAvatarNode[id];
    node.css('display', 'none');
    let pid = `${DataManager.getSetting('chdb-display')}-avatar-${id}`;
    node.appendTo(tmp);
    let target = $(`#${pid}`)[0];
    if(target){
      node.appendTo(target);
      node.css('display', '');
    }
  }
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

function parseGearData(res){
  for(let i=20;i<=res.length;i+=20){
    let dat = res[i-1];
    MaxGearStatusData[dat.MCharacterId] = dat.Status;
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
    url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/GearLevelsViewModel.json",
    success: (res) => { parseGearData(res); },
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