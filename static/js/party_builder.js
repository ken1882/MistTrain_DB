const BICON_ARROW_UPDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
</svg>`;

let Inventory = null;

function init(){
    AssetsManager.loadCharacterAssets();
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    AssetsManager.loadEquipmentArchive();
    setup();
}

function attachInventorySelector(node, type){
    node.addClass('clickable');
    node.click((e)=>{
        window.currentSelectedNode = e.target;
        Inventory.show(type);
    });
}

function addPartyPlaceholders(){
    const PT_RENTAL = -2
    const PT_SELF   = -1
    for(let i=1;i<=4;++i){
        let node = $(`#fieldskill-${i}`);
        let t = (i == 4 ? PT_RENTAL : PT_SELF)
        let label = $(document.createElement('p'));
        label.attr('id', `label-fieldskill-${i}`);
        let icon = AssetsManager.createFieldSkillImageNode(t);
        attachInventorySelector(icon, ITYPE_FIELD_SKILL);
        node.append(icon);
        node.append(label);
    }
    let img = new Image();
    img.src = '/static/assets/formation_base.png';
    $('#formation-container').append(img);
    for(let i=1;i<=5;++i){
        let tbody = $('#party-table-body');
        let row = $(document.createElement('tr'));
        for(let j=0;j<10;++j){
            let cell = $(document.createElement('td'));
            let label = $(document.createElement('p'));
            let icon = null;
            cell.addClass('party-cell');
            switch(j){
                case 0:
                    cell.attr('id', `character-${i}`);
                    icon = AssetsManager.createCharacterAvatarNode(-1);
                    attachInventorySelector(icon, ITYPE_CHARACTER);
                    cell.append(icon);
                    // cell.append(document.createElement('br'));
                    cell.css('width', '280px');
                    let plv = $(document.createElement('span'));
                    plv.text(`${Vocab['Lv']} : `);
                    cell.append(plv);
                    let lv = $(document.createElement('input'));
                    lv.attr('id', `lv-character-${i}`);
                    lv.attr('type', 'number').attr('value', '50').css('width', '80px');
                    cell.append(lv);
                    break;
                case 1:
                    cell.attr('id', `weapon-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_WEAPON, ITYPE_WEAPON);
                    attachInventorySelector(icon, ITYPE_WEAPON);
                    cell.append(icon);
                    label.attr('id', `weapon-${i}-label`);
                    cell.append(label);
                    break;
                case 2:
                    cell.attr('id', `abstone-weapon-${i}`);
                    cell.addClass('abstone-cell');
                    label.attr('id', `abstone-weapon-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null,
                        {
                            'container_class': 'abstone-container',
                            'image_class': 'abstone-add-icon'
                        }
                    );
                    attachInventorySelector(abs, ITYPE_ABSTONE);
                    cell.append(abs);
                    break;
                case 3:
                    cell.attr('id', `armor-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_ARMOR, ITYPE_ARMOR);
                    attachInventorySelector(icon, ITYPE_ARMOR);
                    cell.append(icon);
                    label.attr('id', `armor-${i}-label`);
                    cell.append(label);
                    break;
                case 4:
                    cell.attr('id', `abstone-armor-${i}`);
                    cell.addClass('abstone-cell');
                    label.attr('id', `abstone-armor-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null,
                        {
                            'container_class': 'abstone-container',
                            'image_class': 'abstone-add-icon'
                        }
                    );
                    attachInventorySelector(abs, ITYPE_ABSTONE);
                    cell.append(abs);
                    break;
                case 5:
                    cell.attr('id', `accessory-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_ACCESSORY, ITYPE_ACCESSORY);
                    attachInventorySelector(icon, ITYPE_ACCESSORY);
                    cell.append(icon);
                    label.attr('id', `accessory-${i}-label`);
                    cell.append(label);
                    break;
                case 6:
                    cell.attr('id', `abstone-accessory-${i}`);
                    cell.addClass('abstone-cell');
                    label.attr('id', `abstone-accessory-${i}-label`);
                    cell.append(label);
                    var abs = AssetsManager.createEquipmentImageNode(
                        -ITYPE_ABSTONE, ITYPE_ABSTONE,
                        null,
                        {
                            'container_class': 'abstone-container',
                            'image_class': 'abstone-add-icon'
                        }
                    );
                    attachInventorySelector(abs, ITYPE_ABSTONE);
                    cell.append(abs);
                    break;
                case 7:
                    cell.attr('id', `add-skill-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_SKILL, ITYPE_SKILL);
                    // attachInventorySelector(icon, ITYPE_SKILL);
                    cell.append(icon);
                    label.attr('id', `add-skill-${i}-label`);
                    cell.append(label);
                    break;
                case 8:
                    const SP_HOLDER = [4, 6, 10, 0];
                    cell.css('width', '240px');
                    for(let k=0;k<4;++k){
                        let psk = $(document.createElement('span'));
                        psk.text(`${Vocab['SP']} ${k+1}: `);
                        cell.append(psk);
                        let inp = $(document.createElement('input'));
                        inp.attr('type', 'number');
                        inp.css('width', '50px');
                        inp.attr('value', SP_HOLDER[k]);
                        psk.append(inp);
                        if(k==1){ cell.append(document.createElement('br')); }
                        else{
                            let spacing = $(document.createElement('span'));
                            spacing.text(' ');
                            cell.append(spacing);
                        }
                    }
                    break;
                case 9:
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
    Inventory = new Game_Inventory('inventory');
}

(function(){
    window.addEventListener("load", init);
})();