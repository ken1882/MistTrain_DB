let SceneData = {};
let DialogData = {};
let CurrentDialogueIndex = -1;

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
  AssetsManager.loadCharacterAssets();
  loadDialog();
  setup();
}

function setup(){
  if(!DataManager.isReady() || !AssetsManager.isReady()){
    return setTimeout(setup, 300);
  }
  setupDialogues();
}

function loadDialog(){
  AssetsManager.requestSingletonAssets(
    ()=>{
      $.ajax({
        url: `/api/GetStoryDetail/${__SceneId}`,
        success: (res)=>{
          SceneData = res;
          AssetsManager.incReadyCounter();
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
        let avatar = AssetsManager.createCharacterAvatarNode(mchid, 1);
        avatar.addClass('dialog-avatar');
        $(textbox).prepend(avatar);
      }
    }
    let audio_id = dialog['VoiceFileName'];
    if(audio_id){
      let voice_icon = document.createElement('span');
      $(voice_icon).attr('class', 'dialog-voice-icon');
      $(voice_icon).attr('id', `voice-${audio_id}`);
      voice_icon.innerHTML = __SvgAudioPlay;
      textbox.append(voice_icon);
      voice_icon.addEventListener('click', (_)=>{
        toggleDialogVoice(audio_id);
      });
      DialoguePlayer.registerAudioListener('end', audio_id, ()=>{
        setVoiceIcon(audio_id, 'play');
      });
      DialoguePlayer.registerAudioListener('stop', audio_id, ()=>{
        setVoiceIcon(audio_id, 'play');
      });
    }
    textbox.append(phrase);
    container.append(textbox);
    parent.append(container);
  }
}

function toggleDialogVoice(id){
  if(DialoguePlayer.isPlaying(id)){
    return stopDialogVoice(id);
  }
  else{
    return playDialogVoice(id);
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
    $(node.parentElement).removeClass('dialogbox-playing');
  }
  else if(state == 'stop'){
    node.innerHTML = __SvgAudioStop;
    $(node.parentElement).addClass('dialogbox-playing');
  }
}

function getPureDialoguePauseTime(text){
  text = text.replaceAll('\\n', '');
  let multiplier = parseInt(DataManager.getSetting('dialogueDuration'));
  let ret = (0.04 + multiplier/2) * text.length;
  ret += (text.match(/。/g) || []).length * 0.2;
  ret += (text.match(/～/g) || []).length * 0.1;
  ret += (text.match(/、/g) || []).length * 0.1;
  return Math.min(Math.max(1+(multiplier/10), ret), 10+multiplier);
}

(function (){
  window.addEventListener("load", init);
})();