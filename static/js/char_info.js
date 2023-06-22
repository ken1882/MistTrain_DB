var FrameCanvas, FrameContext;
let AvatarFramePadding = 4;
let LinkSkillDescSwap = {};
let AnimationChunks = [];
let AnimationStream = null;
let AnimationRecorder = null;
let PlayFullSkillAnimation = true;

const SKILL_SRC_NONE = 0;
const SKILL_SRC_TB   = 1;
const SKILL_SRC_LB   = 2;

const EFF_CHANGE_SKILL = 100;
const WEAPON_ATTRIBUTE = [0, 2, 1, 1, 3, 2, 1, 3, 2, 3];
const SKILL_POWER_RANK = [
  '-', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'US'
];
const TYPE_SKILL_DISTANCE = [
  'none',
  'close',
  'medium',
  'long'
];
const TYPE_SKILL_TARGET = [
  'none',
  'enemy',
  'ally',
  'self'
];
const TYPE_SKILL_RANGE = [
  'none',
  'one',
  'all',
  'random',
  'row',
  'col',
];
const TRAINBOARD_COLOR = 'DeepPink';
const ICON_SVG_SWAP = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
  <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
</svg>
`;
const ICON_SVG_LINK = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16" 
  style="border: dashed 2px; padding: 2px;"
  >
  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
</svg>
`;

function initCharInfo(){
  AssetsManager.loadCharacterAssets();
  setup();
}

function setup(){
  if(!AssetsManager.isReady() || !DataManager.isReady()){
    return setTimeout(setup, 100);
  }
  AssetsManager.setupCharacterSkin();
  $("#loop-battler-anim").prop('checked', 1);
  fillCharacterBaseInfo();
  fillCharacterSkillInfo();
  appendCharacterAvatars();
  loadSpineData();
  setupSpineContent();
  loadCharacterVoices();
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
  loadCharacterAnimations();
  loadBattlerAnimations();
  loadBattlerSkins();
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
  $("#inp-bacanvas-ratio").prop('value', (BattlerCanvas.height / BattlerCanvas.width).toFixed(2));
  $("#inp-bacanvas-ratio").trigger('change');
  $("#inp-battler-zoom").prop('value', BattlerSkeletonShrinkFactor-BattlerSkeletonShrinkRate);
  $("#inp-battler-zoom").prop('defaultValue', BattlerSkeletonShrinkFactor-BattlerSkeletonShrinkRate);
  $("#battler-utils").show();
}

function loadCharacterAnimations(){
  var ch_anims = CharacterAnimState.data.skeletonData.animations;
  let list_cha = $("#char-act-list");
  list_cha.children().remove();
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
  
  list_cha.on('change', (e)=>{
    CharacterAnimState.setAnimation(0, e.target.value, true);
  });

}

function loadBattlerAnimations(){
  var ba_anims = BattlerAnimState.data.skeletonData.animations;
  let list_baa = $("#battler-act-list");
  list_baa.children().remove();
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

  list_baa.on('change', (e)=>{
    BattlerAnimState.setAnimation(0, e.target.value, $("#ckb-loop-battler-anim").prop('checked'));
  });
  BattlerAnimState.addListener({
    complete: (state)=>{
      if(!PlayFullSkillAnimation){ return; }
      var reg = state.animation.name.match(/Skill(\d+)_After/);
      var reg2 = state.animation.name.match(/Skill(\d+)_Before/);
      if(!reg && !reg2){ return;}
      var name = `SkillN_BeforeAfter`;
      var node = document.getElementById('battler-act-list');
      if(reg && $("#ckb-loop-battler-anim").prop('checked')){
        name = `Skill${reg[1]}_Before`;
      }
      if(reg2){
        name = `Skill${reg2[1]}_After`;
      }
      for(let i=0;i<node.children.length;++i){
        var ele = node.children[i];
        if(ele.value == name){
          node.value = ele.value;
          BattlerAnimState.setAnimation(0, name, false);
        }
      }
    }
  });
  $("#btn-export-anim").prop('disabled', false);
}

