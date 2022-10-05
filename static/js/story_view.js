let SceneData = {};
let DialogData = {};
let CurrentDialogueIndex = -1;
let CurrentDialogueElement = null;
let CurrentDialogueTimer = null;

/* Reference:
  e[n.IsSpeakingFlags]:
  e[e.None = 0] = "None",
  e[e.OuterRight = 1] = "OuterRight",
  e[e.InnerRight = 2] = "InnerRight",
  e[e.Center = 4] = "Center",
  e[e.InnerLeft = 8] = "InnerLeft",
  e[e.OuterLeft = 16] = "OuterLeft"
*/
const SpeakingFlagPositionMap = {
  // flag: position
  0: 0,
  1: 5,
  2: 4,
  4: 3,
  8: 2,
  16: 1,
}

const __SvgAudioPlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
  <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
</svg>
`;

const __SvgAudioStop = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-stop-circle" viewBox="0 0 16 16">
  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
  <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5v-3z"/>
</svg>
`;

function init(){
  if(!AssetsManager.initialized){
    return setTimeout(init, 300);
  }
  AssetsManager.loadCharacterAssets();
  loadTooltips();
  loadDialog();
  setup();
}

function loadTooltips(){
  if(!DataManager.isReady()){
    return setTimeout(loadTooltips, 300);
  }
  $("#settings").attr('title', Vocab['Settings']);
  $("#autoplaystart").attr('title', Vocab['PlayFromStart']);
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  setupDialogues();
  $("#loading-indicator").remove();
}

function loadDialog(){
  AssetsManager.requestSingletonAssets(
    ()=>{
      $.ajax({
        url: `/api/GetStoryDetail/${__SceneId}`,
        success: (res)=>{
          SceneData = res;
          setTimeout(() => {AssetsManager.incReadyCounter();}, 1000);
        },
        error: handleAjaxError,
      });
    }
  );
}

function findSpeakerCharacterId(dialog){
  let pos = dialog.IsSpeakingFlags;
  for(let i in dialog.StandCharacters){
    let dat = dialog.StandCharacters[i];
    let mchid = dat.MCharacterId;
    if(dat.Position == SpeakingFlagPositionMap[pos]){
      return mchid;
    }
  }
  let sp_name = dialog.Name;
  for(let i in dialog.StandCharacters){
    let dat = dialog.StandCharacters[i];
    let mchid = dat.MCharacterId;
    if(AssetsManager.CharacterData.hasOwnProperty(mchid)){
      let bname = AssetsManager.CharacterData[mchid].MCharacterBase.Name;
      if(sp_name == bname){ return mchid; }
    }
  }
  return null;
}

function setupDialogues(){
  DialogData = SceneData.MSceneDetailViewModel;
  DialoguePlayer.setup(SceneData);
  $("#scene-title")[0].innerHTML += SceneData.Title;
  let parent = $("#log-section");
  for(let i in DialogData){
    let dialog = DialogData[i];
    let container = document.createElement('div');
    $(container).attr('id', `dialog-${dialog['GroupOrder']}-${dialog['ViewOrder']}`)
    let textbox = document.createElement('div');
    $(textbox).attr('class', 'dialogbox');
    let phrase = document.createElement('div');
    phrase.innerHTML = dialog.Ruby.replaceAll('＊', '<br>');
    if(dialog['Name']){
      phrase.innerHTML = `<span style="color:greenyellow;"><b>${dialog['Name']}：</b></span><br>` + phrase.innerHTML;
      let mchid = findSpeakerCharacterId(dialog);
      if(mchid != null){
        try{
          let avatar = AssetsManager.createCharacterAvatarNode(mchid, 1);
          avatar.addClass('dialog-avatar');
          $(textbox).prepend(avatar);
        }
        catch(e){
          console.error(`Character ${mchid} has no avatar available`)
          console.error(e);
        }
      }
    }
    let audio_id = dialog['VoiceFileName'];
    $(container).attr('audio-id', audio_id);
    if(audio_id){
      let voice_icon = document.createElement('span');
      $(voice_icon).attr('class', 'dialog-voice-icon');
      $(voice_icon).attr('id', `voice-${audio_id}`);
      voice_icon.innerHTML = __SvgAudioPlay;
      textbox.append(voice_icon);
      voice_icon.addEventListener('click', (event)=>{
        let target = event.target;
        while(!($(target).attr('id') || '').includes('dialog')){
          target = target.parentElement;
        }
        toggleDialogPlay(target);
      });
      DialoguePlayer.registerAudioListener('stop', audio_id, ()=>{
        setVoiceIcon(audio_id, 'play');
      });
      DialoguePlayer.registerAudioListener('end',  audio_id, onAudioDialoguePlayEnd);
    }
    textbox.append(phrase);
    container.append(textbox);
    parent.append(container);
  }
}


