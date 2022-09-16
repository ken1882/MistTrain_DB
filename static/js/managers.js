const ASSET_HOST = 'https://assets.mist-train-girls.com/production-client-web-assets';
const STATIC_HOST = 'https://assets.mist-train-girls.com/production-client-web-static';

const CharacterAvatarWidth  = 94;
const CharacterAvatarHeight = 94;
const CharacterFrameWidth   = 102;
const CharacterFrameHeight  = 102;
const FieldSkillImageWidth  = 202;
const FieldSkillImageHeight = 94;
const FieldSkillFrameWidth  = 214;
const FieldSkillFrameHeight = 102;

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
    this.DefaultLanguage = "en_us";
    this.DefaultVolume   = [0.3, 0.5, 0.4];
    this.kLanguage       = "language";
    this.kVolume         = "volume";
    this.kAudioEnable    = "audioEnable";
    this.kDebug          = "debug";
    this.kDebugMode      = "debugMode";
    this.kFocus          = "focus";
    this.kProfile        = 'MTG_PROFILE';
    this.kCharacters     = 'MTG_CHARS';
    this.kWeapons        = 'MTG_WEAPONS';
    this.kArmors         = 'MTG_ARMORS';
    this.kItems          = 'MTG_ITEMS';
    this.kAccessories    = 'MTG_ACCESSORIES';
    this.kAbstone        = 'MTG_ABSTONE';
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
    let en = this.audioEnable;
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
    req_png.open('GET', `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.png`);
    req_atlas.open('GET', `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.atlas`);
    req_skel.open('GET', `${ASSET_HOST}/Small/Spines/SDs/${id}/${id}.skel`);
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
  static updateProfile(val){
    let p = this.playerProfile;
    this.playerProfile = Object.assign({}, p, val);
  }
  /**-------------------------------------------------------------------------
   * > Getter/Setter functions
   */
  static get language(){return this.setting[this.kLanguage];}
  static get volume(){return this.setting[this.kVolume];}
  static get audioEnable(){return this.setting[this.kAudioEnable];}
  static get debugOption(){return this.setting[this.kDebug];}
  static get debugMode(){return this.setting[this.kDebugMode];}
  static get focus(){return this.setting[this.kFocus];}
  /*-------------------------------------------------------------------------*/
  static get playerProfile(){
    return this.getSetting(this.kProfile) || {};
  }
  static set playerProfile(val){
    this.changeSetting(this.kProfile, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataCharacters(){
    return this.getSetting(this.kCharacters) || [];
  }
  static set dataCharacters(val){
    this.changeSetting(this.kCharacters, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataItems(){
    return this.getSetting(this.kItems) || [];
  }
  static set dataItems(val){
    this.changeSetting(this.kItems, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataWeapons(){
    return this.getSetting(this.kWeapons) || [];
  }
  static set dataWeapons(val){
    this.changeSetting(this.kWeapons, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataArmors(){
    return this.getSetting(this.kArmors) || [];
  }
  static set dataArmors(val){
    this.changeSetting(this.kArmors, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataAccessories(){
    return this.getSetting(this.kAccessories) || [];
  }
  static set dataAccessories(val){
    this.changeSetting(this.kAccessories, val);
  }
  /*-------------------------------------------------------------------------*/
  static get dataAbstone(){
    return this.getSetting(this.kAbstone) || [];
  }
  static set dataAbstone(val){
    this.changeSetting(this.kAbstone, val);
  }
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
    this.__requestQueue = [];
    this.CharacterAvatarSet   = {};
    this.CharacterAvatarClip  = {};
    this.CharacterAvatarMap   = {};
    this.FieldSkillImageSet   = {};
    this.FieldSkillImageClip  = {};
    this.FieldSkillImageMap   = {};
  }

  static loadCharacterAssets(){
    this.loadCharacterAvatars();
    this.loadPartyFrames();
    this.loadAvatarClipData();
    this.loadCharacterData();
    this.setupAvatarCanvas();
  }

  static loadFieldSkillArchive(){
    this.loadAssetDataArchive('/static/json/iconinfo.json', this.parseIconClipData);
    this.__readyReq += 1;
    this.FieldSkillData = {};
    this.loadFieldSkillAsset();
    this.setupFieldSkillCanvas();
    $.ajax({
      url: `${STATIC_HOST}/MasterData/MFieldSkillViewModel.json`,
      success: (res) => { 
        for(let dat of res){
          this.FieldSkillData[dat.Id] = dat;
        }
        this.incReadyCounter();
      },
      error: handleAjaxError,
    })
  }

  static loadFieldSkillAsset(idx=1){
    this.__readyReq += 1;
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `${ASSET_HOST}/Textures/Icons/Atlas/FieldSkills/field_skill-${idx}.png?`;
    image.onload = () => {
      this.FieldSkillImageSet[idx] = image;
      this.incReadyCounter();
      AssetsManager.loadFieldSkillImageClip(idx);
      AssetsManager.loadFieldSkillAsset(idx+1);
    };
    image.onerror = ()=>{
      this.incReadyCounter();
    }
  }

  static loadFieldSkillImageClip(idx=1){
    this.__readyReq += 1;
    $.ajax({
      url: `${ASSET_HOST}/Textures/Icons/Atlas/FieldSkills/field_skill-${idx}.plist`,
      success: (res) => { 
        AssetsManager.parseFieldSkillImageClip(res, idx);
        this.incReadyCounter();
        AssetsManager.loadFieldSkillImageClip(idx+1);
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }
  
  static loadCharacterAvatars(idx=1){
    this.__readyReq += 1;
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Layers/character-${idx}.png`;
    image.onload = () => {
      this.CharacterAvatarSet[idx] = image;
      this.incReadyCounter();
      AssetsManager.loadCharacterAvatars(idx+1);
    };
    image.onerror = ()=>{
      this.incReadyCounter();
    }
  }

  static loadPartyFrames(){
    this.__readyReq += 1;
    let image = new Image();
    image.src = "/static/assets/icons_party1.png";
    image.onload = () => {
      this.PartyFrameSet = image;
      this.incReadyCounter();
    };
  }

  static getCharacterVoiceSet(id){
    let bid = this.CharacterData[id].MCharacterBaseId;
    return {
      'BattleStart':    `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_battle_${id}.mp3`,
      'Attack_1':       `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_attack1_${bid}.mp3`,
      'Attack_2':       `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_attack2_${bid}.mp3`,
      'Skill_1':        `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_skill1_${id}.mp3`,
      'Skill_2':        `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_skill2_${id}.mp3`,
      'SkillLink':      `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_cutin_${id}.mp3`,
      'Damage':         `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_damage_${bid}.mp3`,
      'Death':          `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_death_${id}.mp3`,
      'Victory':        `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_victory_${id}.mp3`,
      'SpecialSkill':   `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_special_${id}.mp3`,
      'NewJoin':        `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_new_${id}.mp3`,
      'Home_1':         `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_home1_${id}.mp3`,
      'Home_2':         `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_home2_${id}.mp3`,
      'Home_3':         `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_home3_${id}.mp3`,
      'Kizuna_1':       `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_favorite1_${id}.mp3`,
      'Kizuna_2':       `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_favorite2_${id}.mp3`,
      'Kizuna_3':       `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_favorite3_${id}.mp3`,
      'Kizuna_4':       `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_favorite4_${id}.mp3`,
      'Kizuna_5':       `${ASSET_HOST}/Sounds/Voices/Characters/Layers/${id}/voice_favorite5_${id}.mp3`,
      'NewYear':        `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_jan_${bid}.mp3`,
      'Valentine':      `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_feb_${bid}.mp3`,
      'WhiteValentine': `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_mar1_${bid}.mp3`,
      'DollsDay':       `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_mar2_${bid}.mp3`,
      'GoldenWeek':     `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_apr_${bid}.mp3`,
      'MomsDay':        `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_may_${bid}.mp3`,
      'Tsuyu':          `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_jun_${bid}.mp3`,
      'Tanabata':       `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_jul_${bid}.mp3`,
      'SummerFesti':    `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_aug_${bid}.mp3`,
      'Moonfesti':      `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_sep_${bid}.mp3`,
      'Halloween':      `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_oct_${bid}.mp3`,
      'Autumn':         `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_nov_${bid}.mp3`,
      'Christmas':      `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_dec1_${bid}.mp3`,
      'NewYearEve':     `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_dec2_${bid}.mp3`,
      'Oneyear':        `${ASSET_HOST}/Sounds/Voices/Characters/Bases/${bid}/voice_oneyear_${bid}.mp3`,
    }
  }

  static loadAvatarClipData(idx=1){
    this.__readyReq += 1;
    $.ajax({
      url: `${ASSET_HOST}/Textures/Icons/Atlas/Layers/character-${idx}.plist`,
      success: (res) => { 
        AssetsManager.parseAvatarClipData(res, idx);
        this.incReadyCounter();
        AssetsManager.loadAvatarClipData(idx+1);
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }

  /**
   * > Request async resources, used with `AssetsManager.incReadyCounter` and `AssetsManager.isReady()` 
   * to check if fully loaded.
   * @param {int} req_n - Counter number to increase
   * @param {function} proc - Function to call (the loading procedure)
   * @param  {...any} args - Arguments passed to the function
   */
  static requestAsset(req_n, proc, ...args){
    this.__readyReq += req_n;
    proc.apply(window, args);
  }

  /**
   * > Request a single async resources, increase counter according to
   * the number of `procs` given.  
   * Used with `AssetsManager.incReadyCounter` and `AssetsManager.isReady()` 
   * to check if fully loaded.
   * @param  {function} procs - Functions to call
   */
  static requestSingletonAssets(...procs){
    this.__readyReq += procs.length;
    for(let i in procs){
      procs[i].apply(window);
    }
  }

  static queueAssetRequest(proc){
    this.__requestQueue.push({
      proc: proc,
    });
    setTimeout(this.__updateQueuedRequest, 300);
  }

  static __updateQueuedRequest(){
    if(!AssetsManager.isStageLoaded()){
      return setTimeout(AssetsManager.__updateQueuedRequest, 300);
    }
    let data = AssetsManager.__requestQueue[0];
    data.proc.apply(window);
    AssetsManager.__requestQueue.shift();
    if(AssetsManager.__requestQueue.length){
      setTimeout(AssetsManager.__updateQueuedRequest, 300);
    }
  }

  static incReadyCounter(n=1){
    this.__readyCnt += n;
  }

  static loadCharacterData(){
    let handlers = {
      "/static/json/iconinfo.json": this.parseIconClipData,
      "/MasterData/MCharacterViewModel.json": this.parseCharacterData,
      "/MasterData/GearLevelsViewModel.json": this.parseGearData,
      "/MasterData/MSkillViewModel.json": this.parseSkillData,
      "/MasterData/MLinkSkillViewModel.json": this.parseLinkSkillData,
      "/MasterData/MChangeSkillViewModel.json": this.parseChangeSkillData,
      "/MasterData/MDressUpViewModel.json": this.parseDressupData,
      "/MasterData/MCharacterSkinViewModel.json": this.parseCharacterSkinData,
      "/MasterData/MTrainBoardViewModel.json": this.parseTrainBoardData,
      "/MasterData/MSceneViewModel.json": this.parseSceneData,
    }
    for(let uri in handlers){
      if(!handlers.hasOwnProperty(uri)){ continue; }
      this.loadAssetDataArchive(uri, handlers[uri]);
    }
  }

  static loadSkillArchive(){
    let handlers = {
      "/MasterData/MSkillViewModel.json": this.parseSkillData,
      "/MasterData/MLinkSkillViewModel.json": this.parseLinkSkillData,
      "/MasterData/MChangeSkillViewModel.json": this.parseChangeSkillData,
    }
    for(let uri in handlers){
      if(!handlers.hasOwnProperty(uri)){ continue; }
      this.loadAssetDataArchive(uri, handlers[uri]);
    }
  }

  static loadAssetDataArchive(uri, handler){
    this.__readyReq += 1;
    if(uri.includes('MasterData')){
      uri = `${STATIC_HOST}${uri}`;
    }
    $.ajax({
      url: uri,
      success: (res) => { 
        handler.apply(AssetsManager, [res]);
        this.incReadyCounter();
      },
      error: handleAjaxError,
    });
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
  
  /**
   * > Parse clip data from mega character canvas 
   * @param {*} xml Response XML dara
   * @param {*} idx Index of canvas to track correct canvas of character
   */
  static parseAvatarClipData(xml, idx){
    let root = xml.children[0].children[0];
    let data = this.parseXMLKeyValueDict(root);
    for(let i in data.frames){
      if(!data.frames.hasOwnProperty(i)){ continue; }
      this.CharacterAvatarClip[i] = data.frames[i];
      this.CharacterAvatarMap[i] = idx;
    }
  }
  
  static parseCharacterData(res){
    this.CharacterData = {};
    for(let i in res){
      let dat = res[i];
      this.CharacterData[dat['Id']] = dat;
    }
  }
  
  static parseGearData(res){
    this.MaxGearStatusData = {};
    for(let i=20;i<=res.length;i+=20){
      let dat = res[i-1];
      this.MaxGearStatusData[dat.MCharacterId] = dat.Status;
    }
  }
  
  static parseIconClipData(res){
    this.IconClipData = res;
  }

  static parseSkillData(res){
    this.SkillData = {};
    for(let i in res){
      let dat = res[i];
      this.SkillData[dat['Id']] = dat;
    }
  }

  static parseLinkSkillData(res){
    this.LinkSkillData = {};
    for(let i in res){
      let dat = res[i];
      this.LinkSkillData[dat['OriginMSkillId']] = dat;
    }
  }

  static parseChangeSkillData(res){
    this.ChangeSkillData = {};
    this.ChangeSkillMirrorMap = {};
    for(let i in res){
      let dat = res[i];
      this.ChangeSkillData[dat['EffectSkillId']] = [
        dat['BeforeSkillId'], dat['AfterSkillId']
      ];
      // This assumes change skills are one to one, may be bugged in future
      this.ChangeSkillMirrorMap[dat['BeforeSkillId']] = dat['AfterSkillId'];
      this.ChangeSkillMirrorMap[dat['AfterSkillId']] = dat['BeforeSkillId'];
    }
  }

  static parseCharacterSkinData(res){
    this.CharacterSkinData = {};
    for(let i in res){
      let dat = res[i];
      let mbchid = dat.MCharacterBaseId;
      if(!this.CharacterSkinData.hasOwnProperty(mbchid)){
        this.CharacterSkinData[mbchid] = {};
      }
      this.CharacterSkinData[mbchid][dat.Id] = dat;
    }
  }

  static parseDressupData(res){
    this.DressupData = {};
    for(let i in res){
      let dat = res[i];
      let sid = res[i].MCharacterSkinId;
      if(!this.DressupData.hasOwnProperty(sid)){
        this.DressupData[sid] = [];
      }
      this.DressupData[sid].push(dat);
    }
  }

  static parseTrainBoardData(res){
    this.TrainBoardData = {};
    for(let i in res){
      let dat = res[i];
      for(let j in dat.TrainBoardOarders){
        let tb = dat.TrainBoardOarders[j];
        tb.MTrainBoardDetails = tb.MTrainBoardDetails.sort((a,b)=>{return a.DetailOrder - b.DetailOrder});
      }
      this.TrainBoardData[dat.MCharacterId] = dat;
    }
  }

  static parseSceneData(res){
    this.SceneData = {};
    for(let i=0;i<res.length;++i){
      let scene = res[i];
      this.SceneData[scene.Id] = scene;
    }
  }

  static parseFieldSkillImageClip(xml, idx){
    let root = xml.children[0].children[0];
    let data = this.parseXMLKeyValueDict(root);
    for(let i in data.frames){
      if(!data.frames.hasOwnProperty(i)){ continue; }
      this.FieldSkillImageClip[i] = data.frames[i];
      this.FieldSkillImageMap[i] = idx;
    }
  }

  static setupCharacterSkin(){
    this.DressedCharacterMap = {};
    for(let mbchid in this.CharacterSkinData){
      if(!this.CharacterSkinData.hasOwnProperty(mbchid)){ continue; }
      for(let skin_id in this.CharacterSkinData[mbchid]){
        if(!this.DressupData.hasOwnProperty(skin_id)){ continue; }
        let mchid = this.DressupData[skin_id][0].MCharacterId;
        if(!this.DressedCharacterMap.hasOwnProperty(mchid)){
          this.DressedCharacterMap[mchid] = [];
        }
        this.DressedCharacterMap[mchid].push(skin_id);
      }
    }
  }

  static setupAvatarCanvas(){
    this.__readyReq += 1;
    this.AvatarCanvas = document.createElement("canvas");
    this.AvatarCanvas.width = CharacterFrameWidth;
    this.AvatarCanvas.height = CharacterFrameHeight;
    this.AvatarContext = this.AvatarCanvas.getContext('2d');
    this.incReadyCounter();
  }

  static get FramePadding(){ return 4; }

  static createCharacterAvatarNode(id, frame_type=null){
    let container = $(document.createElement('div'));
    container.attr('class', 'avatar-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    // let img2 = document.createElement('img');
    $(img).attr('class', 'avatar');
    // $(img2).attr('class', 'avatar-frame');
    block.append(img);
    // block.append(img2);
    let avatar_key = `${id}.png`;
    let rect = null;
    if(this.CharacterAvatarClip.hasOwnProperty(avatar_key)){
      rect = this.CharacterAvatarClip[`${id}.png`].textureRect.flat();
    }
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
    let rect2 = null;
    try{
      rect2 = this.IconClipData[krarity].content.rect;
    }catch(e){
      console.error(e);
    }
    this.AvatarContext.clearRect(0, 0, this.AvatarCanvas.width, this.AvatarCanvas.height);
    if(rect){
      let src_idx = this.CharacterAvatarMap[avatar_key];
      clipImage(
        this.AvatarCanvas, this.CharacterAvatarSet[src_idx], img, 
        rect[0], rect[1], rect[2], rect[3],
        this.FramePadding, this.FramePadding,
        CharacterAvatarWidth, CharacterAvatarHeight,
      );
    }
    if(rect2){
      clipImage(
        this.AvatarCanvas, this.PartyFrameSet, img, 
        rect2[0], rect2[1], rect2[2], rect2[3], 
        0, 0, rect2[2], rect2[3]
      );
    }
    return container;
  }


  static setupFieldSkillCanvas(){
    this.__readyReq += 1;
    this.FieldSkillCanvas  = document.createElement("canvas");
    this.FieldSkillCanvas.width  = FieldSkillFrameWidth;
    this.FieldSkillCanvas.height = FieldSkillFrameHeight;
    this.FieldSkillContext = this.FieldSkillCanvas.getContext('2d');
    this.incReadyCounter();
  }

  static createFieldSkillImageNode(id, frame_type=null){
    let container = $(document.createElement('div'));
    container.attr('class', 'fieldskill-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    // let img2 = document.createElement('img');
    $(img).attr('class', 'fieldskill-image');
    // $(img2).attr('class', 'fieldskill-frame');
    block.append(img);
    // block.append(img2);
    let image_key = `${id}.png`;
    let rect = null;
    if(this.FieldSkillImageClip.hasOwnProperty(image_key)){
      rect = this.FieldSkillImageClip[`${id}.png`].textureRect.flat();
    }
    else{ return null; }
    let krarity = 'frm_thumb__ptskill_rare_b';
    if(!frame_type){
      switch(this.FieldSkillData[id].Rarity){
        case 2:
          krarity = 'frm_thumb__ptskill_rare_a';
          break;
        case 3:
          krarity = 'frm_thumb__ptskill_rare_s';
          break;
        case 4:
          krarity = 'frm_thumb__ptskill_rare_ss';
          break;
      }
    }
    let rect2 = null;
    try{
      rect2 = this.IconClipData[krarity].content.rect;
    }catch(e){
      console.error(e);
    }
    let canvas  = this.FieldSkillCanvas;
    let context = this.FieldSkillContext;
    let rotated = this.FieldSkillImageClip[image_key].textureRotated;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(rect){
      let src_idx = this.FieldSkillImageMap[image_key];
      if(rotated){
        context.translate(0, canvas.height);
      }
      clipImage(
        canvas, this.FieldSkillImageSet[src_idx], img, 
        rect[0], rect[1], rotated ? rect[3] : rect[2], rotated ? rect[2] : rect[3],
        this.FramePadding, this.FramePadding,
        rotated ? FieldSkillImageHeight : FieldSkillImageWidth, 
        rotated ? FieldSkillImageWidth  : FieldSkillImageHeight,
        rotated ? 270 : 0
      );
    }
    if(rect2){
      clipImage(
        canvas, this.PartyFrameSet, img, 
        rect2[0], rect2[1], rect2[2], rect2[3], 
        0, 0, rect2[2], rect2[3]
      );
    }
    return container;
  }

  static isStageLoaded(){
    return this.__readyCnt >= this.__readyReq;
  }

  static isReady(){ 
    return !this.__requestQueue.length && this.isStageLoaded();
  }
}