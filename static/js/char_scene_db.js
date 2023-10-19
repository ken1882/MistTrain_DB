let CharacterAvatarNode = {};
let ViewableCharacterScene = {};
let SceneSelectModal = null;

function initCharDB(){
  if(!DataManager.isReady()){
    return setTimeout(initCharDB, 100);
  }
  AssetsManager.loadCharacterAssets();
  setup();
}


function setup(){
  if(!AssetsManager.isReady()){
    return setTimeout(setup, 100);
  }
  appendCharacterAvatars();
  viewChangeGrid();
  updateViewableCharacters();
  setupSceneSelectModal();
  $("#loading-indicator").remove();
}

function setupSceneSelectModal(){
  SceneSelectModal = new bootstrap.Modal($('#modal-scene-select'));
  let list_parent = $('#scene-list-container');
  for(let i=0;i<8;++i){
    let row = $(document.createElement('div'));
    row.attr('class', 'row');
    let btn = $(document.createElement('a'));
    btn.attr('id', `scene-sel-${i}`);
    btn.attr('type', 'button');
    btn.attr('class', 'btn btn-secondary btn-block btn-major');
    btn.css('display', 'none');
    btn.attr('target', '_blank');
    btn.attr('href', '#');
    row.append(btn);
    list_parent.append(row);
  }
}

function updateViewableCharacters(){
  $.ajax({
    url: "/api/AvailableCharacterScene",
    success: (res) => {
      ViewableCharacterScene = res;
      let cnt = 0, len = 0;
      for(let i in res){
        if(!res.hasOwnProperty(i)){ continue; }
        cnt += 1;
        len += 1;
        for(let j in res[i]){
          if(!res[i].hasOwnProperty(j)){ continue; }
          if(!res[i][j]){
            cnt -= 1;
            if(CharacterAvatarNode.hasOwnProperty(i)){
              CharacterAvatarNode[i].css('opacity', '0.3');
            }
            break;
          }
        }
      }
      $('#available-count').text(`(viewable: ${cnt}/${len})`)
    },
    error: handleAjaxError,
  });
}

function appendCharacterAvatars(){
  let parent = $('#character-grid');
  for(let id in AssetsManager.CharacterData){
    if(!AssetsManager.CharacterData.hasOwnProperty(id)){continue;}
    let container = $(document.createElement('div'));
    container.attr('class', 'avatar-container clickable');
    container.attr('id', `grid-avatar-${id}`);
    let inner_container = $(document.createElement('a'));
    inner_container.append(AssetsManager.createCharacterAvatarNode(id));
    container.append(inner_container);
    inner_container.on('click', (_)=>{
      showCharacterSceneList(id);
    });  
    CharacterAvatarNode[id] = inner_container;
    parent.append(container);
  }
}

function viewChangeGrid(e){
  $('#character-grid').css('display', '');
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
}

function showCharacterSceneList(id){
  $('#layer-name').text(AssetsManager.CharacterData[id].Name+' '+AssetsManager.CharacterData[id].MCharacterBase.Name);
  for(let i=0;i<8;++i){
    $(`#scene-sel-${i}`).css('display', 'none');
    $(`#scene-sel-${i}`).text('');
    $(`#scene-sel-${i}`).removeAttr('href');
  }
  let cnt = 0;
  for(let i in ViewableCharacterScene[id]){
    let title = AssetsManager.SceneData[i].Title;
    if(Vocab.SceneTitle.hasOwnProperty(i)){
      title = Vocab.SceneTitle[i];
    }
    let btn   = $(`#scene-sel-${cnt}`);
    btn.css('display', '');
    btn.text(title);
    if(ViewableCharacterScene[id][i]){
      btn.css('background-color', 'green');
      btn.attr('href', `/story_transcript/${i}?t=c&c=${id}`);
      btn.attr('onclick', '');
    }
    else{
      btn.css('background-color', 'red');
      btn.attr('onclick', 'alert(Vocab.SceneMissing)');
    }
    cnt += 1;
  }
  SceneSelectModal.show();
}

(function(){
  window.addEventListener("load", initCharDB);
})();