function playDialogVoice(id){
  setVoiceIcon(id, 'stop');
  DialoguePlayer.play(id);
}

function stopDialogVoice(id){
  setVoiceIcon(id, 'play');
  DialoguePlayer.stop(id);
}

function setVoiceIcon(id, state){
  let node = $(`#voice-${id}`)[0];
  if(state == 'play'){
    node.innerHTML = __SvgAudioPlay;
  }
  else if(state == 'stop'){
    node.innerHTML = __SvgAudioStop;
  }
}

function playLatestBGM(){
  for(let i=CurrentDialogueIndex;i>=0;--i){
    let bgm = DialogData[i].BGM;
    if(!bgm){ continue; }
    let dur = 1500;
    DialoguePlayer.fadeInBGM(bgm, dur);
    break;
  }
}

function showLatestBackground(){
  console.log(CurrentDialogueIndex);
  for(let i=CurrentDialogueIndex;i>=0;--i){
    let bgi = DialogData[i].BackgroundImage;
    if(!bgi){ continue; }
    changeBackground(bgi);
    break;
  }
}

function toggleDialogPlay(target){
  if(($($(target).children()[0]).attr('class') || '').includes('dialogbox-playing')){
    if(DialoguePlayer.currentBGM && DialoguePlayer.currentBGM.playing()){
      DialoguePlayer.currentBGM.pause();
    }
    stopDialogueNode(target);
  }
  else{
    if(DialoguePlayer.currentBGM && !DialoguePlayer.currentBGM.playing()){
      let vols = DataManager.getSetting(DataManager.kVolume);
      let audio = DialoguePlayer.currentBGM;
      audio.play();
      if(audio.volume() != vols[0]){
        audio.fade(0.0, vols[0], 1000);
      }
    }
    playDialogueNode(target);
    showLatestBackground();
    if(!DialoguePlayer.currentBGM){
      playLatestBGM();
    }
  }
}

function playDialogueNode(node){
  stopDialogueNode(CurrentDialogueElement);
  clearTimeout(CurrentDialogueTimer);
  CurrentDialogueElement = node;
  if(!node){ 
    CurrentDialogueIndex = -1;
    CurrentDialogueTimer = null;
    return;
  }
  let dia_ids = $(node).attr('id').split('-');
  CurrentDialogueIndex = DialogData.findIndex(obj => {
    return obj.GroupOrder == dia_ids[1] && obj.ViewOrder == dia_ids[2];
  });
  // highlight current playing node
  $($(node).children()[0]).addClass('dialogbox-playing');
  if($("#ckb-autoscroll").prop('checked')){
    $('body,html').animate({
      scrollTop: Math.max(0, node.offsetTop - (window.innerHeight - node.offsetHeight)/2)
    }, 800);
  }
  let aid = $(node).attr('audio-id');
  if(aid){
    setTimeout(() => {
      playDialogVoice(aid);
    }, 50);
  }
  else{
    let phrase = DialogData[CurrentDialogueIndex].Phrase;
    CurrentDialogueTimer = setTimeout(() => {
      let ddata = DialogData[CurrentDialogueIndex+1];
      if($("#ckb-autoplay").prop('checked') && ddata){
        let id = `dialog-${ddata['GroupOrder']}-${ddata['ViewOrder']}`;
        playDialogueNode(document.getElementById(id));
      }
      else{
        playDialogueNode(null);
        DialoguePlayer.fadeOutBGM();
      }
      CurrentDialogueTimer = null;
    }, parseInt(getPureDialoguePauseTime(phrase)*1000));
  }
  // new bgm
  let bgm = DialogData[CurrentDialogueIndex].BGM;
  if(bgm){
    let dur = 1500;
    if(DialoguePlayer.currentBGM && DialoguePlayer.currentBGM.id != bgm){
      DialoguePlayer.fadeOutBGM(null, dur);
    }
    if(!DialoguePlayer.currentBGM || 
      DialoguePlayer.currentBGM.id != bgm ||
      !DialoguePlayer.currentBGM.playing()){
      DialoguePlayer.fadeInBGM(bgm, dur);
    }
  }
  // new background image
  let bgi = DialogData[CurrentDialogueIndex].BackgroundImage;
  if(bgi){
    changeBackground(bgi);
  }
}

