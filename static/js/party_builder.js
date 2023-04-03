function init(){
    AssetsManager.loadCharacterAssets();
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    AssetsManager.loadEquipmentArchive();
    setup();
}

function setup(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setup, 300);
    }
    
    $("#loading-indicator").remove();
}

(function(){
    window.addEventListener("load", init);
})();