function loadBattlerSkins(){
  let list_skin = $("#battler-skin-list");
  let chdat = AssetsManager.CharacterData[__CharacterId];
  let mbchid = chdat.MCharacterBase.Id;
  let opt = appendCharacterSkinOption(list_skin, 0, Vocab.CharacterSkinName[0]);
  $(opt).attr('selected', '');
  if(AssetsManager.DressedCharacterMap.hasOwnProperty(__CharacterId)){
    for(let skin_id of AssetsManager.DressedCharacterMap[__CharacterId]){
      let dat = AssetsManager.CharacterSkinData[mbchid][skin_id];
      appendCharacterSkinOption(list_skin, skin_id, dat.Name);
    }
  }
  list_skin.on('change', (e) => {
    ChangeBattlerSkin(parseInt(e.target.value));
  });
}

function appendCharacterSkinOption(parent_list, id, name){
  let opt = document.createElement("option");
  $(opt).attr('value', id);
  opt.innerText = name;
  parent_list.append(opt);
  return opt;
}

function loadCharacterVoices(){
  let list = $("#voice-list");
  let voices = AssetsManager.getCharacterVoiceSet(__CharacterId);
  for(let i in voices){
    if(!voices.hasOwnProperty(i)){ continue; }
    if(i == 'SpecialSkill' && 
       AssetsManager.CharacterData[__CharacterId].CharacterRarity < 4
      )
    {
      continue;
    }
    var opt = document.createElement("option");
    var key = i.split('_');
    var name = Vocab.CharacterVoiceName[key[0]];
    if(key[1]){ name += ' ' + key[1]}
    $(opt).attr('value', i);
    opt.innerText = name;
    list.append(opt);
  }
  list.on('change', (e)=>{
    var player = $("#voice-player");
    player.attr('src', voices[e.target.value]);
    if($("#ckb_voiceautoplay").prop('checked')){
      player[0].play();
    }
  });
}

function getCharacterLevelStatus(lv){
  return AssetsManager.CharacterLevelData[__CharacterId][lv].Status;
}

