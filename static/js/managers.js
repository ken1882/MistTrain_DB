/**---------------------------------------------------------------------------
 * > DataManager:
 *    The static class that manages data and settings.
 * @namespace
 * @property {object} database - The Local Storage
 */
 class DataManager{
  /*-------------------------------------------------------------------------*/
  constructor(){
    throw new Error("This is a static class")
  }
  /**-------------------------------------------------------------------------
   * @property {object} setting - the system settings
   */
  static initialize(){
    this.setting  = {}
    this.database = window.localStorage;
    this.ready    = false;
    this.setupSettingKeys();
    this.loadDatabase();
    this.loadLanguageSetting();
    this.loadLanguageFont();
    this.loadVolumeSetting();
    this.loadAudioEnable();
    this.loadDebugOption();
    this.ready    = true;
  }
  /*-------------------------------------------------------------------------*/
  static setupSettingKeys(){
    this.DefaultLanguage = "en_us"
    this.DefaultVolume   = [0.5, 1, 1]
    this.kLanguage       = "language";
    this.kVolume         = "volume";
    this.kAudioEnable    = "audioEnable";
    this.kDebug          = "debug";
    this.kDebugMode      = "debugMode";
    this.kFocus          = "focus";
  }
  /*-------------------------------------------------------------------------*/
  static loadDatabase(){
    for(let i=0;i<this.database.length;++i){
      let k = this.database.key(i);
      this.setting[k] = null;
      try{
        this.setting[k] = JSON.parse(this.database.getItem(k));
      }
      catch(e){
        console.error("Invalid database item: " + k + ": " + this.database.getItem(k))
      }
    }
  }
  /*-------------------------------------------------------------------------*/
  static loadLanguageSetting(){
    let lan_param = new URL(document.URL).searchParams.get("language");
    let lan = lan_param ? lan_param : this.language;
    if(!lan){lan = this.DefaultLanguage;}
    this.changeSetting(this.kLanguage, lan);
  }
  /*-------------------------------------------------------------------------*/
  static loadVolumeSetting(){
    let check = function(n){return 0 <= n && n <= 1;}
    if(validArgCount.apply(window, this.volume) != 3){
      this.changeSetting(this.kVolume, this.DefaultVolume);
    }
    else{
      let vn = 0;
      try{
        vn = validNumericCount.apply(this, [check, this.volume].flat());
      }
      catch(e){
        reportError(e);
        return window.alert(Vocab["BrowserUnsupport"]);
      }
      if(vn != 3){
        this.changeSetting(this.kVolume, this.DefaultVolume);
      }
    }
  }
  /*-------------------------------------------------------------------------*/
  static loadLanguageFont(){
    
  }
  /*-------------------------------------------------------------------------*/
  static loadAudioEnable(){
    let en = this.audioEnable
    if(!isClassOf(en, Array) || en.length != 2){
      this.changeSetting(this.kAudioEnable, [true, true]);
    }
  }
  /*-------------------------------------------------------------------------*/
  static loadDebugOption(){
    let dbg = this.debugOption;
    let dbgm = this.debugMode;
    if(!dbg){
      dbg = {
        "log": true,
        "showHand": false
      }
      this.changeSetting(this.kDebug, dbg);
    }
    if(!dbgm){this.changeSetting(this.kDebugMode, false);}
  }
  /*-------------------------------------------------------------------------*/
  static changeSetting(key, value){
    this.setting[key] = value;
    this.database.setItem(key, JSON.stringify(value));
  }
  /*-------------------------------------------------------------------------*/
  static isReady(){
    return Vocab.isReady() && this.ready;
  }
  /*-------------------------------------------------------------------------*/
  static getSetting(key){
    return this.setting[key];
  }
  /*-------------------------------------------------------------------------*/
  static changeDebugOption(key, value){
    let dbg = this.debugOption;
    dbg[key] = value;
    this.changeSetting(this.kDebug, dbg);
  }
  /*-------------------------------------------------------------------------*/
  static toggleDebugMode(){
    const stat = !!(this.debugMode ^ true);
    this.changeSetting(this.kDebugMode, stat);
  }
  /*-------------------------------------------------------------------------*/
  static requestBinaryData(kwargs){
    if(!kwargs.method){ kwargs.method = 'GET'; }
    var req = new XMLHttpRequest();
    req.open(kwargs.method, kwargs.url);
    req.responseType = "arraybuffer";
    if(kwargs.progress){ req.addEventListener('progress', kwargs.progress); }
    if(kwargs.load){ req.addEventListener('load', kwargs.load); }
    if(kwargs.error){ req.addEventListener('error', kwargs.error); }
    if(kwargs.abort){ req.addEventListener('abort', kwargs.abort); }
    if(kwargs.loadend){ req.addEventListener('loadend', kwargs.loadend); }
    req.send();
    return req;
  }
  /*-------------------------------------------------------------------------*/
  static requestCharacterSpineData(id, kwargs={}){
    var req_png   = new XMLHttpRequest();
    var req_atlas = new XMLHttpRequest();
    var req_skel  = new XMLHttpRequest();
    req_png.responseType = "blob";
    req_atlas.responseType = "text";
    req_skel.responseType = "arraybuffer";
    req_png.open('GET', `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.png`);
    req_atlas.open('GET', `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.atlas`);
    req_skel.open('GET', `https://assets.mist-train-girls.com/production-client-web-assets/Small/Spines/SDs/${id}/${id}.skel`);
    if(kwargs.progress){
      req_png.addEventListener('progress', kwargs.progress);
      req_atlas.addEventListener('progress', kwargs.progress);
      req_skel.addEventListener('progress', kwargs.progress);
    }
    if(kwargs.error){
      req_png.addEventListener('error', kwargs.error);
      req_atlas.addEventListener('error', kwargs.error);
      req_skel.addEventListener('error', kwargs.error);
    }
    if(kwargs.load){
      req_png.addEventListener('load', kwargs.load);
      req_atlas.addEventListener('load', kwargs.load);
      req_skel.addEventListener('load', kwargs.load);
    }
    if(kwargs.loadend){
      req_png.addEventListener('loadend', kwargs.loadend);
      req_atlas.addEventListener('loadend', kwargs.loadend);
      req_skel.addEventListener('loadend', kwargs.loadend);
    }
    req_png.send();
    req_atlas.send();
    req_skel.send();
    return [req_png, req_atlas, req_skel];
  }
  /*-------------------------------------------------------------------------*/
  /**-------------------------------------------------------------------------
   * > Getter functions
   */
  static get language(){return this.setting[this.kLanguage];}
  static get volume(){return this.setting[this.kVolume];}
  static get audioEnable(){return this.setting[this.kAudioEnable];}
  static get debugOption(){return this.setting[this.kDebug];}
  static get debugMode(){return this.setting[this.kDebugMode];}
  static get focus(){return this.setting[this.kFocus];}
  /*-------------------------------------------------------------------------*/
}

