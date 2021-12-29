let CharacterAvatarNode = {};
const DefaultViewSetting = 'list';

function init(){
  if(!DataManager.isReady()){
    return setTimeout(init, 100);
  }
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
  updateHitCount();
}

function setup(){
  if(!AssetsManager.isReady()){
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
  $($(".fixed-table-header")[0].children[0]).css('margin-left', Math.max(0, rect.x))
}

function appendCharacterAvatars(){
  let parent = $('#character-grid');
  for(let id in AssetsManager.CharacterData){
    if(!AssetsManager.CharacterData.hasOwnProperty(id)){continue;}
    let container = $(document.createElement('div'));
    container.attr('class', 'avatar-container');
    container.attr('id', `grid-avatar-${id}`);
    let inner_container = $(document.createElement('a'));
    inner_container.append(AssetsManager.createCharacterAvatarNode(id));
    container.append(inner_container);
    inner_container.attr('href', `/character_database/${id}`);  
    CharacterAvatarNode[id] = inner_container;
    parent.append(container);
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
  for(let id in AssetsManager.CharacterData){
    if(!AssetsManager.CharacterData.hasOwnProperty(id)){continue;}
    let data = AssetsManager.CharacterData[id];
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
        maxn += AssetsManager.MaxGearStatusData[id][attr] / 100;
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
  let cnt = 0;
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
    if(!node.css('display') != 'none'){ cnt += 1;}
  }
  updateHitCount();
}

function updateHitCount(){
  let cnt = 0, len = 0;
  for(let id in CharacterAvatarNode){
    len += 1;
    if(CharacterAvatarNode[id].css('display') != 'none'){ cnt += 1; }
  }
  $('#hit-count').text(`(HIT: ${cnt}/${len})`);
}

(function(){
  AssetsManager.loadCharacterAssets();
  window.addEventListener("load", init);
})();