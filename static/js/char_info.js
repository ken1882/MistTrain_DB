let CharacterAvatarSet = null;
let CharacterFrameSet  = null;
let CharacterAvatarClip = {};
let IconClipData  = {};
let CharacterData = {};
let MaxGearStatusData = {};
let SkillData = {};
let __CntDataLoaded   = 0;
let __CntDataRequired = 7;
var AvatarCanvas, AvatarContext;
var FrameCanvas, FrameContext;
let AvatarFramePadding = 4;

const WeaponAttribute = [0, 2, 1, 1, 3, 2, 1, 3, 2, 3];
const SkillPowerRank = [
  '-', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'US'
]
const TypeSkillDistance = [
  'none',
  'close',
  'medium',
  'long'
];
const TypeSkillTarget = [
  'none',
  'enemy',
  'ally',
  'self'
];
const TypeSkillRange = [
  'none',
  'one',
  'all',
  'random',
  'row',
  'col',
];

function clipImage(canvas, image, target, cx, cy, cw, ch, dx=null, dy=null, dw=null, dh=null){
  if(dx == null){ dx = 0; }
  if(dy == null){ dy = 0; }
  if(dw == null){ dw = cw; }
  if(dh == null){ dh = ch; }
  var context = canvas.getContext('2d');
  context.drawImage(image, cx, cy, cw, ch, dx, dy, dw, dh);
  target.src = canvas.toDataURL();
}

function init(){
  AvatarCanvas  = document.createElement("canvas");
  AvatarCanvas.width = __CharacterAvatarWidth;
  AvatarCanvas.height = __CharacterAvatarHeight;
  AvatarContext = AvatarCanvas.getContext('2d');
  AvatarContext.webkitImageSmoothingEnabled = false;
  AvatarContext.mozImageSmoothingEnabled = false;
  AvatarContext.imageSmoothingEnabled = false;
  FrameCanvas = document.createElement("canvas");
  FrameCanvas.width = __CharacterFrameWidth;
  FrameCanvas.height = __CharacterFrameHeight;
  FrameContext = FrameCanvas.getContext('2d');
  setup();
}

function setup(){
  if(__CntDataLoaded < __CntDataRequired || !DataManager.isReady()){
    return setTimeout(setup, 100);
  }
  $("#loop-battler-anim").prop('checked', 1);
  fillCharacterBaseInfo();
  fillCharacterSkillInfo();
  appendCharacterAvatars();
  loadSpineData();
  setupSpineContent();
}

function loadSpineData(){
  var rssdat  = getBattlerSpineResourcesData(__CharacterId);
  var rssdat2 = getEventActorSpineResourcesData(__CharacterId);
  loadBattlerSpineResources(rssdat);
  loadCharacterSpineResources(rssdat2);
}

function setupSpineContent(){
  if(!__FlagBattlerCanvasReady || !__FlagCharacterCanvasReady){
    return setTimeout(setupSpineContent, 300);
  }
  appendAnimations();
  document.getElementById("char-zoomin").addEventListener('click', (e)=>{
    var n = CharacterSkeletonShrinkRate - 0.1;
    CharacterSkeletonShrinkRate = Math.max(1.0, n);
    resizeCharacterCanvas();
  });
  document.getElementById("char-zoomout").addEventListener('click', (e)=>{
    var n = CharacterSkeletonShrinkRate + 0.1;
    CharacterSkeletonShrinkRate = Math.min(2.0, n);
    resizeCharacterCanvas();
  });
  document.getElementById("char-zooms").style.display = '';
}

