var AvatarCanvas, AvatarContext;
var FrameCanvas, FrameContext;
let AvatarFramePadding = 4;
let LinkSkillDescSwap = {};
let AnimationChunks = [];
let AnimationStream = null;
let AnimationRecorder = null;
let PlayFullSkillAnimation = true;

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

function init(){
  AssetsManager.loadCharacterAssets();
  setup();
}

function setup(){
  if(!AssetsManager.isReady() || !DataManager.isReady()){
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
  $("#inp-bacanvas-ratio").prop('value', (BattlerCanvas.height / BattlerCanvas.width).toFixed(2));
  $("#inp-bacanvas-ratio").trigger('change');
  $("#inp-battler-zoom").prop('value', BattlerSkeletonShrinkFactor-BattlerSkeletonShrinkRate);
  $("#inp-battler-zoom").prop('defaultValue', BattlerSkeletonShrinkFactor-BattlerSkeletonShrinkRate);
  $("#battler-utils").show();
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

function fillCharacterBaseInfo(){
  if(!DataManager.isReady()){
    return setTimeout(fillCharacterBaseInfo, 100);
  }
  let data = AssetsManager.CharacterData[__CharacterId];
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
      maxn += AssetsManager.MaxGearStatusData[__CharacterId][attr] / 100;
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
  let data = AssetsManager.CharacterData[__CharacterId];
  let askills = [data.MSkill1Id, data.MSkill2Id, data.MSkill3Id, data.SpecialMSkillId];
  let pskills = [data.AbilityMSkill1Id, data.AbilityMSkill2Id, data.AbilityMSkill3Id];
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

    // Link skill
    if(AssetsManager.LinkSkillData.hasOwnProperty(skill['Id'])){
      let lskill_req = AssetsManager.LinkSkillData[skill['Id']];
      let lskill = AssetsManager.SkillData[lskill_req.ActivateMSkillId];
      let link_icon = document.createElement('span');
      link_icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16" 
        style="border: dashed 2px; padding: 2px;"
        >
        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
      </svg>
      `;
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
    $(node).append(sname);
    $(node).append(scost);
    $(node).append(spower);
    $(node).append(sattr);
    $(node).append(sscope);
    $(node).append(seffect);
    $("#tbody-active-skill").append(node);
  }
  for(let i in pskills){
    let skill = AssetsManager.SkillData[pskills[i]];
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
  parent.append(AssetsManager.createCharacterAvatarNode(__CharacterId));
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

(function(){
  window.addEventListener("load", init);
})();