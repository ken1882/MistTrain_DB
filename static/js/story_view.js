let SceneData = {};
let DialogData = {};
let NPCData = {};

function init(){
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
    },
    ()=>{
      $.ajax({
        url: `/static/json/npc_data.json`,
        success: (res)=>{
          NPCData = res;
          AssetsManager.incReadyCounter();
        },
        error: handleAjaxError,
      });
    }
  );
}

function findSpeakerCharacterId(dialog){
  let sp_name = dialog.Name;
  let ret = null;
  for(let i in dialog.StandCharacters){
    let dat = dialog.StandCharacters[i];
    let mchid = dat.MCharacterId;
    if(AssetsManager.CharacterData.hasOwnProperty(mchid)){
      let bname = AssetsManager.CharacterData[mchid].MCharacterBase.Name;
      if(bname == sp_name){
        return mchid;
      }
    }
    else if(NPCData.hasOwnProperty(mchid)){
      let bname = NPCData[mchid].Name;
      if(bname == sp_name){
        return mchid;
      }
    }
  }
  return ret;
}


function setupDialogues(){ 
  DialogData = SceneData.MSceneDetailViewModel;
  console.log('setup')
  $("scene-title").text(SceneData.Title);
  let parent = $("#log-section");
  for(let i in DialogData){
    let dialog = DialogData[i];
    let container = document.createElement('div');
    $(container).attr('id', `dialog-${dialog['GroupOrder']}-${dialog['ViewOrder']}`)
    let textbox = document.createElement('div');
    $(textbox).attr('class', 'dialogbox');
    let phrase = document.createElement('div');
    phrase.innerHTML = dialog.Phrase.replaceAll('＊','<br>');
    if(dialog['Name']){
      phrase.innerHTML = `<span style="color:greenyellow;"><b>${dialog['Name']}：</b></span><br>` + phrase.innerHTML;
      let mchid = findSpeakerCharacterId(dialog);
      if(mchid != null){
        let avatar = AssetsManager.createCharacterAvatarNode(mchid, 1);
        avatar.addClass('dialog-avatar');
        $(textbox).prepend(avatar);
      }
    }
    textbox.append(phrase);
    container.append(textbox);
    parent.append(container);
  }
}

(function (){
  AssetsManager.loadCharacterAssets();
  window.addEventListener("load", init);
})();