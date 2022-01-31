/**----------------------------------------------------------------------------
 * > The module that handles vocabularies
 * 
 * @namespace Vocab
 */
 class Vocab{
  /**--------------------------------------------------------------------------
   * @constructor
   */
  constructor(){
    throw new Error('this is a static class');
  }
  /**--------------------------------------------------------------------------
   * Setup
   */
  static initialize(){
    this.SupportedLanguages = [];
    this.Language   = DataManager.language;
    this.FolderPath = "/static/json";
    this.ready      = false;
    this._ready_cnt = 0
    this.loadSupportedLanguages();
    this.loadLanguageFile();
  }
  /*-------------------------------------------------------------------------*/
  static loadSupportedLanguages(){
    var path = `${Vocab.FolderPath}/languages.json`;
    processJSON(path, function(result){
      let list = JSON.parse(result);
      for(let i in list){
        Vocab.SupportedLanguages.push(list[i]);
      }
      Vocab._ready_cnt += 1;
      if(Vocab._ready_cnt == 2){
        Vocab.ready = true;
      }
    }, this.onLoadError); 
  }
  /*-------------------------------------------------------------------------*/
  static loadLanguageFile(){
    var path = Vocab.FolderPath + '/' + Vocab.Language + '.json';
    processJSON(path, function(result){
      let dict = JSON.parse(result);
      for(let key in dict){
        Vocab[key] = dict[key];
      }
      debug_log("Vocab loaded");
      Vocab.translatePageCotent();
      Vocab._ready_cnt += 1;
      if(Vocab._ready_cnt == 2){
        Vocab.ready = true;
      }
    }, this.onLoadError);
  }
  /*-------------------------------------------------------------------------*/
  static onLoadError(depth=0){
    DataManager.changeSetting(DataManager.kLanguage, DataManager.DefaultLanguage);
    Vocab.Language = DataManager.language;
    if(depth < 3){
      Vocab.loadLanguageFile();
    }
    else{
      alert("Service unavailable, please come back later.")
    }
  }
  /*-------------------------------------------------------------------------*/
  static translatePageCotent(){
    let nodes = $('*');
    for(let i in nodes){
      let node = nodes[i];
      if(!node.attributes){continue;}
      let label = node.attributes.label;
      if(!label || label.value.substr(0,2) != 'l-'){continue;}
      let key = label.value.split('-')[1];
      let idx = label.value.split('-')[2];
      if(idx){ node.innerText = Vocab[key][idx]; }
      else{ node.innerText = Vocab[key]; }
    }
  }
  /*-------------------------------------------------------------------------*/
  static get currentLanguageName(){
    let key = DataManager.language;
    for(let i in this.SupportedLanguages){
      if(this.SupportedLanguages[i].key == key){
        return this.SupportedLanguages[i].name;
      }
    }
  }
  /*-------------------------------------------------------------------------*/
  static isReady(){
    return this.ready;
  }
  /*-------------------------------------------------------------------------*/
}