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