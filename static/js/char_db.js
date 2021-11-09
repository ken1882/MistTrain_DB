let CharacterAvatarSet = null;
let CharacterAvatarClip = {};
let CharacterData = {};
let __CntDataLoaded = 0;
var Canvas, Context;

function clipImage(image, target, cx, cy, cw, ch){
  Context.drawImage(image, cx, cy, cw, ch, 0, 0, cw, ch);
  target.src = Canvas.toDataURL();
}

function init(){
  Canvas  = document.getElementById("canvas");
  Context = Canvas.getContext('2d');
  appendCharacterAvatars();
}

function appendCharacterAvatars(){
  if(__CntDataLoaded < 3){
    return setTimeout(() => {
      appendCharacterAvatars()
    }, 100);
  }
  let parent = $('#character-list');
  for(let i in CharacterData){
    if(!CharacterData.hasOwnProperty(i)){continue;}
    let block = $(document.createElement('a'))
    block.attr('href', '#');
    let img = document.createElement('img');
    $(img).attr('class', 'avatar');
    block.append(img);
    parent.append(block);
    let rect = CharacterAvatarClip.frames[`${i}.png`].textureRect.flat();
    clipImage(CharacterAvatarSet, img, rect[0], rect[1], rect[2], rect[3]);
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

(function(){
  var image = new Image();
  image.crossOrigin = "anonymous";
  image.src = "https://assets.mist-train-girls.com/production-client-web-assets/Small/Textures/Icons/Atlas/Layers/character-1.png";
  image.onload = () => {
    CharacterAvatarSet = image;
    __CntDataLoaded += 1;
  };
  $.ajax({
    url: "https://assets.mist-train-girls.com/production-client-web-assets/Small/Textures/Icons/Atlas/Layers/character-1.plist",
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
  window.addEventListener("load", init);
})()