function appendAnimations(){
  var ch_anims = CharacterAnimState.data.skeletonData.animations;
  var ba_anims = BattlerAnimState.data.skeletonData.animations;
  let list_cha = $("#char-act-list");
  for(let i in ch_anims){
    let anim = ch_anims[i];
    let name = Vocab.CharacterAnimationName[anim.name];
    if(!name){ name = anim.name; }
    let opt = document.createElement("option");
    $(opt).attr('value', anim.name);
    if(anim.name == DefaultCharacterAnimation){$(opt).attr('selected','')}
    opt.innerText = name;
    list_cha.append(opt);
  }
  let list_baa = $("#battler-act-list");
  for(let i in ba_anims){
    let anim = ba_anims[i];
    let name = Vocab.CharacterAnimationName[anim.name];
    if(!name){ 
      name = anim.name;
      var reg = name.match(/Skill(\d+)_After/);
      if(reg){ name = `${Vocab.CharacterAnimationName['Skill_After']} ${reg[1]}`; }
      reg = name.match(/Skill(\d+)_Before/);
      if(reg){ name = `${Vocab.CharacterAnimationName['Skill_Before']} ${reg[1]}`; }
    }
    let opt = document.createElement("option");
    $(opt).attr('value', anim.name);
    if(anim.name == DefaultBattlerAnimation){$(opt).attr('selected','')}
    opt.innerText = name;
    list_baa.append(opt);
  }
  list_cha.on('change', (e)=>{
    CharacterAnimState.setAnimation(0, e.target.value, true);
  });
  list_baa.on('change', (e)=>{
    BattlerAnimState.setAnimation(0, e.target.value, $("#loop-battler-anim").prop('checked'));
  });
}

function fillCharacterBaseInfo(){
  if(!DataManager.isReady()){
    return setTimeout(fillCharacterBaseInfo, 100);
  }
  let data = CharacterData[__CharacterId];
  let chname = Vocab.CharacterName[__CharacterId];
  if(!chname){
    chname = `${data.Name} ${data.MCharacterBase.Name}`
  }
  let wtype = data.MCharacterBase.WeaponEquipType;
  $("#character-title").text(chname);
  $("#character-rarity").text(Vocab.RarityList[data.CharacterRarity]);
  $("#character-type").text(Vocab.CharacterTypeList[data.CharacterType]);
  $("#character-weapon").text(Vocab.WeaponTypeList[wtype]);
  let stats = [];
  for(let stat in data.StatusInflation){
    if(!data.StatusInflation.hasOwnProperty(stat)){continue;}
    let n = data.StatusInflation[stat];
    if(n > 1){ stats.push(Vocab.StatusName[stat]); }
  }
  $("#character-growth").text(stats.join('/'));

  let atkattrs = new Set();
  atkattrs.add(Vocab.AttributeList[WeaponAttribute[wtype]]);
  for(attr in data){
    if(!data.hasOwnProperty(attr)){continue;}
    if(!attr.match(/^MSkill(\d+)Id$/i)){ continue; }
    let skill = SkillData[data[attr]];
    var a1 = skill.Power1Attribute, a2 = skill.Power2Attribute;
    if(a1){
      atkattrs.add(Vocab.AttributeList[a1]);
    }
    if(a2){
      atkattrs.add(Vocab.AttributeList[a2]);
    }
  }
  atkattrs = Array.from(atkattrs);
  $("#character-atkattr").text(atkattrs.join('/'));

  let intro = Vocab.CharacterIntro[data.Id];
  if(!intro){ intro = data.Greeting; }
  intro = intro.replaceAll('\\n', '<br>');
  $("#character-intro").html(intro);

  let resists = CharacterData[__CharacterId].AttributeResistGroup;
  for(let a in resists){
    if(!resists.hasOwnProperty(a)){ continue; }
    let node = $(document.createElement("td"));
    $("#row-attr-resist").append(node);
    node.text(`${resists[a]}%`);
    if(resists[a] > 0){
      node.css('color', 'orange');
    }
    else if(resists[a] < 0){
      node.css('color', 'red');
    }
  }

  let attr_names = [];
  let head_attrs = [];
  for(let i in Vocab.StatusName){
    if(!Vocab.StatusName.hasOwnProperty(i)){ continue; }
    attr_names.push(Vocab.StatusName[i]);
    head_attrs.push(i);
  }
  for(let i=1;i<attr_names.length;++i){
    $(`#th-status-${i}`).text(attr_names[i]);
    let attr = head_attrs[i];
    let base = 100;
    let minn = base, maxn = base;
    try{
      minn += data.LevelStatus[`Min${attr}`] / 100;
      maxn += data.LevelStatus[`Max${attr}`] / 100;
      maxn += MaxGearStatusData[__CharacterId][attr] / 100;
      $(`#td-status-${i}`).text(`${minn}% / ${maxn}%`);
    }
    catch(_){
      $(`#td-status-${i}`).text(`-`);
    }
  }
}

