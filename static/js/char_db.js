let CharacterAvatarNode = {};
let FlagSkinViewActivate = false;
let FlagBedroomViewActivate = false;
const DefaultViewSetting = 'list';

function initCharDB(){
  if(!DataManager.isReady()){
    return setTimeout(initCharDB, 100);
  }
  AssetsManager.loadCharacterAssets();
  setup();
  loadPreferredDisplay();
  if(DataManager.playerProfile && getMTGServer()){
    fetchCharacters();
  }
}

function loadPreferredDisplay(){
  if(!AssetsManager.isReady()){
    return setTimeout(loadPreferredDisplay, 100);
  }
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
  updateViewableCharacters();
}

function setup(){
  if(!AssetsManager.isReady()){
    return setTimeout(setup, 100);
  }
  AssetsManager.setupCharacterSkin();
  appendCharacterAvatars();
  appendCharacterList();
  setupViewChangeButton();
  setupTableUtils();
  $("#loading-indicator").remove();
  if(document.cookie.includes('44Of44K544OI44OI44Os44Kk44Oz44Ks44O844Or44K6772e6Zyn44Gu5LiW55WM44Gu6LuK56qT44GL44KJ772eIFgg')){
    $('#bedroom-button').css('display', '');
    $('#bedroom-button').attr('disabled', null);
  }
  $("#ckb-unowned").on('change', ()=>{updateViewableCharacters();});
}

function updateViewableCharacters(){
  let flag = $('#ckb-unowned').prop('checked');
  let chars = DataManager.dataCharacters;
  for(let id in CharacterAvatarNode){
    if(flag){
      var owned = chars.some(o => o.MCharacterId == id);
      if(!owned){
        $(CharacterAvatarNode[id]).css('opacity', '0.3');
        CharacterAvatarNode[id].ori_opacity = '0.3';
      }
    }
    else{
      $(CharacterAvatarNode[id]).css('opacity', '1.0');
      CharacterAvatarNode[id].ori_opacity = '1.0';
    }
  }
}

function setupTableUtils(){
  let params = {
    height: window.innerHeight*0.8,
    sortReset: true,
    search: true,
    searchOnEnterKey: true,
    columns: [
      {sortable: false},  // avatar
      { // name
        sortable: true,
        sorter: (a, b) => {
          const na = a.split(']')[1] || a;
          const nb = b.split(']')[1] || b;
          return na.localeCompare(nb);
        }
      },
      {sortable: true},   // weapon
      {sortable: true},   // physical attack
      {sortable: true},   // physical defense
      {sortable: true},   // speed
      {sortable: true},   // hit rate
      {sortable: true},   // magical attack
      {sortable: true},   // magical defense
      {sortable: true},   // recovery
      {sortable: true},   // luck
    ],
    onAll: (e)=>{
      if(e == 'post-body.bs.table'){
        if($("#loading-indicator")[0]){ return ;}
        setTimeout(reloadAvatars(), 100);
      }
      relocateTableHeader();
    },
    customSearch: (data, text) => {
      let fragments = text.split(' ');
      let fields = [
          'fname', 'fweapon'
      ];
      return data.filter(function (row) {
          return fragments.every((keyword) => {
              keyword = keyword.toLocaleLowerCase();
              return fields.some((field) => {
                  return row[field].toLocaleLowerCase().indexOf(keyword) >= 0;
              })
          });
      })
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
    inner_container.attr('target', '_blank');
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
      chname = `${data.Name}<br>${data.MCharacterBase.Name}`
    }
    $(cells[0]).attr('id', `list-avatar-${id}`);
    $(cells[1]).html(chname);
    let wtype = data.WeaponEquipType;
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
        minn  = (minn + 0.005).toFixed(2);
        maxn  = (maxn + 0.005).toFixed(2);
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
  let vskin = $("#skinview-button");
  let vlove = $("#bedroom-button");
  vgrid[0].addEventListener('click', viewChangeGrid);
  vlist[0].addEventListener('click', viewChangeList);
  vskin[0].addEventListener('click', ()=>{ viewChangeSkin(); });
  vlove[0].addEventListener('click', viewChangeBedroom);
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
  console.log('viewChangeGrid');
  for(let id in CharacterAvatarNode){
    let node = $(CharacterAvatarNode[id]);
    if(node.css('display') == 'none'){
      node.css('display', 'block');
      node.css('opacity', '0.3');
      CharacterAvatarNode[id].ori_opacity = '0.3';
    }
    else{
      CharacterAvatarNode[id].ori_opacity = '1.0';
    }
    node.appendTo(`#grid-avatar-${id}`);
  }
  $("#skinview-button").removeAttr('disabled');
}

function viewChangeList(e){
  $("#skinview-button").attr('disabled', '');
  viewChangeSkin(false);
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

function viewChangeSkin(active){
  let vskin = $("#skinview-button");
  if(active == null){
    FlagSkinViewActivate ^= true;
  }
  else{
    FlagSkinViewActivate = !!active;
  }
  vskin.removeClass(FlagSkinViewActivate ? 'btn-outline-secondary' : 'btn-secondary');
  vskin.addClass(FlagSkinViewActivate ? 'btn-secondary' : 'btn-outline-secondary');
  for(let id in CharacterAvatarNode){
    let node = CharacterAvatarNode[id];
    if(!AssetsManager.DressedCharacterMap.hasOwnProperty(id)){
      node.css('opacity', FlagSkinViewActivate ? '0.3' : CharacterAvatarNode[id].ori_opacity);
    }
  }
}

function viewChangeBedroom(){
  let vlove = $("#bedroom-button");
  FlagBedroomViewActivate ^= true;
  vlove.removeClass(FlagBedroomViewActivate ? 'btn-outline-secondary' : 'btn-secondary');
  vlove.addClass(FlagBedroomViewActivate ? 'btn-secondary' : 'btn-outline-secondary');
  for(let i in CharacterAvatarNode){
    if(!CharacterAvatarNode.hasOwnProperty(i)){ continue; }
    var link = CharacterAvatarNode[i].attr('href');
    if(FlagBedroomViewActivate){
      CharacterAvatarNode[i].attr('href', link+'/bedroom');
    }
    else{
      CharacterAvatarNode[i].attr('href', link.split('/').slice(0, 3).join('/'));
    }
  }
}

function reloadAvatars(){
  console.log("Reload avatars");
  let tmp = $('body');
  let cnt = 0;
  for(let id in CharacterAvatarNode){
    let node = CharacterAvatarNode[id];
    node.css('display', 'none');
    node.css('opacity', '1.0');
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
  updateViewableCharacters();
}

function updateHitCount(){
  let chars = DataManager.dataCharacters;
  let hit = 0, len = 0, own = 0;
  for(let id in CharacterAvatarNode){
    len += 1;
    if(CharacterAvatarNode[id].css('display') != 'none'){ hit += 1; }
    if(chars.some(o => o.MCharacterId == id)){
      own += 1;
    }
  }
  $('#hit-count').text(`(HIT: ${hit}/${len})`);
  $('#own-count').text(`(OWN: ${own}/${len})`);
}

(function(){
  window.addEventListener("load", initCharDB);
})();