/**---------------------------------------------------------------------------
 * > AssetsManager:
 *    The static class that manages assets.
 * @namespace
 */
 class AssetsManager{
  /*-------------------------------------------------------------------------*/
  constructor(){
    throw new Error("This is a static class")
  }
  /**-------------------------------------------------------------------------
   * @property {object} setting - the system settings
   */
  static initialize(){
    this.__readyCnt = 0;
    this.__readyReq = 0;
    this.loadCharacterAvatars();
    this.loadAllAssets();
    this.setupAvatarCanvas();
  }

  static loadCharacterAvatars(){
    this.__readyReq += 2;
    var image = new Image(), image2 = new Image();
    image.crossOrigin = "anonymous";
    image.src = "https://assets.mist-train-girls.com/production-client-web-assets/Textures/Icons/Atlas/Layers/character-1.png";
    image.onload = () => {
      this.CharacterAvatarSet = image;
      this.__readyCnt += 1;
    };
    image2.src = "/static/assets/icons_party1.png";
    image2.onload = () => {
      this.CharacterFrameSet = image2;
      this.__readyCnt += 1;
    };
  }

  static requestAsset(req_n, proc, ...args){
    this.__readyReq += req_n;
    proc.apply(window, args);
  }

  static loadAllAssets(){
    const handlers = {
      "https://assets.mist-train-girls.com/production-client-web-assets/Textures/Icons/Atlas/Layers/character-1.plist": this.parseAvatarClipData,
      "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MCharacterViewModel.json": this.parseCharacterData,
      "https://assets.mist-train-girls.com/production-client-web-static/MasterData/GearLevelsViewModel.json": this.parseGearData,
      "https://assets.mist-train-girls.com/production-client-web-static/MasterData/MSkillViewModel.json": this.parseSkillData,
      "/static/json/iconinfo.json": this.parseIconClipData,
    }
    for(let uri in handlers){
      if(!handlers.hasOwnProperty(uri)){ continue; }
      this.__readyReq += 1;
      let method = handlers[uri];
      $.ajax({
        url: uri,
        success: (res) => { 
          method.apply(AssetsManager, [res]);
        },
        error: (res) => {
          if(res.status == 503){
            alert(Vocab['UnderMaintenance']);
          }
          else{
            alert(Vocab['UnknownError']);
          }
        }
      });
    }
  }

  static parseXMLKeyValueDict(node){
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
        node[key] = this.parseXMLKeyValueDict(node.children[i+1]);
      }
    }
    return node;
  }
  
  static parseAvatarClipData(xml){
    let root = xml.children[0].children[0];
    this.CharacterAvatarClip = this.parseXMLKeyValueDict(root);
    this.__readyCnt += 1;
  }
  
  static parseCharacterData(res){
    this.CharacterData = {};
    for(let i in res){
      let dat = res[i];
      this.CharacterData[dat['Id']] = dat;
    }
    this.__readyCnt += 1;
  }
  
  static parseGearData(res){
    this.MaxGearStatusData = {};
    for(let i=20;i<=res.length;i+=20){
      let dat = res[i-1];
      this.MaxGearStatusData[dat.MCharacterId] = dat.Status;
    }
    this.__readyCnt += 1;
  }
  
  static parseIconClipData(res){
    this.IconClipData = res;
    this.__readyCnt += 1;
  }

  static parseSkillData(res){
    this.SkillData = {};
    for(let i in res){
      let dat = res[i];
      this.SkillData[dat['Id']] = dat;
    }
    this.__readyCnt += 1;
  }

  static setupAvatarCanvas(){
    this.__readyReq += 1;
    const CharacterAvatarWidth  = 94;
    const CharacterAvatarHeight = 94;
    const CharacterFrameWidth   = 102;
    const CharacterFrameHeight  = 102;
    this.AvatarCanvas  = document.createElement("canvas");
    this.AvatarCanvas.width = CharacterAvatarWidth;
    this.AvatarCanvas.height = CharacterAvatarHeight;
    this.AvatarContext = this.AvatarCanvas.getContext('2d');
    this.AvatarContext.webkitImageSmoothingEnabled = false;
    this.AvatarContext.mozImageSmoothingEnabled = false;
    this.AvatarContext.imageSmoothingEnabled = false;
    this.FrameCanvas = document.createElement("canvas");
    this.FrameCanvas.width = CharacterFrameWidth;
    this.FrameCanvas.height = CharacterFrameHeight;
    this.FrameContext = this.FrameCanvas.getContext('2d');
    this.__readyCnt += 1;
  }

  static get AvatarFramePadding(){ return 4; }

  static createCharacterAvatarNode(id, frame_type=null){
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
    let rect = this.CharacterAvatarClip.frames[`${id}.png`].textureRect.flat();
    let krarity = 'frm_thumb_common';
    if(!frame_type){
      switch(this.CharacterData[id].CharacterRarity){
        case 2:
          krarity = 'frm_thumb_rare_a';
          break;
        case 3:
          krarity = 'frm_thumb_rare_s';
          break;
        case 4:
          krarity = 'frm_thumb_rare_ss';
          break;
      }
    }
    let rect2 = this.IconClipData[krarity].content.rect;
    this.AvatarContext.clearRect(0, 0, this.AvatarCanvas.width, this.AvatarCanvas.height);
    this.FrameContext.clearRect(0, 0, this.FrameCanvas.width, this.FrameCanvas.height);
    clipImage(
      this.AvatarCanvas, this.CharacterAvatarSet, img, 
      rect[0], rect[1], rect[2], rect[3],
      this.AvatarFramePadding, this.AvatarFramePadding,
      this.AvatarCanvas.width - this.AvatarFramePadding*2, this.AvatarCanvas.height - this.AvatarFramePadding*2
    );
    clipImage(
      this.FrameCanvas, this.CharacterFrameSet, img2, 
      rect2[0], rect2[1], rect2[2], rect2[3], 
      0, 0, rect2[2], rect2[3]
    );
    return container;
  }

  static isReady(){ 
    return this.__readyCnt >= this.__readyReq;
  }
}