function fillCharacterSkillInfo(){
  if(!DataManager.isReady()){
    return setTimeout(fillCharacterSkillInfo, 300);
  }
  let data = CharacterData[__CharacterId];
  let askills = [data.MSkill1Id, data.MSkill2Id, data.MSkill3Id, data.SpecialMSkillId];
  let pskills = [data.AbilityMSkill1Id, data.AbilityMSkill2Id, data.AbilityMSkill3Id];
  for(let i in askills){
    if(!SkillData.hasOwnProperty(askills[i])){ continue; }
    let skill = SkillData[askills[i]];
    let node    = document.createElement('tr');
    let sname   = document.createElement('td');
    let scost   = document.createElement('td');
    let spower  = document.createElement('td');
    let sattr   = document.createElement('td');
    let sscope  = document.createElement('td');
    let seffect = document.createElement('td');
    if(i == 3){ // special skill
      $(sname).addClass('special-skill');
      $(spower).addClass('special-skill');
      $(sattr).addClass('special-skill');
      $(sscope).addClass('special-skill');
      $(seffect).addClass('special-skill');
      $(scost).addClass('special-skill');
    }
    if(Vocab.SkillName.hasOwnProperty(skill.Id)){
      $(sname).text(Vocab.SkillName[skill.Id]);
    }
    else{
      $(sname).text(skill.Name);
    }
    let cost = '';
    if(skill.SPCost){
      cost += `SP ${skill.SPCost} `;
    }
    if(skill.RPCost){
      cost += `RP ${skill.RPCost} `;
    }
    if(!cost){ cost = '-'; }
    $(scost).text(cost);
    $(spower).text(SkillPowerRank[skill.SkillPowerRank]);
    let atkattrs = new Set();
    var a1 = skill.Power1Attribute, a2 = skill.Power2Attribute;
    if(a1){
      atkattrs.add(Vocab.AttributeList[a1]);
    }
    if(a2){
      atkattrs.add(Vocab.AttributeList[a2]);
    }
    atkattrs = Array.from(atkattrs);
    $(sattr).text(atkattrs.join('/'));
    let scope = '';
    if(skill.TargetDistance){
      scope = `${Vocab.SkillDistance[skill.TargetDistance]}, `;
    }
    scope += `${Vocab.SkillScope[skill.EffectTargetRange]} `;
    scope += `${Vocab.SkillTarget[skill.TargetTypes]} `;
    $(sscope).text(scope);
    if(Vocab.SkillEffect.hasOwnProperty(skill.Id)){
      $(seffect).text(Vocab.SkillEffect[skill.Id]);
    }
    else{
      $(seffect).text(skill.Description);
    }
    $(node).append(sname);
    $(node).append(scost);
    $(node).append(spower);
    $(node).append(sattr);
    $(node).append(sscope);
    $(node).append(seffect);
    $("#tbody-active-skill").append(node);
  }
  for(let i in pskills){
    let skill = SkillData[pskills[i]];
    let node    = document.createElement('tr');
    let sname   = document.createElement('td');
    let seffect = document.createElement('td');
    if(Vocab.SkillName.hasOwnProperty(skill.Id)){
      $(sname).text(Vocab.SkillName[skill.Id]);
    }
    else{
      $(sname).text(skill.Name);
    }
    if(Vocab.SkillEffect.hasOwnProperty(skill.Id)){
      $(seffect).text(Vocab.SkillEffect[skill.Id]);
    }
    else{
      $(seffect).text(skill.Description);
    }
    $(node).append(sname);
    $(node).append(seffect);
    $("#tbody-passive-skill").append(node);
  }
}

function appendCharacterAvatars(){
  let parent = $('#character-icon');
  i = __CharacterId;
  let container = $(document.createElement('div'));
  container.attr('class', 'avatar-container');
  let block = $(document.createElement('a'))
  container.append(block);
  let img = document.createElement('img');
  let img2 = document.createElement('img');
  $(img).attr('class', 'avatar');
  $(img2).attr('class', 'avatar-frame');
  block.append(img);
  block.append(img2);
  parent.append(container);
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

function parseSkillData(res){
  for(let i in res){
    let dat = res[i];
    SkillData[dat['Id']] = dat;
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
    url: "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MSkillViewModel.json",
    success: (res) => { parseSkillData(res); },
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