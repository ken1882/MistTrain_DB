const BICON_ARROW_UPDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
</svg>`;

function init(){
    AssetsManager.loadCharacterAssets();
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    AssetsManager.loadEquipmentArchive();
    setup();
}

function addPartyPlaceholders(){
    for(let i=1;i<=4;++i){
        let node = $(`#fieldskill-${i}`);
        node.append(AssetsManager.createFieldSkillImageNode(i==4?-2:-1));
    }
    for(let i=1;i<=5;++i){
        let tbody = $('#party-table-body');
        let row = $(document.createElement('tr'));
        for(let j=0;j<9;++j){
            let cell = $(document.createElement('td'));
            let label = document.createElement('p');
            switch(j){
                case 0:
                    cell.attr('id', `character-${i}`);
                    cell.append(AssetsManager.createCharacterAvatarNode(-1));
                    cell.attr('id', `character-${i}-label`);
                    cell.append(label);
                    break;
                case 1:
                    cell.attr('id', `weapon-${i}`);
                    cell.append(AssetsManager.createEquipmentImageNode(-ITYPE_WEAPON, ITYPE_WEAPON));
                    cell.attr('id', `weapon-${i}-label`);
                    cell.append(label);
                    break;
                case 2:
                    cell.attr('id', `abstone-weapon-${i}`);
                    cell.attr('id', `abstone-weapon-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null, 'abstone-add-icon'
                    );
                    cell.append(abs);
                    break;
                case 3:
                    cell.attr('id', `armor-${i}`);
                    cell.append(AssetsManager.createEquipmentImageNode(-ITYPE_ARMOR, ITYPE_ARMOR));
                    cell.attr('id', `armor-${i}-label`);
                    cell.append(label);
                    break;
                case 4:
                    cell.attr('id', `abstone-armor-${i}`);
                    cell.attr('id', `abstone-armor-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null, 'abstone-add-icon'
                    );
                    cell.append(abs);
                    break;
                case 5:
                    cell.attr('id', `accessory-${i}`);
                    cell.append(AssetsManager.createEquipmentImageNode(-ITYPE_ACCESSORY, ITYPE_ACCESSORY));
                    cell.attr('id', `accessory-${i}-label`);
                    cell.append(label);
                    break;
                case 6:
                    cell.attr('id', `abstone-accessory-${i}`);
                    cell.attr('id', `abstone-accessory-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null, 'abstone-add-icon'
                    );
                    cell.append(abs);
                    break;
                case 7:
                    cell.attr('id', `add-skill-${i}`);
                    cell.append(AssetsManager.createEquipmentImageNode(-ITYPE_SKILL, ITYPE_SKILL));
                    cell.attr('id', `add-skill-${i}-label`);
                    cell.append(label);
                    break;
                case 8:
                    cell.html(`
                        <a class="btn btn-primary btn-handler" type="button">
                        ${BICON_ARROW_UPDOWN}
                        </a>
                    `);
                    break;
            }
            row.append(cell);
        }
        tbody.append(row);
    }
}

function onMemberMove(e, u){

}

function setup(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setup, 300);
    }
    addPartyPlaceholders();
    $('#party-table-body').sortable({
        handle: '.btn-handler',
        change: onMemberMove,
    });
    $("#loading-indicator").remove();
    $("#party-index").css('display', '');
}

(function(){
    window.addEventListener("load", init);
})();