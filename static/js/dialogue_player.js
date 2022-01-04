/**
 * > DialoguePlayer:
 *    The static class that handles the flow and audio in story
 * @namespace
 */
class DialoguePlayer{
  /*-------------------------------------------------------------------------*/
  constructor(){
    throw new Error("This is a static class")
  }
  /**
   * > Set up and load related files of scene
   * @param {object} data - Scene data
   */
  static setup(data){
    this.data = data;
    this.dialogues = data.MSceneDetailViewModel;
    this.sceneId = data.MSceneId;
    this.initAudioHandler();
    this.releaseAudios();
    this.loadSceneVocies();
    this.currentBGM = [];
    this.currentSE  = [];
    this.currentBGS = [];
  }

  static loadSceneVocies(){
    for(let i=0;i<this.dialogues.length;++i){
      let dialog = this.dialogues[i];
      let voice = dialog.VoiceFileName;
      if(!voice){continue;}
      this.__se.push(voice);
      this.audios[voice] = new Howl({
        src: [`https://assets.mist-train-girls.com/production-client-web-assets/Sounds/Voices/Scenarios/Mains/m_${this.sceneId}/${voice}.mp3`],
        volume: DataManager.getSetting(DataManager.kVolume)[1],
      });
      let handlers = Object.keys(this.audioHandler);
      for(let i in handlers){
        let key = handlers[i];
        this.audios[voice].on(key, ()=>{
          if(DialoguePlayer.audioHandler[key].hasOwnProperty(voice)){
            DialoguePlayer.audioHandler[key][voice].apply(window);
          }
        });
      }
    }
  }

  static initAudioHandler(){
    this.audioHandler = {
      'end': {},
      'stop': {},
      'load': {},
      'loaderror': {},
      'playerror': {},
      'play': {},
      'pause': {},
      'mute': {},
      'seek': {},
      'fade': {},
      'unlock': {},
      'rate': {},
      'volume': {}
    };
  }

  static releaseAudios(){
    this.audios = {};
    this.__se = [];
    this.__bgm = [];
    this.__bgs = [];
  }

  static play(id){
    let audio = this.audios[id];
    if(this.__bgs.includes(id)){
      this.audios[id].volume(DataManager.getSetting(DataManager.kVolume)[2]);
      this.currentBGS.push(audio);
      audio.on('end', ()=>{this.currentBGS.splice(audio, 1);});
      audio.on('stop', ()=>{this.currentBGS.splice(audio, 1);});
    }
    else if(this.__se.includes(id)){
      this.audios[id].volume(DataManager.getSetting(DataManager.kVolume)[1]);
      this.currentSE.push(audio);
      audio.on('end', ()=>{this.currentSE.splice(audio, 1);});
      audio.on('stop', ()=>{this.currentSE.splice(audio, 1);});
      let rate = DataManager.getSetting('dialogueSpeed');
      if(rate){ audio.rate(rate); }
    }
    else if(this.__bgm.includes(id)){
      this.audios[id].volume(DataManager.getSetting(DataManager.kVolume)[0]);
      this.currentBGM.push(audio);
      audio.on('end', ()=>{this.currentBGM.splice(audio, 1);});
      audio.on('stop', ()=>{this.currentBGM.splice(audio, 1);});
    }
    return audio.play();
  }

  static pause(id){
    return this.audios[id].pause();
  }

  static stop(id){
    return this.audios[id].stop();
  }

  static isPlaying(id){
    return this.audios[id].seek() != 0;
  }

  static registerAudioListener(type, key, proc){
    this.audioHandler[type][key] = proc;
  }

  static removeAudioListener(type, key){
    delete this.audioHandler[type][key];
  }

  static updateVolumes(){
    let tracks = [this.currentBGM, this.currentSE, this.currentBGS];
    if(!this.currentBGM){ return ;}
    let vols = DataManager.getSetting(DataManager.kVolume);
    for(let i=0;i<3;++i){
      for(let j=0;j<tracks[i].length;++j){
        tracks[i][j].volume(vols[i]);
      }
    }
  }

}