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
const FormationBaseWidth    = 98;
const FormationBaseHeight   = 98;
const FormationPosWidth     = 18;
const FormationPosHeight    = 18;
const SkillIconFrameWidth   = 100;
const SkillIconFrameHeight  = 100;

const ITYPE_CHARACTER   = 0;
const ITYPE_WEAPON      = 1;
const ITYPE_ARMOR       = 2;
const ITYPE_ACCESSORY   = 3;
const ITYPE_CONSUMABLE  = 4;
const ITYPE_ABSTONE     = 5;
const ITYPE_GOLD        = 6;
const ITYPE_FREEGEM     = 7;
const ITYPE_GEM         = 8;
const ITYPE_GEAR        = 10; // aka character pieces
const ITYPE_GEAR2       = 11;
const ITYPE_ABSTONE2    = 12;
const ITYPE_SKIN        = 13;
const ITYPE_MUSIC       = 14;
const ITYPE_ADD_SKILL   = 15;
const ITYPE_EXP         = 16;
const ITYPE_FORMATION   = 29;
const ITYPE_FIELD_SKILL = 30;
const ITYPE_SKILL       = 31;

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
    this.kAbstones       = 'MTG_ABSTONES';
    this.kPartyPresets   = 'MTG_PARTY_PRESETS';
    this.kCharacterSets  = 'MTG_CHARACTER_SETS';
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
    return this.getSetting(this.kAbstones) || [];
  }
  static set dataAbstone(val){
    this.changeSetting(this.kAbstones, val);
  }
  /*-------------------------------------------------------------------------*/
  static get partyPresets(){
    return this.getSetting(this.kPartyPresets) || [];
  }
  static set partyPresets(val){
    this.changeSetting(this.kPartyPresets, val);
  }
  /*-------------------------------------------------------------------------*/
  static get characterSets(){
    return this.getSetting(this.kCharacterSets) || [];
  }
  static set characterSets(val){
    this.changeSetting(this.kCharacterSets, val);
  }
  /*-------------------------------------------------------------------------*/
  static get buildEquipmentPerf(){
    return this.getSetting('EquipmentMethod') || 0;
  }
  static set buildEquipmentPerf(val){
    this.changeSetting('EquipmentMethod', val);
  }
  /*-------------------------------------------------------------------------*/
  static get buildAbstonePerf(){
    let ret = this.getSetting('EquipmentJewelMethod');
    if(ret == null){ ret = 1; }
    return ret;
  }
  static set buildAbstonePerf(val){
    this.changeSetting('EquipmentJewelMethod', val);
  }
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
    this.WeaponImageSet       = {};
    this.WeaponImageClip      = {};
    this.WeaponImageMap       = {};
    this.ArmorImageSet        = {};
    this.ArmorImageClip       = {};
    this.ArmorImageMap        = {};
    this.AccessoryImageSet    = {};
    this.AccessoryImageClip   = {};
    this.AccessoryImageMap    = {};
    this.SkillIconImageSet    = {};
    this.SkillIconImageClip   = {};
    this.SkillIconImageMap    = {};
    
    this.initialized = true;
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

  static loadFormationArchive(){
    this.__readyReq += 1;
    this.setupFormationCanvas();
    this.FormationData = {};
    this.loadAssetDataArchive('/MasterData/MFormationViewModel.json', (res)=>{
      for(let inf of res){
        this.FormationData[inf.Id] = inf;
      }
    });
  }

  static loadFieldSkillImageClip(idx=1){
    this.__readyReq += 1;
    $.ajax({
      url: `${ASSET_HOST}/Textures/Icons/Atlas/FieldSkills/field_skill-${idx}.plist`,
      success: (res) => { 
        AssetsManager.parseFieldSkillImageClip(res, idx);
        this.incReadyCounter();
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }

  static loadEquipmentArchive(){
    this.loadAssetDataArchive('/static/json/iconinfo.json', this.parseIconClipData);
    this.WeaponData     = {};
    this.ArmorData      = {};
    this.AccessoryData  = {};
    this.AbStoneData    = {};
    this.loadEmptyPlaceholders();
    this.loadEquipmentAssets(1, ITYPE_WEAPON);
    this.loadEquipmentAssets(1, ITYPE_ARMOR);
    this.loadEquipmentAssets(1, ITYPE_ACCESSORY);
    this.loadEquipmentData(ITYPE_WEAPON);
    this.loadEquipmentData(ITYPE_ARMOR);
    this.loadEquipmentData(ITYPE_ACCESSORY);
    this.loadEquipmentSkillGroup();
    this.loadUltimateWeapons();
    this.loadLevelSkillData();
    this.setupEquipmentCanvas();
    this.queueAssetRequest(()=>{
      this.loadEquipmentData(ITYPE_ABSTONE);
    });
  }

  static loadEmptyPlaceholders(){
    this.__readyReq += 7;
    this.emptyPlaceholder = {
      character: new Image(),
      weapon: new Image(),
      armor: new Image(),
      accessory: new Image(),
      abstone: new Image(),
      skill: new Image(),
      fieldskill: new Image(),
      rentalskill: new Image(),
    }
    this.emptyPlaceholder.character.src   = '/static/assets/character_empty.png';
    this.emptyPlaceholder.weapon.src      = '/static/assets/weapon_empty.png';
    this.emptyPlaceholder.armor.src       = '/static/assets/armor_empty.png';
    this.emptyPlaceholder.accessory.src   = '/static/assets/accessory_empty.png';
    this.emptyPlaceholder.abstone.src     = '/static/assets/abstone_empty.png';
    this.emptyPlaceholder.skill.src       = '/static/assets/skill_empty.png';
    this.emptyPlaceholder.fieldskill.src  = '/static/assets/ptskill_empty.png';
    this.emptyPlaceholder.rentalskill.src = '/static/assets/rental_empty.png';
    for(const img in this.emptyPlaceholder) {
      if(this.emptyPlaceholder.hasOwnProperty(img)){
        this.emptyPlaceholder[img].onload = ()=>{
          this.incReadyCounter();
        };
      }
    }
  }

  static loadEquipmentData(type){
    this.__readyReq += 1;
    let url = `${STATIC_HOST}/MasterData`;
    let ok_handler = null;
    if(type == ITYPE_WEAPON){
      url += `/MWeaponViewModel.json`;
      ok_handler = (res)=>{
        for(let dat of res){
          this.WeaponData[dat.Id] = dat;
        }
        this.incReadyCounter();
      };
    }
    else if(type == ITYPE_ARMOR){
      url += `/MArmorViewModel.json`;
      ok_handler = (res)=>{
        for(let dat of res){
          this.ArmorData[dat.Id] = dat;
        }
        this.incReadyCounter();
      };
    }
    else if(type == ITYPE_ACCESSORY){
      url += `/MAccessoryViewModel.json`;
      ok_handler = (res)=>{
        for(let dat of res){
          this.AccessoryData[dat.Id] = dat;
        }
        this.incReadyCounter();
      };
    }
    else if(type == ITYPE_ABSTONE){
      url += `/MAbilityStoneViewModel.json`;
      ok_handler = (res)=>{
        this.loadSeriesSetData();
        this.parseAbStoneData(res);
      };
    }
    $.ajax({
      url: url,
      success: ok_handler,
      error: handleAjaxError,
    })
  }

  static loadUltimateWeapons(){
    this.UltimateWeaponGroup = {};
    this.loadAssetDataArchive('/MasterData/MUltimateWeaponGroupViewModel.json', (res)=>{
      for(let inf of res){
        inf = inf.MUltimateWeapons;
        for(let wp of inf){
          this.UltimateWeaponGroup[wp.Id] = wp;
          this.UltimateWeaponGroup[wp.MWeaponId] = wp;
          this.UltimateWeaponGroup[wp.Id].AbilityGroups = {};
          this.UltimateWeaponGroup[wp.MWeaponId].AbilityGroups = {};
          for(let abg of wp.MUltimateWeaponPointAbilityGroups){
            for(let ability of abg.MUltimateWeaponPointAbilities){
              this.UltimateWeaponGroup[wp.Id].AbilityGroups[ability.Id] = ability;
              this.UltimateWeaponGroup[wp.MWeaponId].AbilityGroups[ability.Id] = ability;
            }
          }
        }
      }
    });
  }

  static loadEquipmentAssets(idx, type){
    this.__readyReq += 1;
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.onerror = ()=>{
      this.incReadyCounter();
    }
    if(type == ITYPE_WEAPON){
      image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Weapons/weapon-${idx}.png?`;
      image.onload = () => {
        this.WeaponImageSet[idx] = image;
        this.incReadyCounter();
        AssetsManager.loadEquipmentImageClip(idx, type);
        AssetsManager.loadEquipmentAssets(idx+1, type);
      };
    }
    else if(type == ITYPE_ARMOR){
      image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Armors/armor-${idx}.png?`;
      image.onload = () => {
        this.ArmorImageSet[idx] = image;
        this.incReadyCounter();
        AssetsManager.loadEquipmentImageClip(idx, type);
        AssetsManager.loadEquipmentAssets(idx+1, type);
      };
    }
    else if(type == ITYPE_ACCESSORY){
      image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Accessories/accessory-${idx}.png?`;
      image.onload = () => {
        this.AccessoryImageSet[idx] = image;
        this.incReadyCounter();
        AssetsManager.loadEquipmentImageClip(idx, type);
        AssetsManager.loadEquipmentAssets(idx+1, type);
      };
    }
  }

  static loadEquipmentImageClip(idx, type){
    this.__readyReq += 1;
    let url = `${ASSET_HOST}/Textures/Icons/Atlas`;
    if(type == ITYPE_WEAPON){
      url += `/Weapons/weapon-${idx}.plist`;
    }
    else if(type == ITYPE_ARMOR){
      url += `/Armors/armor-${idx}.plist`;
    }
    else if(type == ITYPE_ACCESSORY){
      url += `/Accessories/accessory-${idx}.plist`;
    }
    $.ajax({
      url: url,
      success: (res) => {
        AssetsManager.parseEquipmentImageClip(res, idx, type);
        this.incReadyCounter();
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }
  
  static loadLevelSkillData(){
    this.__readyReq += 1;
    $.ajax({
      url: `${STATIC_HOST}/MasterData/MLevelUpSkillViewModel.json`,
      success: (res) => {
        this.parseLevelSkillData(res);
        this.incReadyCounter();
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }

  static loadSeriesSetData(){
    this.__readyReq += 1;
    $.ajax({
      url: `${STATIC_HOST}/MasterData/MSeriesSetViewModel.json`,
      success: (res) => {
        this.parseSeriesSetData(res);
        this.incReadyCounter();
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }

  static loadEquipmentSkillGroup(){
    this.EquipmentSkillGroup = {};
    this.loadAssetDataArchive('/MasterData/MEquipmentSkillRateViewModel.json', (res)=>{
      for(let inf of res){
        if(!this.EquipmentSkillGroup.hasOwnProperty(inf.MEquipmentSkillRateGroupId)){
          this.EquipmentSkillGroup[inf.MEquipmentSkillRateGroupId] = [];
        }
        this.EquipmentSkillGroup[inf.MEquipmentSkillRateGroupId].push(inf);
      }
    });
  }

  static parseLevelSkillData(res){
    this.LevelSkillData = {};
    for(let i=0;i<res.length;++i){
      let dat = res[i];
      if(!this.LevelSkillData.hasOwnProperty(dat.MLevelUpSkillGroupId)){
        this.LevelSkillData[dat.MLevelUpSkillGroupId] = [];
      }
      this.LevelSkillData[dat.MLevelUpSkillGroupId][dat.Level] = dat;
    }
  }

  static parseSeriesSetData(res){
    this.SeriesSetData = {};
    for(let i=0;i<res.length;++i){
      let dat = res[i];
      this.SeriesSetData[dat.MSeriesSetId] = dat;
    }
    if(this.AbStoneData && this.SkillData){
      for(let id in this.AbStoneData){
        for(let gsid in this.AbStoneData[id].AbilityVariations){
          for(let mls of this.AbStoneData[id].AbilityVariations[gsid]){
            if(!mls){ continue; }
            let sk  = {};
            if(mls.MSkillId){
              sk = this.SkillData[mls.MSkillId];
            }
            else if(mls.MSeriesSetId){
              sk = this.SkillData[this.SeriesSetData[mls.MSeriesSetId].MSkill1Id];
              sk.seriesSetId = mls.MSeriesSetId;
            }
            this.AbStoneData[id].AbilityVariations[gsid][mls.Level] = sk;
          }
        }
      }
    }
  }

  static parseAbStoneData(res){
    for(let dat of res){
      dat.AbilityVariations = {};
      for(let gsid of dat.MLevelUpSkillGroupIds){
        dat.AbilityVariations[gsid] = [];
        for(let mls of AssetsManager.LevelSkillData[gsid]){
          if(!mls){ continue; }
          dat.AbilityVariations[gsid][mls.Level] = mls;
        }
      }
      this.AbStoneData[dat.Id] = dat;
    }
    this.incReadyCounter();
  }

  static loadCharacterAvatars(idx=1){
    this.__readyReq += 1;
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Layers/character-${idx}.png`;
    image.onload = () => {
      this.CharacterAvatarSet[idx] = image;
      AssetsManager.loadCharacterAvatars(idx+1);
      this.incReadyCounter();
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
      "/MasterData/MEventViewModel.json": this.parseEventData,
      "/MasterData/LevelsViewModel.json": this.parseLevelData,
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
    this.loadSkillIconAsset();
  }

  static loadSceneData(){
    let handlers = {
      "/MasterData/MSceneViewModel.json": this.parseSceneData,
      "/MasterData/MEventViewModel.json": this.parseEventData,
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

  static parseLevelData(res){
    this.CharacterLevelData = {};
    for(let i of res){
      if(!this.CharacterLevelData.hasOwnProperty(i.MCharacterId)){
        this.CharacterLevelData[i.MCharacterId] = Array(101);
      }
      this.CharacterLevelData[i.MCharacterId][i.Level] = i;
    }
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

  static parseEventData(res){
    this.EventData = {};
    for(let i=0;i<res.length;++i){
      let e = res[i];
      this.EventData[e.EventId] = e;
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

  static parseEquipmentImageClip(xml, idx, type){
    let root = xml.children[0].children[0];
    let data = this.parseXMLKeyValueDict(root);
    for(let i in data.frames){
      if(!data.frames.hasOwnProperty(i)){ continue; }
      switch(type){
        case ITYPE_WEAPON:
          this.WeaponImageClip[i] = data.frames[i];
          this.WeaponImageMap[i] = idx;
          break;
        case ITYPE_ARMOR:
          this.ArmorImageClip[i] = data.frames[i];
          this.ArmorImageMap[i] = idx;
          break;
        case ITYPE_ACCESSORY:
          this.AccessoryImageClip[i] = data.frames[i];
          this.AccessoryImageMap[i] = idx;
          break;
      }
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

  static setupFormationCanvas(){
    this.__readyReq += 1;
    this.FormationCanvas = document.createElement('canvas');
    this.FormationCanvas.width  = FormationBaseWidth;
    this.FormationCanvas.height = FormationBaseHeight;
    this.FormationContext = this.FormationCanvas.getContext('2d');
    this.FormationBaseImage = new Image();
    this.FormationBaseImage.src = '/static/assets/formation_base.png';
    this.FormationBaseImage.onload = ()=>{ this.incReadyCounter(); }
    this.FormationPosImage = {
      1: [],
      2: [],
      3: []
    };
    for(let i=1;i<=3;++i){
      for(let j=0;j<5;++j){
        this.__readyReq += 1;
        let img = new Image();
        img.src = `/static/assets/formation_position_${i}${j}.png`;
        img.onload = ()=>{ this.incReadyCounter(); }
        this.FormationPosImage[i].push(img);
      }
    }
    this.incReadyCounter();
  }

  static get FramePadding(){ return 4; }

  static createCharacterAvatarNode(id, frame_type=null, options={}){
    let container = $(document.createElement('div'));
    container.attr('class', options['container_class'] || 'avatar-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    $(img).attr('class', options['image_class'] || 'avatar');
    block.append(img);
    let avatar_key = `${id}.png`;
    let rect = null;
    if(this.CharacterAvatarClip.hasOwnProperty(avatar_key)){
      rect = this.CharacterAvatarClip[`${id}.png`].textureRect.flat();
    }
    else if(id < 0){
      rect = [0, 0, 96, 96];
    }
    else{
      console.warn(`Incomplete character data: ${id}`)
      return ;
    }
    let krarity = 'frm_thumb_common';
    if(!frame_type && this.CharacterData.hasOwnProperty(id)){
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
        case 5:
          krarity = 'frm_thumb_rare_ur';
          break;
      }
    }
    let rect2 = null;
    if(id >= 0){
      try{
        rect2 = this.IconClipData[krarity].content.rect;
      }catch(e){
        console.error(e);
      }
    }
    this.AvatarContext.clearRect(0, 0, this.AvatarCanvas.width, this.AvatarCanvas.height);
    if(rect){
      let src_img = null;
      if(id == -1){
        src_img = this.emptyPlaceholder.character;
      }
      else{
        let src_idx = this.CharacterAvatarMap[avatar_key];
        src_img = this.CharacterAvatarSet[src_idx];
      }
      clipImage(
        this.AvatarCanvas, src_img, img, 
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

  static createFieldSkillImageNode(id, frame_type=null, options={}){
    let container = $(document.createElement('div'));
    container.attr('class', 'fieldskill-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    $(img).attr('class', 'fieldskill-image');
    block.append(img);
    let image_key = `${id}.png`;
    let rect = null;
    if(this.FieldSkillImageClip.hasOwnProperty(image_key)){
      rect = this.FieldSkillImageClip[`${id}.png`].textureRect.flat();
    }
    else if(id < 0){
      rect = [0, 0, 204, 96];
    }
    else{
      console.warn(`Incomplete ptskill data: ${id}`)
      return ;
    }
    let krarity = 'frm_thumb__ptskill_rare_b';
    if(!frame_type && this.FieldSkillData.hasOwnProperty(id)){
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
        case 5:
          krarity = 'frm_thumb__ptskill_rare_ur';
          break;
      }
    }
    let rect2 = null;
    if(id >= 0){
      try{
        rect2 = this.IconClipData[krarity].content.rect;
      }catch(e){
        console.error(e);
      }
    }
    let canvas  = this.FieldSkillCanvas;
    let context = this.FieldSkillContext;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(rect){
      let src_img = null;
      let rotated = false;
      if(id == -1){
        src_img = this.emptyPlaceholder.fieldskill;
      }
      else if(id == -2){
        src_img = this.emptyPlaceholder.rentalskill;
      }
      else{
        let src_idx = this.FieldSkillImageMap[image_key];
        rotated = this.FieldSkillImageClip[image_key].textureRotated;
        if(rotated){
          context.translate(0, canvas.height);
        }
        src_img = this.FieldSkillImageSet[src_idx];
      }
      clipImage(
        canvas, src_img, img, 
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

  static setupEquipmentCanvas(){
    this.__readyReq += 1;
    this.EquipmentCanvas  = document.createElement("canvas");
    this.EquipmentCanvas.width  = CharacterAvatarWidth;
    this.EquipmentCanvas.height = CharacterAvatarHeight;
    this.EquipmentContext = this.EquipmentCanvas.getContext('2d');
    this.incReadyCounter();
  }

  /**
   * WARNING: Avatar/Weapon/Armor/Accessory are shared with same drawing canvas
   */
  static createEquipmentImageNode(id, type, frame_type=null, options={}){
    let container = $(document.createElement('div'));
    container.attr('class', options['container_class'] || 'avatar-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    $(img).attr('class', options['image_class'] || 'avatar');
    block.append(img);
    let image_key = `${id}.png`;
    let rect = null;
    let clip_data = {};
    let equipment_data = {};
    let equipment_map  = {};
    let equipment_set  = {};
    switch(type){
      case ITYPE_WEAPON:
        clip_data = this.WeaponImageClip;
        equipment_data = this.WeaponData;
        equipment_set = this.WeaponImageSet;
        equipment_map = this.WeaponImageMap;
        break;
      case ITYPE_ARMOR:
        clip_data = this.ArmorImageClip;
        equipment_data = this.ArmorData;
        equipment_set = this.ArmorImageSet;
        equipment_map = this.ArmorImageMap;
        break;
      case ITYPE_ACCESSORY:
        clip_data = this.AccessoryImageClip;
        equipment_data = this.AccessoryData;
        equipment_set = this.AccessoryImageSet;
        equipment_map = this.AccessoryImageMap;
        break;
    }
    if(clip_data.hasOwnProperty(image_key)){
      rect = clip_data[`${id}.png`].textureRect.flat();
    }
    else if(id < 0){
      rect = [0, 0, 96, 96];
    }
    else{
      console.warn(`Incomplete equipment data: ${id} (type=${type})`)
      return ;
    }
    let krarity = 'frm_thumb_common';
    if(!frame_type && equipment_data.hasOwnProperty(id)){
      switch(equipment_data[id].EquipmentRarity){
        case 2:
          krarity = 'frm_thumb_rare_a';
          break;
        case 3:
          krarity = 'frm_thumb_rare_s';
          break;
        case 4:
          krarity = 'frm_thumb_rare_ss';
          break;
        case 5:
          krarity = 'frm_thumb_rare_ur';
          break;
      }
    }
    let rect2 = null;
    if(id >= 0){
      try{
        rect2 = this.IconClipData[krarity].content.rect;
      }catch(e){
        console.error(e);
      }
    }
    this.AvatarContext.clearRect(0, 0, this.AvatarCanvas.width, this.AvatarCanvas.height);
    if(rect){
      let src_img = null;
      if(id == -ITYPE_WEAPON){
        src_img = this.emptyPlaceholder.weapon;
      }
      else if(id == -ITYPE_ARMOR){
        src_img = this.emptyPlaceholder.armor;
      }
      else if(id == -ITYPE_ACCESSORY){
        src_img = this.emptyPlaceholder.accessory;
      }
      else if(id == -ITYPE_ABSTONE){
        src_img = this.emptyPlaceholder.abstone;
      }
      else if(id == -ITYPE_SKILL){
        src_img = this.emptyPlaceholder.skill;
      }
      else{
        let src_idx = equipment_map[image_key];
        src_img = equipment_set[src_idx]
      }
      clipImage(
        this.AvatarCanvas, src_img, img, 
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

  static createFormationNode(id, options={}){
    let container = $(document.createElement('div'));
    container.attr('class', options['container_class'] || 'avatar-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    $(img).attr('class', options['image_class'] || 'equipment-image');
    block.append(img);
    this.FormationContext.clearRect(0, 0, this.FormationCanvas.width, this.FormationCanvas.height);
    clipImage(
      this.FormationCanvas, this.FormationBaseImage, img, 
      0, 0, FormationBaseWidth, FormationBaseHeight,
      0, 0
    );
    let data  = this.FormationData[id];
    let slots = data.MFormationSlots;
    let sx = 2, sy = 2;
    let dx = 19, dy = 19;
    for(let inf of slots){
      let cx = sx + dx*inf.X;
      let cy = sy + dy*inf.Y;
      let pos_img = this.FormationPosImage[data.Rank][inf.SlotNo-1];
      clipImage(
        this.FormationCanvas, pos_img, img,
        0, 0, FormationPosWidth, FormationPosHeight,
        cx, cy
      )
    }
    return container;
  }

  static loadSkillIconAsset(idx=1){
    this.__readyReq += 2;
    let image = new Image();
    image.crossOrigin = "anonymous";
    image.src = `${ASSET_HOST}/Textures/Icons/Atlas/Skills/skill-${idx}.png`;
    image.onload = () => {
      this.SkillIconImageSet[idx] = image;
      this.incReadyCounter();
      AssetsManager.loadSkillIconClip(idx);
      AssetsManager.loadSkillIconAsset(idx+1);
    };
    image.onerror = ()=>{
      this.incReadyCounter();
    }
    this.SkillIconFrame = new Image();
    this.SkillIconFrame.src = '/static/assets/skill_frame.png';
    this.SkillIconFrame.onload = ()=>{ this.incReadyCounter(); }
  }

  static loadSkillIconClip(idx=1){
    this.__readyReq += 1;
    $.ajax({
      url: `${ASSET_HOST}/Textures/Icons/Atlas/Skills/skill-${idx}.plist`,
      success: (res) => { 
        AssetsManager.parseSkillIconClip(res, idx);
        this.incReadyCounter();
      },
      error: (res)=>{
        if(res.status == 404){this.incReadyCounter();}
        else{ handleAjaxError(res); }
      },
    });
  }

  static parseSkillIconClip(xml, idx){
    let root = xml.children[0].children[0];
    let data = this.parseXMLKeyValueDict(root);
    for(let i in data.frames){
      if(!data.frames.hasOwnProperty(i)){ continue; }
      this.SkillIconImageClip[i] = data.frames[i];
      this.SkillIconImageMap[i] = idx;
    }
  }

  /**
   * WARNING: Shared canvas with avatar and equpiments
   */
  static createSkillIconImageNode(id, options={}){
    let container = $(document.createElement('div'));
    container.attr('class', options['container_class'] || 'avatar-container');
    let block = $(document.createElement('a'));
    container.append(block);
    let img = document.createElement('img');
    $(img).attr('class', options['image_class'] || 'equipment-image');
    block.append(img);
    let image_key = `${id}.png`;
    if(AssetsManager.SkillData.hasOwnProperty(id) && AssetsManager.SkillData[id].AssetKey){
      image_key = AssetsManager.SkillData[id].AssetKey+'.png';
    }
    let rect = null;
    if(this.SkillIconImageClip.hasOwnProperty(image_key)){
      rect = this.SkillIconImageClip[image_key].textureRect.flat();
    }
    else if(id < 0){
      rect = [0, 0, 96, 96];
    }
    else{
      console.warn(`Incomplete skill data: ${id}`)
      return ;
    }
    let canvas  = this.AvatarCanvas;
    let context = this.AvatarContext;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if(rect){
      let src_img = null;
      if(id == -1){
        src_img = this.emptyPlaceholder.skill;
      }
      else{
        let src_idx = this.SkillIconImageMap[image_key];
        src_img = this.SkillIconImageSet[src_idx];
        clipImage(
          this.AvatarCanvas, this.SkillIconFrame, img, 
          0, 0, SkillIconFrameWidth, SkillIconFrameHeight,
          0, 0
        );
      }
      clipImage(
        this.AvatarCanvas, src_img, img, 
        rect[0], rect[1], rect[2], rect[3],
        2, 2,
        CharacterAvatarWidth, CharacterAvatarHeight,
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


/**---------------------------------------------------------------------------
 * > ItemManager:
 *    The static class that manages items.
 * @namespace
 */
class ItemManager{
  /*-------------------------------------------------------------------------*/
  constructor(){
    throw new Error("This is a static class")
  }

  /**
   * Get list of weapon ability stones that only has highest level of one ability
   */
  static getPureWeaponAbstones(){
    if(!this.pureWeaponAbstones){
      this.pureWeaponAbstones = [];
      for(let i in AssetsManager.AbStoneData){
        if(!AssetsManager.AbStoneData.hasOwnProperty(i)){ continue; }
        let astone = AssetsManager.AbStoneData[i];
        if(astone.AbilityStoneEquipType != ITYPE_WEAPON){ continue; }
        for(let aid in astone.AbilityVariations){
          if(!astone.AbilityVariations.hasOwnProperty(aid)){ continue; }
          let mskills = astone.AbilityVariations[aid];
          let tskill = mskills[mskills.length-1];
          let dat = clone(tskill)
          if(tskill.seriesSetId){
            if(this.pureWeaponAbstones.find((m)=>m.seriesSetId==tskill.seriesSetId)){
              continue;
            }
            dat = clone(astone);
            dat.Description = '';
            let sdat = AssetsManager.SeriesSetData[tskill.seriesSetId];
            for(let i=1;i<10;++i){
              let skname = `MSkill${i}Id`
              if(!sdat.hasOwnProperty(skname)){ break; }
              dat.Description += `[${i}] `+AssetsManager.SkillData[sdat[skname]].Name + ': ';
              dat.Description += AssetsManager.SkillData[sdat[skname]].Description + '\n';
            }
            dat.Id *= 0.001;
            dat.seriesSetId = tskill.seriesSetId;
          }
          dat.MAbilityStone = clone(astone);
          this.pureWeaponAbstones.push(dat);
        }
      }
    }
    return this.pureWeaponAbstones;
  }

  /**
   * Get list of armor ability stones that only has highest level of one ability
   */
  static getPureArmorAbstones(){
    if(!this.pureArmorAbstones){
      this.pureArmorAbstones = [];
      for(let i in AssetsManager.AbStoneData){
        if(!AssetsManager.AbStoneData.hasOwnProperty(i)){ continue; }
        let astone = AssetsManager.AbStoneData[i];
        if(astone.AbilityStoneEquipType != ITYPE_ARMOR){ continue; }
        for(let aid in astone.AbilityVariations){
          if(!astone.AbilityVariations.hasOwnProperty(aid)){ continue; }
          let mskills = astone.AbilityVariations[aid];
          let tskill = mskills[mskills.length-1];
          let dat = clone(tskill)
          if(tskill.seriesSetId){
            if(this.pureArmorAbstones.find((m)=>m.seriesSetId==tskill.seriesSetId)){
              continue;
            }
            dat = clone(astone);
            dat.Description = '';
            let sdat = AssetsManager.SeriesSetData[tskill.seriesSetId];
            for(let i=1;i<10;++i){
              let skname = `MSkill${i}Id`
              if(!sdat.hasOwnProperty(skname)){ break; }
              dat.Description += `[${i}] `+AssetsManager.SkillData[sdat[skname]].Name + ': ';
              dat.Description += AssetsManager.SkillData[sdat[skname]].Description + '\n';
            }
            dat.Id *= 0.001;
            dat.seriesSetId = tskill.seriesSetId;
          }
          dat.MAbilityStone = clone(astone);
          this.pureArmorAbstones.push(dat);
        }
      }
    }
    return this.pureArmorAbstones;
  }

  /**
   * Get list of accessory ability stones that only has highest level of one ability
   */
  static getPureAccessoryAbstones(){
    if(!this.pureAccessoryAbstones){
      this.pureAccessoryAbstones = [];
      for(let i in AssetsManager.AbStoneData){
        if(!AssetsManager.AbStoneData.hasOwnProperty(i)){ continue; }
        let astone = AssetsManager.AbStoneData[i];
        if(astone.AbilityStoneEquipType != ITYPE_ACCESSORY){ continue; }
        for(let aid in astone.AbilityVariations){
          if(!astone.AbilityVariations.hasOwnProperty(aid)){ continue; }
          let mskills = astone.AbilityVariations[aid];
          let tskill = mskills[mskills.length-1];
          if(!tskill){
            continue;
          }
          let dat = clone(tskill)
          if(tskill.seriesSetId){
            if(this.pureAccessoryAbstones.find((m)=>m.seriesSetId==tskill.seriesSetId)){
              continue;
            }
            dat = clone(astone);
            dat.Description = '';
            let sdat = AssetsManager.SeriesSetData[tskill.seriesSetId];
            for(let i=1;i<10;++i){
              let skname = `MSkill${i}Id`
              if(!sdat.hasOwnProperty(skname)){ break; }
              dat.Description += `[${i}] `+AssetsManager.SkillData[sdat[skname]].Name + ': ';
              dat.Description += AssetsManager.SkillData[sdat[skname]].Description + '\n';
            }
            dat.Id *= 0.001;
            dat.seriesSetId = tskill.seriesSetId;
          }
          dat.MAbilityStone = clone(astone);
          this.pureAccessoryAbstones.push(dat);
        }
      }
    }
    return this.pureAccessoryAbstones;
  }

  static isUltimateWeapon(id){
    return Object.keys(AssetsManager.UltimateWeaponGroup).includes(`${id}`);
  }

  /**
   * Return list of skill ids belong to a character cross all layers
   */
  static getCharacterSkills(id){
    let chid = parseInt(id/1000);
    let layers = [];
    let rarity = 200, cnt = 1;
    while(rarity < 500){
      let _id = chid*1000+rarity+cnt;
      if(AssetsManager.CharacterData.hasOwnProperty(_id)){
        layers.push(_id)
        cnt += 1;
      }
      else{
        rarity += 100;
        cnt = 1;
      }
    }
    let ret = [];
    for(let lid of layers){
      ret = ret.concat(this.getLayerSkills(lid));
    }
    return ret;
  }

  static getLayerSkills(id){
    let data = AssetsManager.CharacterData[id];
    let askills = [data.MSkill1Id, data.MSkill2Id, data.MSkill3Id];
    if(AssetsManager.TrainBoardData.hasOwnProperty(id)){
      let train_boards = AssetsManager.TrainBoardData[id].TrainBoardOarders;
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
}