function onAudioDialoguePlayEnd(){
  CurrentDialogTimer = setTimeout(() => {
    let ddata = DialogData[CurrentDialogueIndex+1];
    if($("#ckb-autoplay").prop('checked') && ddata){
      let id = `dialog-${ddata['GroupOrder']}-${ddata['ViewOrder']}`;
      playDialogueNode(document.getElementById(id));
    }
    else{
      playDialogueNode(null);
      DialoguePlayer.fadeOutBGM();
    }
  }, parseInt(getDialogueBetweenPeriod()*1000));
}

function stopDialogueNode(node){
  if(!node){return ;}
  $($(node).children()[0]).removeClass('dialogbox-playing');
  let aid = $(node).attr('audio-id');
  if(aid){ stopDialogVoice(aid); }
}


function autoPlayall(){
  $("#ckb-autoplay").prop('checked', true);
  let dialog = DialogData[0];
  let id = `dialog-${dialog['GroupOrder']}-${dialog['ViewOrder']}`;
  playDialogueNode($(`#${id}`)[0]);
}

function startAutoplay(id){
  console.log(id);
}

function getDialogueBetweenPeriod(){
  let factor = parseInt(DataManager.getSetting('dialogueDuration'));
  return 0.6 + factor / 10;
}

function getPureDialoguePauseTime(text){
  text = text.replaceAll('\\n', '');
  let factor = parseInt(DataManager.getSetting('dialogueDuration'));
  let ret = (0.1 + factor/20) * text.length;
  ret += (text.match(/。/g) || []).length * 1.2;
  ret += (text.match(/～/g) || []).length * 0.8;
  ret += (text.match(/、/g) || []).length * 0.8;
  ret += (text.match(/…/g) || []).length * 0.3;
  return Math.min(Math.max(1+(factor/10), ret), 10+factor);
}

/**
 * Change background with fadein-out effect
 * @param {number} id Background id
 */
function changeBackground(id){
  let src  = `${ASSET_HOST}/Textures/Backgrounds/Adventure/${id}.jpg`;
  let line = document.getElementById('line');
  let h = $('#log-section')[0].getBoundingClientRect().height;
  let bg = $('#bg-section'), bg2 = $('#bg-section2');
  let padding = 1;

  bg.css('left', 0);
  bg.css('top', line.offsetTop+padding);
  bg.css('width', '100%');
  bg.css('height', h+line.offsetTop-padding);
  bg2.css('left', 0);
  bg2.css('top', line.offsetTop+padding);
  bg2.css('width', '100%');
  bg2.css('height', h+line.offsetTop-padding);
  let oimg = bg.css('backgroundImage');
  if(oimg){
    bg2.css('backgroundImage', oimg);
    bg2.css('display', 'block');
    bg2.fadeOut('slow');
  }
  bg.css('display', 'none');
  bg.css('backgroundImage', `url(${src})`);
  bg.fadeIn('slow');
}

(function (){
  window.addEventListener("load", init);
})();
