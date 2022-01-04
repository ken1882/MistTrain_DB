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
    this.releaseAudios();
    this.loadSceneAudio();
    this.currentBGM = null;
    this.currentSE  = [];
    this.currentBGS = [];
  }

  static loadSceneAudio(){
    for(let i=0;i<this.dialogues.length;++i){
      let dialog = this.dialogues[i];
      let voice = dialog.VoiceFileName;
      let bgm = dialog.BGM;
      if(!voice && !bgm){continue;}
      if(voice && !this.audios.hasOwnProperty(voice)){
        this.__se.push(voice);
        this.audios[voice] = new Howl({
          src: [`https://assets.mist-train-girls.com/production-client-web-assets/Sounds/Voices/Scenarios/Mains/m_${this.sceneId}/${voice}.mp3`],
          volume: DataManager.getSetting(DataManager.kVolume)[1],
          onloaderror: (audio_id, errno)=>{
            console.error(`Unable to load audio ${audio_id} ERRNO=(${errno})`);
            delete this.audios[voice];
          }
        });
      }
      if(bgm && !this.audios.hasOwnProperty(bgm)){
        this.__bgm.push(bgm);
        this.audios[bgm] = new Howl({
          src: [`https://assets.mist-train-girls.com/production-client-web-assets/Sounds/Bgms/Adv/${bgm}.mp3`],
          volume: DataManager.getSetting(DataManager.kVolume)[0],
          onloaderror: (audio_id, errno)=>{
            console.error(`Unable to load audio ${audio_id} ERRNO=(${errno})`);
            delete this.audios[bgm];
          }
        });
      }
    }
  }

  static releaseAudios(){
    this.audios = {};
    this.__se = [];
    this.__bgm = [];
    this.__bgs = [];
  }

  static play(id){
    let audio = this.audios[id];
    if(!audio){ return null; }
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
      this.currentBGM = audio;
      audio.on('end', ()=>{this.currentBGM = null;});
      audio.on('stop', ()=>{this.currentBGM = null;});
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

  static registerAudioListener(type, key, proc, once=false){
    if(once){
      this.audios[key].once(type, proc);
    }
    else{
      this.audios[key].on(type, proc);
    }
  }

  static removeAudioListener(type, key, proc=null){
    if(proc){
      this.audios[key].off(type, proc);
    }
    else{
      this.audios[key].off(type);
    }
  }

  static updateVolumes(){
    let tracks = [[this.currentBGM], this.currentSE, this.currentBGS];
    if(!this.currentSE){ return ;}
    let vols = DataManager.getSetting(DataManager.kVolume);
    for(let i=0;i<3;++i){
      for(let j=0;j<tracks[i].length;++j){
        tracks[i][j].volume(vols[i]);
      }
    }
  }

  static setBGM(id){
    this.currentBGM = this.audios[id];
    return this.currentBGM;
  }

  static fadeInBGM(id, duration=3000){
    let vols = DataManager.getSetting(DataManager.kVolume);
    let audio = this.audios[id];
    audio.volume(0);
    audio.loop(true);
    this.currentBGM = audio;
    audio.play();
    audio.fade(0.0, vols[0], duration);
    return audio;
  }
  
  static fadeOutBGM(id=null, duration=3000){
    let bgm = this.currentBGM;
    if(id){ bgm = this.audios[id]; }
    if(!bgm){ return; }
    bgm.loop(false);
    bgm.once('fade', ()=>{ bgm.stop(); });
    bgm.fade(bgm.volume(), 0.0, duration);
    return bgm;
  }
}