function fillCharacterBaseInfo(){
  if(!DataManager.isReady()){
    return setTimeout(fillCharacterBaseInfo, 100);
  }
  let data = AssetsManager.CharacterData[__CharacterId];
  let chname = Vocab.CharacterName[__CharacterId];
  if(!chname){
    chname = `${data.Name} ${data.MCharacterBase.Name}`;
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
  atkattrs.add(Vocab.AttributeList[WEAPON_ATTRIBUTE[wtype]]);
  for(attr in data){
    if(!data.hasOwnProperty(attr)){continue;}
    if(!attr.match(/^MSkill(\d+)Id$/i)){ continue; }
    let skill = AssetsManager.SkillData[data[attr]];
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

  let resists = AssetsManager.CharacterData[__CharacterId].AttributeResistGroup;
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
  let tb_attrs   = {};
  for(let i in Vocab.StatusName){
    if(!Vocab.StatusName.hasOwnProperty(i)){ continue; }
    attr_names.push(Vocab.StatusName[i]);
    head_attrs.push(i);
  }
  // Trainboard extra status
  if(AssetsManager.TrainBoardData.hasOwnProperty(__CharacterId)){
    let tboards = AssetsManager.TrainBoardData[__CharacterId].TrainBoardOarders;
    let tbs = tboards[tboards.length-1].MTrainBoardDetails;
    let tbindex = tbs[tbs.length-1];
    for(let attr of head_attrs){
      try{
        tb_attrs[attr] = tbindex.TrainBoardOrderAndDetailStatus[attr];
      }
      catch(_){ }
    }
  }
  let limit_break_stat = null;
  $('#status-title').text(Vocab['InitMax']);
  if(data.CharacterRarity == 4){
    limit_break_stat = getCharacterLevelStatus(100);
    $('#status-title').text(Vocab['InitMaxLB']);
  }
  for(let i=1;i<attr_names.length;++i){
    $(`#th-status-${i}`).text(attr_names[i]);
    let attr = head_attrs[i];
    let base = 100;
    let minn = base, maxn = base, extn = 0, extn2 = 0;
    let lmbn = base;
    try{
      minn += data.LevelStatus[`Min${attr}`] / 100;
      maxn += data.LevelStatus[`Max${attr}`] / 100;
      maxn += AssetsManager.MaxGearStatusData[__CharacterId][attr] / 100;
      minn  = (minn + 0.000).toFixed(2);
      maxn  = (maxn + 0.000).toFixed(2);
      let _html = `${minn}% / ${maxn}%`;
      if(limit_break_stat){
        lmbn += limit_break_stat[attr] / 100 + AssetsManager.MaxGearStatusData[__CharacterId][attr] / 100;
        lmbn  = (lmbn + 0.000).toFixed(2);
        _html += ` / ${lmbn}%`;
      }
      if(tb_attrs[attr]){
        extn = parseFloat(maxn) + tb_attrs[attr] / 100;
        extn = (extn + 0.005).toFixed(2);
        _html += `<span class="trainboard-skill"> → ${extn}%`;
        if(limit_break_stat){
          extn2 = parseFloat(lmbn) + tb_attrs[attr] / 100;
          extn2 = (extn2 + 0.005).toFixed(2);
          _html += ` / ${extn2}%`;
        }
        _html += `</span>`;
      }
      $(`#td-status-${i}`).html(_html);
    }
    catch(_){
      $(`#td-status-${i}`).html(`-`);
    }
  }

  if(AssetsManager.TrainBoardData.hasOwnProperty(__CharacterId)){
    for(node of $('span')){
      if(!node.attributes.label || node.attributes.label.value != 'l-InitMax'){
        continue;
      }
      let _html = node.innerHTML;
      _html = _html.substr(0, _html.length-1);
      _html += `<span class="trainboard-skill"> → ${Vocab['TrainboardCorrection']}</span>)`;
      node.innerHTML = _html;
    }
  }
}

function getLinkedChangeSkillId(skill_id){
  if(!AssetsManager.LinkSkillData.hasOwnProperty(skill_id)){ return ;}
  let lskill_req = AssetsManager.LinkSkillData[skill_id];
  let ach_skill = AssetsManager.SkillData[lskill_req.ActivateMSkillId];
  let ret = null;
  for(let i in ach_skill.MSkillEffects){
    let eff = ach_skill.MSkillEffects[i];
    if(eff.EffectDetail == EFF_CHANGE_SKILL){
      ret = eff.NextMSkillId;
      break;
    }
  }
  return ret;
}

function getAllSkills(character_data){
  let data = character_data;
  let askills = [data.MSkill1Id, data.MSkill2Id, data.MSkill3Id, data.SpecialMSkillId];
  if(AssetsManager.TrainBoardData.hasOwnProperty(__CharacterId)){
    let train_boards = AssetsManager.TrainBoardData[__CharacterId].TrainBoardOarders;
    for(let board of train_boards){
      for(let entry of board.MTrainBoardDetails){
        if(entry.TrainBoardDetailAdditionalSkill){
          askills.push(entry.TrainBoardDetailAdditionalSkill.AdditionalMSkillId);
        }
      }
    }
  }
  return askills;
}

function getAllAbilities(character_data){
  let data = character_data;
  let pskills = [
    [SKILL_SRC_NONE, data.AbilityMSkill1Id],
    [SKILL_SRC_NONE, data.AbilityMSkill2Id],
    [SKILL_SRC_NONE, data.AbilityMSkill3Id],
  ];
  if(AssetsManager.TrainBoardData.hasOwnProperty(__CharacterId)){
    let train_boards = AssetsManager.TrainBoardData[__CharacterId].TrainBoardOarders;
    for(let board of train_boards){
      for(let entry of board.MTrainBoardDetails){
        if(entry.TrainBoardDetailAdditionalAbility){
          pskills.push(
            [
              SKILL_SRC_TB,
              entry.TrainBoardDetailAdditionalAbility.AdditionalMAbilityId ||
              entry.TrainBoardDetailAdditionalAbility.AdditionalMSkillId
            ]
          );
        }
      }
    }
  }
  if(data.ExtraAbilityMSkill1Id){
    pskills.push(
      [SKILL_SRC_LB, data.ExtraAbilityMSkill1Id]
    );
  }
  if(data.ExtraAbilityMSkill2Id){
    pskills.push(
      [SKILL_SRC_LB, data.ExtraAbilityMSkill2Id]
    );
  }
  return pskills;
}

function fillCharacterSkillInfo(){
  if(!DataManager.isReady()){
    return setTimeout(fillCharacterSkillInfo, 300);
  }
  let data = AssetsManager.CharacterData[__CharacterId];
  let askills = getAllSkills(data);
  let pskills = getAllAbilities(data);
  
  for(let i in askills){
    if(!AssetsManager.SkillData.hasOwnProperty(askills[i])){ continue; }
    let skill = AssetsManager.SkillData[askills[i]];
    let node    = document.createElement('tr');
    let sname   = document.createElement('td');
    let scost   = document.createElement('td');
    let spower  = document.createElement('td');
    let sattr   = document.createElement('td');
    let sscope  = document.createElement('td');
    let seffect = document.createElement('td');
    let sid     = skill.Id;
    node.id    = `skill-node-${i}`;
    sname.id   = `skill-name-${i}`;
    scost.id   = `skill-cost-${i}`;
    spower.id  = `skill-power-${i}`;
    sattr.id   = `skill-attr-${i}`;
    sscope.id  = `skill-scope-${i}`;
    seffect.id = `skill-effect-${i}`;
    if(i == 3){
      $(node).addClass('special-skill');      
    }
    else if(i > 3){
      $(node).addClass('trainboard-skill');
    }
    $(node).append(sname);
    $(node).append(scost);
    $(node).append(spower);
    $(node).append(sattr);
    $(node).append(sscope);
    $(node).append(seffect);
    $("#tbody-active-skill").append(node);
    swapSkillDescription(i, sid);
  }
  for(let i in pskills){
    console.log(pskills)
    let src     = pskills[i][0];
    let skill   = AssetsManager.SkillData[pskills[i][1]];
    let node    = document.createElement('tr');
    let sname   = document.createElement('td');
    let seffect = document.createElement('td');
    let aid     = skill.Id;
    node.id     = `ability-node-${i}`;
    sname.id    = `ability-name-${i}`;
    seffect.id  = `ability-effect-${i}`;
    if(src == SKILL_SRC_TB){ $(node).addClass('trainboard-skill'); }
    else if(src == SKILL_SRC_LB){ $(node).addClass('special-skill'); }
    $(node).append(sname);
    $(node).append(seffect);
    $("#tbody-passive-skill").append(node);
    swapAbilityDescription(i, aid);
  }
  setupChangableSkills();
}

function swapSkillDescription(ori_sid, aft_sid){
  let node    = document.getElementById(`skill-node-${ori_sid}`);
  let sname   = document.getElementById(`skill-name-${ori_sid}`);
  let scost   = document.getElementById(`skill-cost-${ori_sid}`);
  let spower  = document.getElementById(`skill-power-${ori_sid}`);
  let sattr   = document.getElementById(`skill-attr-${ori_sid}`);
  let sscope  = document.getElementById(`skill-scope-${ori_sid}`);
  let seffect = document.getElementById(`skill-effect-${ori_sid}`);
  let skill = AssetsManager.SkillData[aft_sid];
  let sid = aft_sid;
  node.id    = `skill-node-${sid}`;
  sname.id   = `skill-name-${sid}`;
  scost.id   = `skill-cost-${sid}`;
  spower.id  = `skill-power-${sid}`;
  sattr.id   = `skill-attr-${sid}`;
  sscope.id  = `skill-scope-${sid}`;
  seffect.id = `skill-effect-${sid}`;
  sname.innerHTML = '';
  if(Vocab.SkillName.hasOwnProperty(sid)){
    $(sname).text(Vocab.SkillName[sid]);
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
  $(spower).text(SKILL_POWER_RANK[skill.SkillPowerRank]);
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
  if(Vocab.SkillEffect.hasOwnProperty(sid)){
    $(seffect).text(Vocab.SkillEffect[sid]);
  }
  else{
    $(seffect).text(skill.Description);
  }
  // Link skill
  if(AssetsManager.LinkSkillData.hasOwnProperty(sid)){
    let lskill_req = AssetsManager.LinkSkillData[sid];
    let lskill = AssetsManager.SkillData[lskill_req.ActivateMSkillId];
    let link_icon = document.createElement('span');
    link_icon.innerHTML = ICON_SVG_LINK;
    seffect.innerHTML = `
      ${seffect.innerHTML}
      <hr>
      <span class="link-skill">
        <span style="margin:auto;">${Vocab['LinkSkillCondition']}：</span><br>
        ${lskill_req.ConditionDescription}<hr>
        <span style="margin:auto;">${Vocab['LinkSkillEffect']}：</span><br>
        ${lskill.Description}
      </span>
    `;
    sname.appendChild(link_icon);
  }
}

function swapAbilityDescription(ori_aid, aft_aid){
  let ability = AssetsManager.SkillData[aft_aid];
  let node    = document.getElementById(`ability-node-${ori_aid}`);
  let sname   = document.getElementById(`ability-name-${ori_aid}`);
  let seffect = document.getElementById(`ability-effect-${ori_aid}`);
  if(Vocab.SkillName.hasOwnProperty(ability.Id)){
    $(sname).text(Vocab.SkillName[ability.Id]);
  }
  else{
    $(sname).text(ability.Name);
  }
  if(Vocab.SkillEffect.hasOwnProperty(ability.Id)){
    $(seffect).text(Vocab.SkillEffect[ability.Id]);
  }
  else{
    $(seffect).text(ability.Description);
  }
  node.id     = `ability-node-${aft_aid}`;
  sname.id    = `ability-name-${aft_aid}`;
  seffect.id  = `ability-effect-${aft_aid}`;
}

function setupChangableSkills(){
  let data = AssetsManager.CharacterData[__CharacterId];
  let askills = getAllSkills(data);
  
  // Change Skill
  // This assumes change skills are one to one, may be bugged in future
  for(let sid of askills){
    let csid = getLinkedChangeSkillId(sid);
    if(csid){
      let ori_sid = AssetsManager.ChangeSkillMirrorMap[csid];
      let swap_icon = document.createElement('span');
      $(`#skill-name-${ori_sid}`).attr('style', 'cursor:pointer;');
      swap_icon.innerHTML = ICON_SVG_SWAP;
      $(swap_icon).addClass('change-skill');
      $(`#skill-name-${ori_sid}`).append(swap_icon);
      $(`#skill-name-${ori_sid}`).on('click', (_)=>{
        swapSkillDescription(ori_sid, csid);
        $(`#skill-name-${csid}`).append(swap_icon);
        let node = $(`#skill-node-${csid}`);
        if(node.attr('class') == 'change-skill'){
          node.removeClass('change-skill');
        }
        else{
          node.addClass('change-skill');
        }
        if($(swap_icon).attr('class') == 'change-skill'){
          $(swap_icon).removeClass('change-skill');
          $(swap_icon).addClass('normal-skill');
        }
        else{
          $(swap_icon).addClass('change-skill');
          $(swap_icon).removeClass('normal-skill');
        }
        ori_sid ^= csid;
        csid ^= ori_sid;
        ori_sid ^= csid;
      });
    }
  }
  // Change skill/ability (of Trainboard)
  if(AssetsManager.TrainBoardData.hasOwnProperty(__CharacterId)){
    let train_boards = AssetsManager.TrainBoardData[__CharacterId].TrainBoardOarders;
    for(let board of train_boards){
      for(let entry of board.MTrainBoardDetails){
        if(entry.TrainBoardDetailChangeAbility){
          setTrainboardSwappableEntry(
            'ability', 
            entry.TrainBoardDetailChangeAbility.BeforeMSkillId,
            entry.TrainBoardDetailChangeAbility.AfterMSkillId,
            swapAbilityDescription
          )
        }
        if(entry.TrainBoardDetailChangeSkill){
          setTrainboardSwappableEntry(
            'skill', 
            entry.TrainBoardDetailChangeSkill.BeforeMSkillId,
            entry.TrainBoardDetailChangeSkill.AfterMSkillId,
            swapSkillDescription
          ) 
        }
      }
    }
  }
}

function setTrainboardSwappableEntry(node_prefix, ori_id, aft_id, swap_callback){
  let swap_icon = document.createElement('span');
  $(`#${node_prefix}-name-${ori_id}`).attr('style', 'cursor:pointer;');
  swap_icon.innerHTML = ICON_SVG_SWAP;
  $(swap_icon).addClass('trainboard-skill');
  $(`#${node_prefix}-name-${ori_id}`).append(swap_icon);
  $(`#${node_prefix}-name-${ori_id}`).on('click', (_)=>{
    swap_callback(ori_id, aft_id);
    $(`#${node_prefix}-name-${aft_id}`).append(swap_icon);
    let node = $(`#${node_prefix}-node-${aft_id}`);
    if(node.attr('class') == 'trainboard-skill'){
      node.removeClass('trainboard-skill');
      node.addClass(node.prop('ori-cls'));
    }
    else{
      node.prop('ori-cls', node.prop('class'));
      node.addClass('trainboard-skill');
      node.removeClass(node.prop('ori-cls'));
    }
    if($(swap_icon).attr('class') == 'trainboard-skill'){
      $(swap_icon).removeClass('trainboard-skill');
      $(swap_icon).addClass(node.prop('ori-cls'));
    }
    else{
      $(swap_icon).addClass('trainboard-skill');
      $(swap_icon).removeClass(node.prop('ori-cls'));
    }
    ori_id ^= aft_id;
    aft_id ^= ori_id;
    ori_id ^= aft_id;
  });
}

function appendCharacterAvatars(){
  let parent = $('#character-icon');
  let node = AssetsManager.createCharacterAvatarNode(__CharacterId);
  parent.append(node);
  let img = node.children();
  img.attr('target', '_blank');
  img.attr('href', AssetsManager.AvatarCanvas.toDataURL());
}

function prepareBattlerAnimRecord(){
	let actlist = $("#battler-act-list");
  let val = actlist.prop('value');
  var reg = val.match(/Skill(\d+)_(After|Before)/);
  if(PlayFullSkillAnimation && reg){
    val = `Skill${reg[1]}_Before`;
  }
	actlist.prop('value', '');
	actlist.one('change', (_)=>{
    AnimationRecorder = setupBattlerAnimRecord();
  });
  $("#btn-export-anim").prop('disabled', true);
  actlist.prop('disabled', true);
  actlist.prop('value', val);
  actlist.trigger('change');
}

function setupBattlerAnimRecord(){
  let chunks = [];
  let anim_stream = BattlerCanvas.captureStream();
	rec = new MediaRecorder(anim_stream);
	rec.ondataavailable = (e) => {
		chunks.push(e.data);
	};
  rec.onstop = (_)=>{
    exportBattlerAnimation( new Blob(chunks, {type: 'video/webm'}) );
  };
  
  let rec_start_proc = ()=>{
    if(BattlerAnimState.timeScale > 0){
      rec.start();
    }
    else{
      setTimeout(rec_start_proc, 100);
    }
  };

  let listner = {
    complete: (state)=>{
      var reg = state.animation.name.match(/Skill(\d+)_Before/);
      if(PlayFullSkillAnimation && reg){
        var name = `Skill${reg[1]}_After`;
        var node = document.getElementById('battler-act-list');
        for(let i=0;i<node.children.length;++i){
          var ele = node.children[i];
          if(ele.value == name){
            node.value = ele.value;
            BattlerAnimState.setAnimation(0, name, false);
          }
        }
      }
      else{
        rec.stop();
        BattlerAnimState.removeListener(listner);
      }
    }
  };
  BattlerAnimState.addListener(listner);
  
  rec_start_proc();
	return rec;
}

function exportBattlerAnimation(blob){
  let vid = document.createElement('video');
  vid.src = URL.createObjectURL(blob);
  vid.controls = true;
  document.body.appendChild(vid);
  const a = document.createElement('a');
  a.download = 'battler.webm';
  try{
    a.download = `${__CharacterId}_${BattlerAnimState.tracks[0].animation.name}.webm`
  }
  catch(_){}
  a.href = vid.src;
  a.textContent = Vocab['Download'];
  document.body.appendChild(a);
  $("#btn-export-anim").prop('disabled', false);
  $("#battler-act-list").prop('disabled', false);
  $('body,html').animate({
    scrollTop: Math.max(0, a.offsetTop - (window.innerHeight - a.offsetHeight)/2)
  }, 800);
}

let LastBattlerAnimTimeScale = 1;
function toggleBattlerAnimationPause(){
	if(BattlerAnimState.timeScale > 0){
		LastBattlerAnimTimeScale = BattlerAnimState.timeScale;
		BattlerAnimState.timeScale = 0; 
    if(AnimationRecorder && AnimationRecorder.state == 'recording'){
      AnimationRecorder.pause();
    }
		$("#inp-battler-timescale").prop('disabled', true);
		document.getElementById('battler-anim-pause').innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
				<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
				<path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
			</svg>
		`
	}
	else{
		BattlerAnimState.timeScale = LastBattlerAnimTimeScale;
    if(AnimationRecorder && AnimationRecorder.state == 'paused'){
      AnimationRecorder.resume();
    }
		$("#inp-battler-timescale").prop('disabled', false);
		document.getElementById('battler-anim-pause').innerHTML = `
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16">
				<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
				<path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z"/>
			</svg>
		`
	}
}

function prepareCharacterAnimRecord(){
	let actlist = $("#char-act-list");
  let val = actlist.prop('value');
	actlist.prop('value', '');
	actlist.one('change', (_)=>{
    AnimationRecorder = setupCharacterAnimRecord();
  });
  // TODO: character anim export
  // $("#btn-export-anim").prop('disabled', true);
  // actlist.prop('disabled', true);
  actlist.prop('value', val);
  actlist.trigger('change');
}

function setupCharacterAnimRecord(){
  let chunks = [];
  let anim_stream = CharacterCanvas.captureStream();
	rec = new MediaRecorder(anim_stream);
	rec.ondataavailable = (e) => {
		chunks.push(e.data);
	};
  rec.onstop = (_)=>{
    exportCharacterAnimation( new Blob(chunks, {type: 'video/webm'}) );
  };
  
  let rec_start_proc = ()=>{
    if(CharacterAnimState.timeScale > 0){
      rec.start();
    }
    else{
      setTimeout(rec_start_proc, 100);
    }
  };

  let listner = {
    complete: (state)=>{
      rec.stop();
      CharacterAnimState.removeListener(listner);
    }
  };
  CharacterAnimState.addListener(listner);
  
  rec_start_proc();
	return rec;
}

function exportCharacterAnimation(blob){
  let vid = document.createElement('video');
  vid.src = URL.createObjectURL(blob);
  vid.controls = true;
  document.body.appendChild(vid);
  const a = document.createElement('a');
  a.download = 'character.webm';
  try{
    a.download = `${__CharacterId}_${CharacterAnimState.tracks[0].animation.name}.webm`
  }
  catch(_){}
  a.href = vid.src;
  a.textContent = Vocab['Download'];
  document.body.appendChild(a);
  // $("#btn-export-anim").prop('disabled', false);
  // $("#battler-act-list").prop('disabled', false);
  $('body,html').animate({
    scrollTop: Math.max(0, a.offsetTop - (window.innerHeight - a.offsetHeight)/2)
  }, 800);
}

(function(){
  window.addEventListener("load", initCharInfo);
})();