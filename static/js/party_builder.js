const BICON_ARROW_UPDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
</svg>`;

const BICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-square" viewBox="0 0 16 16">
<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
</svg>`;

let Inventory   = null;
let ActionModal = null;
let currentSelectedNode = null;
let currentSelectedId   = 0;
let currentAddSkillNode = null;
let emptyPlaceholder    = {};
let characterLevel      = [50, 50, 50, 50, 50, 50];
let partyData = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {},
};


function init(){
    AssetsManager.loadCharacterAssets();
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    AssetsManager.loadEquipmentArchive();
    AssetsManager.loadFormationArchive();
    setup();
}

function attachInventorySelector(node, type){
    node.addClass('clickable');
    node.click((_)=>{
        let idx = todigits(node[0].parentElement.id);
        if(type == ITYPE_SKILL){
            if(!partyData[idx].hasOwnProperty('character') || !partyData[idx].character){
                alert(Vocab['SelectCharacterFirst']);
                return ;
            }
            let skill_ids = ItemManager.getCharacterSkills(partyData[idx].character);
            let ar = [];
            let ch = AssetsManager.CharacterData[partyData[idx].character];
            let owned_skills = [
                ch.MSkill1Id,
                ch.MSkill2Id,
                ch.MSkill3Id,
            ];
            for(let id of skill_ids){
                if(!owned_skills.includes(id)){
                    ar.push(id);
                }
            }
            currentAddSkillNode = Inventory.loadSkill(ar);
        }
        currentSelectedNode = node;
        Inventory.show(type);
        let filter = {}
        if(partyData[idx].character){
            filter = {
                'WeaponEquipType': AssetsManager.CharacterData[partyData[idx].character].MCharacterBase.WeaponEquipType,
            }
        }
        Inventory.applyFilter(filter);
    });
}

function createLevelInput(i){
    let plv = $(document.createElement('span'));
    plv.text(`${Vocab['Lv']} : `);
    let lv = $(document.createElement('input'));
    lv.attr('id', `lv-character-${i}`).css('width', '80px');
    lv.attr('type', 'number').attr('value', '50').attr('min', '1').attr('max', '100');
    lv.change((e)=>{
        let minn = parseInt(e.target.min);
        let maxn = parseInt(e.target.max);
        let val = parseInt(todigits(e.target.value) || '0');
        val = Math.min(maxn, Math.max(minn, val));
        e.target.value = val;
        characterLevel[i] = val;
    });
    lv.val(characterLevel[i]);
    return [plv, lv]
}

function addPartyPlaceholders(){
    const PT_RENTAL = -2;
    const PT_SELF   = -1;
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
    onFormationAdd(1, $('#formation-container')[0]);
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
                    let eles = createLevelInput(i);
                    cell.append(eles[0]);
                    cell.append(eles[1]);
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
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_WEAPON));
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
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_ARMOR));
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
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_ACCESSORY));
                    cell.append(abs);
                    break;
                case 7:
                    cell.attr('id', `add-skill-${i}`);
                    icon = AssetsManager.createSkillIconImageNode(-1);
                    attachInventorySelector(icon, ITYPE_SKILL);
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
                        inp.attr('value', SP_HOLDER[k]).attr('min', 0).attr('max', 20);
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
                    cell.addClass('action-cell');
                    break;
            }
            row.append(cell);
        }
        tbody.append(row);
    }
}

function onMemberMove(e, u){

}

function onEditorAction(id){
    document.getElementById('skill-group-select').innerHTML = '';
    currentSelectedId = id;
    let node = currentSelectedNode[0].parentElement;
    if(!node.id.includes('abstone')){
        if(node.id.includes('weapon')){
            let gid = AssetsManager.WeaponData[id].MEquipmentSkillRateGroupId;
            if(gid){
                setupAbilityGroup(gid);
            }
            else if(ItemManager.isUltimateWeapon(id)){
                setupUltimateAbilityGroup(id);
            }
        }
        else if(node.id.includes('armor')){
            let gid = AssetsManager.ArmorData[id].MEquipmentSkillRateGroupId;
            if(gid){
                setupAbilityGroup(gid);
            }
        }
        else if(node.id.includes('accessory')){
            let gid = AssetsManager.AccessoryData[id].MEquipmentSkillRateGroupId;
            if(gid){
                setupAbilityGroup(gid);
            }
        }
    }
    ActionModal.show();
}

function onEditorChoose(){
    let node = currentSelectedNode[0].parentElement;
    if(node.id.includes('abstone')){
        onAbStoneAdd(currentSelectedId, node);
    }
    else if(node.id.includes('fieldskill')){
        onFieldSkillAdd(currentSelectedId, node);
    }
    else if(node.id.includes('character')){
        onCharacterAdd(currentSelectedId, node);
    }
    else if(node.id.includes('weapon')){
        onWeaponAdd(currentSelectedId, node);
    }
    else if(node.id.includes('armor')){
        onArmorAdd(currentSelectedId, node);
    }
    else if(node.id.includes('accessory')){
        onAccessoryAdd(currentSelectedId, node);
    }
    else if(node.id.includes('formation')){
        onFormationAdd(currentSelectedId, node);
    }
    else if(node.id.includes('skill')){
        onSkillAdd(currentSelectedId, node);
    }

    ActionModal.hide();
    Inventory.hide();
}

function onCharacterAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -1;
    }
    let icon = AssetsManager.createCharacterAvatarNode(id)
    attachInventorySelector(icon, ITYPE_CHARACTER);
    $(node).append(icon);
    let idx = parseInt(todigits(node.id));
    let eles = createLevelInput(idx);
    $(node).append(eles[0]);
    $(node).append(eles[1]);
    partyData[idx].character = id < 0 ? 0 : id;
}

function onWeaponAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_WEAPON;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_WEAPON)
    attachInventorySelector(icon, ITYPE_WEAPON);
    $(node).append(icon);
    let name = $('#skill-group-select').val();
    let label = $(document.createElement('p')).text(name);
    label.addClass('item-label');
    $(node).append(label);
    let idx = parseInt(todigits(node.id));
    partyData[idx].weapon = id < 0 ? 0 : id;
}

function onArmorAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_ARMOR;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_ARMOR)
    attachInventorySelector(icon, ITYPE_ARMOR);
    $(node).append(icon);
    let name = $('#skill-group-select').val();
    let label = $(document.createElement('p')).text(name);
    label.addClass('item-label');
    $(node).append(label);
    let idx = parseInt(todigits(node.id));
    partyData[idx].armor = id < 0 ? 0 : id;
}

function onAccessoryAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_ARMOR;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_ACCESSORY)
    attachInventorySelector(icon, ITYPE_ACCESSORY);
    $(node).append(icon);
    let name = $('#skill-group-select').val();
    let label = $(document.createElement('p')).text(name);
    label.addClass('item-label');
    $(node).append(label);
    let idx = parseInt(todigits(node.id));
    partyData[idx].accessory = id < 0 ? 0 : id;
}

function onAbStoneAdd(id, node){
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        return ;
    }
    let item = $(document.createElement('p'));
    item.text(AssetsManager.SkillData[id].Name);
    let cancel = $(document.createElement('span'));
    cancel.addClass('clickable');
    cancel.click(()=>{
        item.remove();
    });
    cancel.html('&times;');
    item.append(cancel);
    $(node).prepend(item);
    let idx = parseInt(todigits(node.id));
    id = id < 0 ? 0 : id;
    if(node.id.includes('weapon')){
        partyData[idx].weaponAbStone = id;
    }
    else if(node.id.includes('armor')){
        partyData[idx].armorAbStone = id;
    }
    else if(node.id.includes('accessory')){
        partyData[idx].accessoryAbStone = id;
    }
}

function setupAbilityGroup(gid){
    if(!AssetsManager.EquipmentSkillGroup.hasOwnProperty(gid)){ return ; }
    let node = $('#skill-group-select');
    for(let obj of AssetsManager.EquipmentSkillGroup[gid]){
        let name = Vocab['None'];
        if(AssetsManager.SkillData.hasOwnProperty(obj.MSkillId)){
            name = AssetsManager.SkillData[obj.MSkillId].Name;
        }
        let opt = $(document.createElement('option'));
        opt.attr('value', name);
        opt.text(name);
        node.append(opt);
    }
}

function setupUltimateAbilityGroup(id){
    if(!AssetsManager.UltimateWeaponGroup.hasOwnProperty(id)){ return ; }
    let node = $('#skill-group-select');
    for(let aid in AssetsManager.UltimateWeaponGroup[id]){
        if(!AssetsManager.UltimateWeaponGroup[id].hasOwnProperty(aid)){ continue; }
        let name = AssetsManager.UltimateWeaponGroup[id][aid].Name;
        let opt = $(document.createElement('option'));
        opt.attr('value', name);
        opt.text(name);
        node.append(opt);
    }
}

function onSkillAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -1;
    }
    let pt = AssetsManager.createSkillIconImageNode(id)
    attachInventorySelector(pt, ITYPE_SKILL);
    $(node).append(pt);
    let label = $(document.createElement('p'));
    if(id > 0){
        let name = Inventory.createDecoratedSkillNameNode(id);
        label.append(name)
    }
    label.addClass('item-label');
    $(node).append(label);
}

function onFieldSkillAdd(id, node){
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = todigits(node.id) == 4 ? -2 : -1;
    }
    let pt = AssetsManager.createFieldSkillImageNode(id)
    attachInventorySelector(pt, ITYPE_FIELD_SKILL);
    $(node).append(pt);
    let name = id > 0 ? AssetsManager.FieldSkillData[id].Name : '';
    let label = $(document.createElement('p')).text(name);
    // label.addClass('item-label');
    $(node).append(label);
}

function onFormationAdd(id, node){
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        return;
    }
    node.innerHTML = '';
    let pt = AssetsManager.createFormationNode(id)
    attachInventorySelector(pt, ITYPE_FORMATION);
    $(node).append(pt);
    let name = AssetsManager.FormationData[id].Name;
    let label = $(document.createElement('p')).text(name);
    label.addClass('item-label');
    $(node).append(label);
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
    ActionModal = new bootstrap.Modal($('#modal-action'));
    Inventory.container.on("hidden.bs.modal", ()=>{
        if(Inventory.currentType == ITYPE_SKILL && currentAddSkillNode){
            currentAddSkillNode.remove();
        }
    });
}

(function(){
    window.addEventListener("load", init);
})();