const BICON_ARROW_UPDOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down-up" viewBox="0 0 16 16">
<path fill-rule="evenodd" d="M11.5 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L11 2.707V14.5a.5.5 0 0 0 .5.5zm-7-14a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L4 13.293V1.5a.5.5 0 0 1 .5-.5z"/>
</svg>`;

const BICON_PLUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-square" viewBox="0 0 16 16">
<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
<path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
</svg>`;

const BICON_MINUS = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash-square" viewBox="0 0 16 16">
<path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
<path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
</svg>`;

let Inventory   = null;
let ActionModal = null;
let PartyGroupActionModal = null;
let EquipmentPresetModal = null;
let currentSelectedNode = null;
let currentSelectedId   = 0;
let currentAddSkillNode = null;
let currentPresetId = 0;
let emptyPlaceholder    = {};
let characterLevel      = [50, 50, 50, 50, 50, 50];
let partyData = {
    1: {}, 2: {}, 3: {}, 4: {}, 5: {},
};
let UltimateWeaponData = {};
let UltimateWeaponMaxGen = 1;

let GroupName = new Array(11);
let GroupData = new Array(11);
let CurrentPartyData = {};
let RegisteredItems = {
    weapons: [],
    armors: [],
    accessories: [],
    abstones: []
};
let EquipmentPresetData = {};
let EquipmentPresetCnt  = 0;
let CurrentSelectorWBData = null;
let CurrentSelectorWBIndex = null;

function init(){
    AssetsManager.loadCharacterAssets();
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    AssetsManager.loadEquipmentArchive();
    AssetsManager.loadFormationArchive();
    setup();
}

function attachInventorySelector(node, type, wb_data=null, wb_idx=null){
    node.addClass('clickable');
    node.click((e)=>{
        if(!['IMG', 'A'].includes(e.target.tagName)){
            return;
        }
        CurrentSelectorWBData = wb_data;
        CurrentSelectorWBIndex = wb_idx;
        console.log(CurrentSelectorWBData, CurrentSelectorWBIndex);
        if(wb_data && type == ITYPE_SKILL){
            if(!wb_data[wb_idx].hasOwnProperty('character') || !wb_data[wb_idx].character){
                alert(Vocab['SelectCharacterFirst']);
                return ;
            }
            let skill_ids = ItemManager.getCharacterSkills(wb_data[wb_idx].character);
            let ar = [];
            let ch = AssetsManager.CharacterData[wb_data[wb_idx].character];
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
        if(wb_data && (wb_data[wb_idx].character || 0) > 0){
            filter = {
                'WeaponEquipType': AssetsManager.CharacterData[wb_data[wb_idx].character].MCharacterBase.WeaponEquipType,
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
                    cell.append(icon);
                    attachInventorySelector(icon, ITYPE_CHARACTER, partyData, i);
                    // cell.append(document.createElement('br'));
                    cell.css('width', '280px');
                    let eles = createLevelInput(i);
                    cell.append(eles[0]);
                    cell.append(eles[1]);
                    break;
                case 1:
                    cell.attr('id', `weapon-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_WEAPON, ITYPE_WEAPON);
                    cell.append(icon);
                    attachInventorySelector(icon, ITYPE_WEAPON, partyData, i);
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
                    cell.append(abs);
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_WEAPON), partyData, i);
                    break;
                case 3:
                    cell.attr('id', `armor-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_ARMOR, ITYPE_ARMOR);
                    cell.append(icon);
                    attachInventorySelector(icon, ITYPE_ARMOR, partyData, i);
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
                    cell.append(abs);
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_ARMOR), partyData, i);
                    break;
                case 5:
                    cell.attr('id', `accessory-${i}`);
                    icon = AssetsManager.createEquipmentImageNode(-ITYPE_ACCESSORY, ITYPE_ACCESSORY);
                    cell.append(icon);
                    attachInventorySelector(icon, ITYPE_ACCESSORY, partyData, i);
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
                    cell.append(abs);
                    attachInventorySelector(abs, Game_Inventory.hashAbStoneType(ITYPE_ACCESSORY), partyData, i);
                    break;
                case 7:
                    cell.attr('id', `add-skill-${i}`);
                    icon = AssetsManager.createSkillIconImageNode(-1);
                    cell.append(icon);
                    attachInventorySelector(icon, ITYPE_SKILL, partyData, i);
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
                        inp.attr('id', `spcost-${i}-${k}`);
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
    if(!node.id.includes('abstone') && id > 0){
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
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -1;
    }
    let icon = AssetsManager.createCharacterAvatarNode(id)
    $(node).append(icon);
    attachInventorySelector(icon, ITYPE_CHARACTER, CurrentSelectorWBData, CurrentSelectorWBIndex);
    if(CurrentSelectorWBIndex){
        let eles = createLevelInput(CurrentSelectorWBIndex);
        $(node).append(eles[0]);
        $(node).append(eles[1]);
    }
    CurrentSelectorWBData[CurrentSelectorWBIndex].character = id < 0 ? 0 : id;
}

function onWeaponAdd(id, node, ability_id=undefined, ability_name=undefined, do_wb=true){
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_WEAPON;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_WEAPON)
    $(node).append(icon);
    attachInventorySelector(icon, ITYPE_WEAPON, CurrentSelectorWBData, CurrentSelectorWBIndex);
    if(ability_id === undefined){
        ability_id = $('#skill-group-select').val();
    }
    let name = ability_name;
    if(name === undefined){
        name = $('#skill-group-select').find('option:selected').text();
        if(!name && ability_id && AssetsManager.SkillData.hasOwnProperty(ability_id)){
            name = AssetsManager.SkillData[ability_id].Name;
        }
    }
    if(AssetsManager.WeaponData.hasOwnProperty(id)){
        let gid = AssetsManager.WeaponData[id].MEquipmentSkillRateGroupId;
        let sel = $(document.createElement('select'));
        if(gid){
            setupAbilityGroup(gid, sel);
        }
        else if(ItemManager.isUltimateWeapon(id)){
            setupUltimateAbilityGroup(id, sel);
        }
        if(ability_id){
            sel.val(ItemManager.isUltimateWeapon(id) ? -ability_id : ability_id);
        }
        sel.on('change', (e)=>{
            let node = $(e.target);
            CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbility = node.val();
            CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbilityName = node.find('option:selected').text();
        });
        let selc = $(document.createElement('div'));
        selc.append(sel);
        $(node).append(selc);
    }
    else{
        let label = $(document.createElement('p')).text(name);
        label.addClass('item-label');
        $(node).append(label);
    }
    if(do_wb && CurrentSelectorWBData){
        CurrentSelectorWBData[CurrentSelectorWBIndex].weapon = id < 0 ? 0 : id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbility = ability_id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbilityName = name;
        if(CurrentSelectorWBData == EquipmentPresetData){
            saveEquipPreset();
        }
    }
}

function onArmorAdd(id, node, ability_id=undefined, ability_name=undefined, do_wb=true){
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_ARMOR;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_ARMOR)
    $(node).append(icon);
    attachInventorySelector(icon, ITYPE_ARMOR, CurrentSelectorWBData, CurrentSelectorWBIndex);
    if(ability_id === undefined){
        ability_id = $('#skill-group-select').val();
    }
    let name = ability_name;
    if(name === undefined){
        name = $('#skill-group-select').find('option:selected').text();
    }
    if(AssetsManager.ArmorData.hasOwnProperty(id)){
        let gid = AssetsManager.ArmorData[id].MEquipmentSkillRateGroupId;
        let sel = $(document.createElement('select'));
        if(gid){
            setupAbilityGroup(gid, sel);
        }
        if(ability_id){
            sel.val(ability_id);
        }
        sel.on('change', (e)=>{
            let node = $(e.target);
            CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbility = node.val();
            CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbilityName = node.find('option:selected').text();
        });
        let selc = $(document.createElement('div'));
        selc.append(sel);
        $(node).append(selc);
    }
    else{
        let label = $(document.createElement('p')).text(name);
        label.addClass('item-label');
        $(node).append(label);
    }
    if(do_wb && CurrentSelectorWBData){
        CurrentSelectorWBData[CurrentSelectorWBIndex].armor = id < 0 ? 0 : id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbility = ability_id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbilityName = name;
        if(CurrentSelectorWBData == EquipmentPresetData){
            saveEquipPreset();
        }
    }
}

function onAccessoryAdd(id, node, ability_id=undefined, ability_name=undefined, do_wb){
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -ITYPE_ARMOR;
    }
    let icon = AssetsManager.createEquipmentImageNode(id, ITYPE_ACCESSORY)
    $(node).append(icon);
    attachInventorySelector(icon, ITYPE_ACCESSORY, CurrentSelectorWBData, CurrentSelectorWBIndex);
    if(ability_id === undefined){
        ability_id = $('#skill-group-select').val();
    }
    let name = ability_name;
    if(name === undefined){
        name = $('#skill-group-select').find('option:selected').text();
    }
    if(AssetsManager.AccessoryData.hasOwnProperty(id)){
        let gid = AssetsManager.AccessoryData[id].MEquipmentSkillRateGroupId;
        let sel = $(document.createElement('select'));
        if(gid){
            setupAbilityGroup(gid, sel);
        }
        if(ability_id){
            sel.val(ability_id);
        }
        sel.on('change', (e)=>{
            let node = $(e.target);
            CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbility = node.val();
            CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbilityName = node.find('option:selected').text();
        });
        let selc = $(document.createElement('div'));
        selc.append(sel);
        $(node).append(selc);
    }
    else{
        let label = $(document.createElement('p')).text(name);
        label.addClass('item-label');
        $(node).append(label);
    }
    if(do_wb && CurrentSelectorWBData){
        CurrentSelectorWBData[CurrentSelectorWBIndex].accessory = id < 0 ? 0 : id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbility = ability_id;
        CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbilityName = name;
        if(CurrentSelectorWBData == EquipmentPresetData){
            saveEquipPreset();
        }
    }
}

/**
 * 
 * @param {*} id skill id of ability stone
 * @param {*} node node to append the info row
 * @param {*} abs_name Some abstones does not have attached MSkillId, the name of the skill is the name of the abstone itself
 */
function onAbStoneAdd(id, node, abs_name=null, do_wb=true){
    if(id == 0 && !abs_name){ return; }
    node = $(node)[0];
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        return ;
    }
    let item = $(document.createElement('p'));
    if(!id){
        item.text(abs_name || '?');
    }
    else if(0 < id && id < 1){
        item.text(AssetsManager.AbStoneData[parseInt(id*1000)].Name);
    }
    else{
        if(AssetsManager.SkillData.hasOwnProperty(id)){
            item.text(AssetsManager.SkillData[id].Name);
        }
        else{
            item.text('?');
        }
    }
    let cancel = $(document.createElement('span'));
    id = id < 0 ? 0 : id;
    cancel.addClass('clickable');
    cancel.html('&times;');
    let ar = [];
    let i = CurrentSelectorWBIndex;
    if(node.id.includes('weapon')){
        if(!CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbStone || !id){
            CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbStone = []
        }
        ar = CurrentSelectorWBData[CurrentSelectorWBIndex].weaponAbStone;
        if(do_wb){ ar.push(id); }
    }
    else if(node.id.includes('armor')){
        if(!CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbStone || !id){
            CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbStone = []
        }
        ar = CurrentSelectorWBData[CurrentSelectorWBIndex].armorAbStone;
        if(do_wb){ ar.push(id); }
        // cancel.click(()=>{
        //     item.remove();
        //     ar.splice(ar.indexOf(id),1);
        //     if(CurrentSelectorWBData == EquipmentPresetData){
        //         saveEquipPreset();
        //     }
        // });
    }
    else if(node.id.includes('accessory')){
        if(!CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbStone || !id){
            CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbStone = [];
        }
        ar = CurrentSelectorWBData[CurrentSelectorWBIndex].accessoryAbStone;
        if(do_wb){ ar.push(id); }
        // cancel.click(()=>{
        //     item.remove();
        //     ar.splice(ar.indexOf(id),1);
        //     if(CurrentSelectorWBData == EquipmentPresetData){
        //         saveEquipPreset();
        //     }
        // });
    }
    cancel.click(()=>{
        item.remove();
        console.log(ar, i);
        ar.splice(ar.indexOf(id),1);
        console.log(ar, i);
        if(CurrentSelectorWBData == EquipmentPresetData){
            saveEquipPreset();
        }
    });
    $(node).prepend(item);
    item.append(cancel);
    if(do_wb && CurrentSelectorWBData == EquipmentPresetData){
        saveEquipPreset();
    }
}

function setupAbilityGroup(gid, node=null){
    if(!AssetsManager.EquipmentSkillGroup.hasOwnProperty(gid)){ return ; }
    if(!node){
        node = $('#skill-group-select');
    }else{ node = $(node); }
    for(let obj of AssetsManager.EquipmentSkillGroup[gid]){
        let name = Vocab['None'];
        if(AssetsManager.SkillData.hasOwnProperty(obj.MSkillId)){
            name = AssetsManager.SkillData[obj.MSkillId].Name;
        }
        let opt = $(document.createElement('option'));
        opt.attr('value', obj.MSkillId || 0);
        opt.text(name);
        node.append(opt);
    }
}

function setupUltimateAbilityGroup(id, node=null){
    if(!AssetsManager.UltimateWeaponGroup.hasOwnProperty(id)){ return ; }
    if(!node){
        node = $('#skill-group-select');
    }else{ node = $(node); }
    for(let aid in AssetsManager.UltimateWeaponGroup[id].AbilityGroups){
        if(!AssetsManager.UltimateWeaponGroup[id].AbilityGroups.hasOwnProperty(aid)){ continue; }
        let name = AssetsManager.UltimateWeaponGroup[id].AbilityGroups[aid].Name;
        let opt = $(document.createElement('option'));
        opt.attr('value', aid);
        opt.text(name);
        node.append(opt);
    }
}

function onSkillAdd(id, node){
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = -1;
    }
    let pt = AssetsManager.createSkillIconImageNode(id);
    $(node).append(pt);
    attachInventorySelector(pt, ITYPE_SKILL, CurrentSelectorWBData, CurrentSelectorWBIndex);
    let label = $(document.createElement('p'));
    if(id > 0){
        let name = Inventory.createDecoratedSkillNameNode(id);
        label.append(name)
    }
    label.addClass('item-label');
    $(node).append(label);
}

function onFieldSkillAdd(id, node){
    if(id == 0){ return; }
    node = $(node)[0];
    node.innerHTML = '';
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        id = todigits(node.id) == 4 ? -2 : -1;
    }
    let pt = AssetsManager.createFieldSkillImageNode(id)
    $(node).append(pt);
    attachInventorySelector(pt, ITYPE_FIELD_SKILL);
    let name = id > 0 ? AssetsManager.FieldSkillData[id].Name : '';
    let label = $(document.createElement('p')).text(name);
    // label.addClass('item-label');
    $(node).append(label);
}

function onFormationAdd(id, node){
    if(id == Game_Inventory.ITEM_REMOVE_ID){
        return;
    }
    node = $(node)[0];
    node.innerHTML = '';
    let pt = AssetsManager.createFormationNode(id)
    $(node).append(pt);
    attachInventorySelector(pt, ITYPE_FORMATION);
    let name = AssetsManager.FormationData[id].Name;
    let label = $(document.createElement('p')).text(name);
    label.addClass('item-label');
    $(node).append(label);
}

function clearSlot(idx){
    let rmid = Game_Inventory.ITEM_REMOVE_ID;
    CurrentSelectorWBData = partyData;
    CurrentSelectorWBIndex = idx;
    onCharacterAdd(rmid, $(`#character-${idx}`));
    onWeaponAdd(rmid, $(`#weapon-${idx}`));
    onArmorAdd(rmid, $(`#armor-${idx}`));
    onAccessoryAdd(rmid, $(`#accessory-${idx}`));
    onSkillAdd(rmid, $(`#add-skill-${idx}`));
    for(let node of $(`#abstone-weapon-${idx}`).children()){
        if(node.tagName.toLowerCase() != 'p'){ continue; }
        if(node.id.length < 1){
            node.children[0].click();
        }
    }
    for(let node of $(`#abstone-armor-${idx}`).children()){
        if(node.tagName.toLowerCase() != 'p'){ continue; }
        if(node.id.length < 1){
            console.log(node.children[0]);
            node.children[0].click();
        }
    }
    for(let node of $(`#abstone-accessory-${idx}`).children()){
        if(node.tagName.toLowerCase() != 'p'){ continue; }
        if(node.id.length < 1){
            node.children[0].click();
        }
    }
}

function loadPartyGroups(){
    if(!isLoggedIn()){
        $('#party-group-selector-placeholder').text(Vocab['GameLoginFailed']);
        $("#loading-indicator-2").remove();
        return ;
    }
    let proms = [];
    proms.push(sendMTG({
        url: '/api/UParty/GetUPartyGroupNames',
        method: 'GET',
        success: (res) => {
            let group_list = $('#party-group-selector');
            for(let i=0;i<10;++i){
                GroupName[i+1] = res.r[i];
                let opt = $(document.createElement('option'));
                opt.text(res.r[i].Name);
                opt.prop('value', i+1);
                group_list.append(opt);
            }
            group_list.on('change', ()=>{
                let v = group_list.prop('value');
                if(v){ onPartyGroupChange(v); }
            });
        },
        error: (res)=>{ console.error(res) },
    }));
    for(let i=1; i<=10; ++i){
        proms.push(sendMTG({
            url: `/api/UParties/${i}`,
            method: 'GET',
            success: (res) => {
                GroupData[i] = res.r.UParties;
            },
            error: (res)=>{ console.error(res) },
        }));
    }
    proms.concat(fetchCharacters());
    proms.concat(fetchInventory());
    proms.concat(fetchBackgroundParty());
    for(let i=1; i<=UltimateWeaponMaxGen; ++i){
        proms.push(sendMTG({
            // This api only returns its id, not MWeaponId
            url: `/api/UltimateWeapon/GetUUltimateWeaponGroup/${i}`,
            method: 'GET',
            success: (res) => {
                for(let uwp of res.r.UUltimateWeaponInfoViewModels){
                    UltimateWeaponData[uwp.MUltimateWeaponId] = uwp;
                    UltimateWeaponData[uwp.MUltimateWeaponId].AbilityGroups = {};
                    for(let ability of uwp.UltimateWeaponPointAbilityinfoViewModels){
                        UltimateWeaponData[uwp.MUltimateWeaponId].AbilityGroups[ability.MUltimateWeaponPointAbilityId] = ability;
                    }
                }
            },
            error: (res)=>{ console.error(res) },
        }));
    }
    Promise.all(proms).then(()=>{
        $("#loading-indicator-2").remove();
    }).catch(() => {
        console.log("Ajax failed");
        alert(Vocab.GameLoginFailed+'\n\n'+Vocab.GameLoginFailed2);
        handleGameConnectionError();
    });
}

function onPartyGroupChange(idx){
    let tbody = $('#party-group-table-body');
    tbody.html('');
    for(let party of GroupData[idx]){
        let row = $(document.createElement('tr'));
        tbody.append(row);
        let cells = [];
        for(let i=0;i<7;++i){
            let cell = $(document.createElement('td'));
            cell.addClass('cell-centered');
            cells.push(cell);
            row.append(cell);
        }
        let pname = party.Name || `${Vocab['Party']}#${party.PartyNo}`;
        cells[0].append($(document.createElement('p')).text(pname));
        for(let i=1;i<=5;++i){
            let char = party.UCharacterSlots[i-1].UCharacter;
            let mchid = -1;
            if(char){
                mchid = char.MCharacterId;
            }
            cells[i].append(AssetsManager.createCharacterAvatarNode(mchid));
        }
        let action_btn = $(document.createElement('a'));
        action_btn.addClass('btn btn-primary btn-handler').prop('type', 'button');
        action_btn.html(BICON_PLUS);
        action_btn.on('click', ()=>{
            onPartyGroupAction(party);
        })
        cells[6].append(action_btn);
    }
    
}

function onPartyGroupAction(party){
    CurrentPartyData = party;
    PartyGroupActionModal.show();
}

function applyFromGameParty(){
    CurrentSelectorWBData = partyData;
    for(let slot of CurrentPartyData.UCharacterSlots){
        let idx = slot.SlotNo;
        CurrentSelectorWBIndex = idx;
        clearSlot(slot.SlotNo);
        let char = slot.UCharacter;
        if(!char){ continue; }
        onCharacterAdd(char.MCharacterId, $(`#character-${idx}`));
        $(`#lv-character-${idx}`).val(char.Level);
        $('#ex-hp').val(char.UCharacterBaseViewModel.ExStatus.HP);
        $('#ex-stat').val(char.UCharacterBaseViewModel.ExStatus.Speed); // others are same
        for(let j=1;j<=3;++j){
            let uskill = char[`USkill${j}`];
            let sp_cost = AssetsManager.SkillData[uskill.MSkillId].SPCost - uskill.Stage;
            sp_cost += slot[`USkill${j}SPFiexdValue`];
            $(`#spcost-${idx}-${j-1}`).val(sp_cost);
        }
        let weapon = slot.UWeapon;
        if(weapon){
            let skid = weapon.MSkillId;
            let skname = '';
            if(skid){ skname = AssetsManager.SkillData[skid].Name; }
            // Ultimate weapon
            if(AssetsManager.UltimateWeaponGroup.hasOwnProperty(weapon.MWeaponId))
            {
                let uwp = null;
                for(let id in AssetsManager.UltimateWeaponGroup){
                    if(!AssetsManager.UltimateWeaponGroup.hasOwnProperty(id)){ continue; }
                    let obj = AssetsManager.UltimateWeaponGroup[id];
                    if(obj.MWeaponId == weapon.MWeaponId){
                        uwp = UltimateWeaponData[obj.Id];
                        break;
                    }
                }
                let equipped = [];
                skid = 0;
                for(let ability of uwp.UltimateWeaponPointAbilityinfoViewModels){
                    if(ability.EquipSlotNo){
                        // warning: up to 4 is suppoted otherwise use more precise decimal
                        skid -= ability.MUltimateWeaponPointAbilityId * (10**(equipped.length*4));
                        let aname = AssetsManager.UltimateWeaponGroup[weapon.MWeaponId].AbilityGroups[ability.MUltimateWeaponPointAbilityId].Name;
                        equipped.push(aname);
                    }
                }
                skname = equipped.join(',');
            }
            else{
                // AbStone data is missing, need to get from UWeapons/Armors/Accessories
                for(let item of DataManager.dataWeapons){
                    if(item.Id != weapon.Id){ continue; }
                    if(!item.AbilityStoneSlots){ continue; }
                    for(let st of item.AbilityStoneSlots){
                        let lvsk = AssetsManager.LevelSkillData[st.MLevelUpSkillGroupId];
                        let skid = lvsk[lvsk.length-1].MSkillId;
                        if(!skid){ skid = st.MAbilityStoneId * 0.001; }
                        let st_name = AssetsManager.AbStoneData[st.MAbilityStoneId].Name;
                        onAbStoneAdd(skid, $(`#abstone-weapon-${idx}`), st_name);
                    }
                }
            }
            onWeaponAdd(weapon.MWeaponId, $(`#weapon-${idx}`), skid, skname);
        }
        let armor = slot.UArmor;
        if(armor){
            let skid = armor.MSkillId;
            let skname = '';
            if(skid){ skname = AssetsManager.SkillData[skid].Name; }
            onArmorAdd(armor.MArmorId, $(`#armor-${idx}`), skid, skname);
            for(let item of DataManager.dataArmors){
                if(item.Id != armor.Id){ continue; }
                if(!item.AbilityStoneSlots){ continue; }
                for(let st of item.AbilityStoneSlots){
                    let lvsk = AssetsManager.LevelSkillData[st.MLevelUpSkillGroupId];
                    let skid = lvsk[lvsk.length-1].MSkillId;
                    if(!skid){ skid = st.MAbilityStoneId * 0.001; }
                    let st_name = AssetsManager.AbStoneData[st.MAbilityStoneId].Name;
                    onAbStoneAdd(skid, $(`#abstone-armor-${idx}`), st_name);
                }
            }
        }
        let accessory = slot.UAccessory;
        if(accessory){
            let skid = accessory.MSkillId;
            let skname = '';
            if(skid){ skname = AssetsManager.SkillData[skid].Name; }
            onAccessoryAdd(accessory.MAccessoryId, $(`#accessory-${idx}`), skid, skname);
            for(let item of DataManager.dataAccessories){
                if(item.Id != accessory.Id){ continue; }
                if(!item.AbilityStoneSlots){ continue; }
                for(let st of item.AbilityStoneSlots){
                    let lvsk = AssetsManager.LevelSkillData[st.MLevelUpSkillGroupId];
                    let skid = lvsk[lvsk.length-1].MSkillId;
                    if(!skid){ skid = st.MAbilityStoneId * 0.001; }
                    let st_name = AssetsManager.AbStoneData[st.MAbilityStoneId].Name;
                    onAbStoneAdd(skid, $(`#abstone-accessory-${idx}`), st_name);
                }
            }
        }
        let add_skill = slot.USkill;
        if(add_skill){
            onSkillAdd(add_skill.MSkillId, $(`#add-skill-${idx}`));
            let sp_cost = AssetsManager.SkillData[add_skill.MSkillId].SPCost - add_skill.Stage;
            sp_cost += slot[`USkill4SPFiexdValue`];
            $(`#spcost-${idx}-3`).val(sp_cost);
        }
    }
    onFieldSkillAdd(CurrentPartyData.MFieldSkill1Id, $('#fieldskill-1'));
    onFieldSkillAdd(CurrentPartyData.MFieldSkill2Id, $('#fieldskill-2'));
    onFieldSkillAdd(CurrentPartyData.MFieldSkill3Id, $('#fieldskill-3'));
    onFormationAdd(CurrentPartyData.MFormationId, $('#formation'));
    PartyGroupActionModal.hide();
}

function setup(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setup, 300);
    }
    addPartyPlaceholders();
    setupSettings();
    $('#party-table-body').sortable({
        handle: '.btn-handler',
        change: onMemberMove,
    });
    $("#loading-indicator").remove();
    $("#party-index").css('display', '');
    $("#party-tabs").css('display', '');
    Inventory = new Game_Inventory('inventory');
    ActionModal = new bootstrap.Modal($('#modal-action'));
    PartyGroupActionModal = new bootstrap.Modal($('#modal-action-2'));
    EquipmentPresetModal = new bootstrap.Modal($('#modal-action-3'));
    Inventory.container.on("hidden.bs.modal", ()=>{
        if(Inventory.currentType == ITYPE_SKILL && currentAddSkillNode){
            currentAddSkillNode.remove();
        }
    });
    setupEquipPreset();
    loadPartyGroups();
}

function setupSettings(){
    let eqm_pref  = DataManager.buildEquipmentPerf;
    let eqjm_pref = DataManager.buildAbstonePerf;
    for(let i=0;i<2;++i){
        $(`#eqm-opt-${i}`).on('click', (e)=>{
            DataManager.buildEquipmentPerf = e.target.value;
        });
        if(parseInt(eqm_pref) == i){
            $(`#eqm-opt-${i}`).attr('checked', '');
        }
    }
    for(let i=0;i<5;++i){
        $(`#eqjm-opt-${i}`).on('click', (e)=>{
            DataManager.buildAbstonePerf = e.target.value;
        });
        if(parseInt(eqjm_pref) == i){
            $(`#eqjm-opt-${i}`).attr('checked', '');
        }
    }
}

function setupEquipPreset(){
    let tbody = $('#equipment-preset-table-body');
    tbody.html('');
    EquipmentPresetCnt = 0;
    let data = DataManager.getSetting('EquipmentPresetData');
    if(!data){ return; }
    data = JSON.parse(data);
    for(let i in data){
        insertNewEquipmentPreset(data[i]);
    }
}

function saveEquipPreset(){
    DataManager.changeSetting('EquipmentPresetData', JSON.stringify(EquipmentPresetData));
}

function createNewPreset(){
    let n = prompt(Vocab.EnterPresetName);
    if(n){
        insertNewEquipmentPreset({name: n});
    }
}

function insertNewEquipmentPreset(data){
    EquipmentPresetCnt += 1;
    let i = EquipmentPresetCnt;
    CurrentSelectorWBData = EquipmentPresetData;
    CurrentSelectorWBIndex = i;
    let preset = {
        name: `#${EquipmentPresetCnt}`,
        id: EquipmentPresetCnt,
        character: -1,
        weapon: -ITYPE_WEAPON,
        armor: -ITYPE_ARMOR,
        accessory: -ITYPE_ACCESSORY,
        weaponAbStone: [],
        armorAbStone: [],
        accessoryAbStone: [],
        weaponAbility: 0,
        armorAbility: 0,
        accessoryAbility: 0,
        weaponAbilityName: '',
        armorAbilityName: '',
        accessoryAbilityName: '',
    }
    preset = {...preset, ...data};
    EquipmentPresetData[EquipmentPresetCnt] = preset;
    let tbody = $('#equipment-preset-table-body');
    let row = $(document.createElement('tr'));
    row.attr('id', `preset-${EquipmentPresetCnt}`);
    tbody.append(row);
    let cells = [];
    for(let i=0;i<9;++i){
        let cell = $(document.createElement('td'));
        cell.addClass('cell-centered');
        cells.push(cell);
        row.append(cell);
    }
    let ncontainer = $(document.createElement('span'));
    let nname = $(document.createElement('input'));
    nname.attr('type', 'text').attr('id', `preset-name-input-${EquipmentPresetCnt}`);
    nname.on('change', (e)=>{
        EquipmentPresetData[i].name = e.target.value;
        saveEquipPreset();
    });
    // nname.css('width', '100px');
    nname.val(preset.name);
    ncontainer.append(nname);
    cells[0].attr('id', `preset-name-${EquipmentPresetCnt}`);
    // cells[0].css('width', '110px');
    cells[0].append(ncontainer);
    let wpnode = AssetsManager.createEquipmentImageNode(-ITYPE_WEAPON, ITYPE_WEAPON);
    cells[1].attr('id', `preset-weapon-${EquipmentPresetCnt}`);
    cells[1].append(wpnode);
    attachInventorySelector(wpnode, ITYPE_WEAPON, EquipmentPresetData, EquipmentPresetCnt);
    if(preset.weapon > 0){
        onWeaponAdd(preset.weapon, cells[1], preset.weaponAbility, preset.weaponAbilityName, false);
    }
    let wpasnode = AssetsManager.createEquipmentImageNode(
        -ITYPE_ABSTONE, ITYPE_ABSTONE,
        null,
        {
            'container_class': 'abstone-container',
            'image_class': 'abstone-add-icon'
        }
    );
    cells[2].attr('id', `preset-abstone-weapon-${EquipmentPresetCnt}`);
    cells[2].append(wpasnode);
    attachInventorySelector(wpasnode, Game_Inventory.hashAbStoneType(ITYPE_WEAPON), EquipmentPresetData, EquipmentPresetCnt);
    for(let id of preset.weaponAbStone){
        onAbStoneAdd(id, cells[2], null, false);
    }
    
    let arnode = AssetsManager.createEquipmentImageNode(-ITYPE_ARMOR, ITYPE_ARMOR);
    cells[3].attr('id', `preset-armor-${EquipmentPresetCnt}`);
    cells[3].append(arnode);
    attachInventorySelector(arnode, ITYPE_ARMOR, EquipmentPresetData, EquipmentPresetCnt);
    if(preset.armor > 0){
        onArmorAdd(preset.armor, cells[3], preset.armorAbility, preset.armorAbilityName, false);
    }
    let arasnode = AssetsManager.createEquipmentImageNode(
        -ITYPE_ABSTONE, ITYPE_ABSTONE,
        null,
        {
            'container_class': 'abstone-container',
            'image_class': 'abstone-add-icon'
        }
    );
    cells[4].attr('id', `preset-abstone-armor-${EquipmentPresetCnt}`);
    cells[4].append(arasnode);
    attachInventorySelector(arasnode, Game_Inventory.hashAbStoneType(ITYPE_ARMOR), EquipmentPresetData, EquipmentPresetCnt);
    for(let id of preset.armorAbStone){
        onAbStoneAdd(id, cells[4], null, false);
    }

    let acnode = AssetsManager.createEquipmentImageNode(-ITYPE_ACCESSORY, ITYPE_ACCESSORY);
    cells[5].attr('id', `preset-accessory-${EquipmentPresetCnt}`);
    cells[5].append(acnode);
    attachInventorySelector(acnode, ITYPE_ACCESSORY, EquipmentPresetData, EquipmentPresetCnt);
    if(preset.accessory > 0){
        onAccessoryAdd(preset.accessory, cells[5], preset.accessoryAbility, preset.accessoryAbilityName, false);
    }
    let acasnode = AssetsManager.createEquipmentImageNode(
        -ITYPE_ABSTONE, ITYPE_ABSTONE,
        null,
        {
            'container_class': 'abstone-container',
            'image_class': 'abstone-add-icon'
        }
    );
    cells[6].attr('id', `preset-abstone-accessory-${EquipmentPresetCnt}`);
    cells[6].append(acasnode);
    attachInventorySelector(acasnode, Game_Inventory.hashAbStoneType(ITYPE_ACCESSORY), EquipmentPresetData, EquipmentPresetCnt);
    for(let id of preset.accessoryAbStone){
        onAbStoneAdd(id, cells[6], null, false);
    }

    let apply_btn = $(document.createElement('a'));
    apply_btn.addClass('btn btn-primary btn-handler').prop('type', 'button');
    apply_btn.html(BICON_PLUS);
    apply_btn.on('click', ()=>{
        currentPresetId = i;
        EquipmentPresetModal.show();
    });
    cells[7].attr('id', `preset-apply-${EquipmentPresetCnt}`);
    cells[7].append(apply_btn);
    let remove_btn = $(document.createElement('a'));
    remove_btn.addClass('btn btn-primary btn-handler').prop('type', 'button');
    remove_btn.html(BICON_MINUS);
    remove_btn.on('click', ()=>{
        $(`#preset-${i}`).remove();
        delete EquipmentPresetData[i];
        saveEquipPreset();
    });
    cells[8].attr('id', `preset-remove-${EquipmentPresetCnt}`);
    cells[8].append(remove_btn);
    saveEquipPreset();
}

function applyPreset(slot_id){
    let preset = EquipmentPresetData[currentPresetId];
    CurrentSelectorWBData = partyData;
    CurrentSelectorWBIndex = slot_id;
    if(preset.weapon > 0){
        onWeaponAdd(preset.weapon, $(`#weapon-${slot_id}`), preset.weaponAbility, preset.weaponAbilityName);
    }
    if(preset.armor > 0){
        onArmorAdd(preset.armor, $(`#armor-${slot_id}`), preset.armorAbility, preset.armorAbilityName);
    }
    if(preset.accessory > 0){
        onAccessoryAdd(preset.accessory, $(`#accessory-${slot_id}`), preset.accessoryAbility, preset.accessoryAbilityName);
    }
    if(preset.weapon > 0 || preset.weaponAbStone.length){
        for(let node of $(`#abstone-weapon-${slot_id}`).children()){
            if(node.tagName.toLowerCase() != 'p'){ continue; }
            if(node.id.length < 1){
                node.children[0].click();
            }
        }
        for(let s of preset.weaponAbStone){
            onAbStoneAdd(s, $(`#abstone-weapon-${slot_id}`));
        }
    }
    if(preset.armor > 0 || preset.armorAbStone.length){
        for(let node of $(`#abstone-armor-${slot_id}`).children()){
            if(node.tagName.toLowerCase() != 'p'){ continue; }
            if(node.id.length < 1){
                node.children[0].click();
            }
        }
        for(let s of preset.armorAbStone){
            onAbStoneAdd(s, $(`#abstone-armor-${slot_id}`));
        }
    }
    if(preset.accessory > 0 || preset.accessoryAbStone.length){
        for(let node of $(`#abstone-accessory-${slot_id}`).children()){
            if(node.tagName.toLowerCase() != 'p'){ continue; }
            if(node.id.length < 1){
                node.children[0].click();
            }
        }
        for(let s of preset.accessoryAbStone){
            onAbStoneAdd(s, $(`#abstone-accessory-${slot_id}`));
        }
    }
    EquipmentPresetModal.hide();
}

function exportPreset(){
    alert(Vocab['ExportPresetDesc']);
    let tab = window.open();
    tab.document.open();
    tab.document.write('<pre>'+ JSON.stringify(EquipmentPresetData) + '</pre>');
}

function importPreset(){
    alert(Vocab['ImportPresetWarning']);
    let raw = prompt(Vocab['ImportPresetDesc']);
    if(!raw){ return; }
    let dat = {};
    try{
        dat = JSON.parse(raw);
        let props_vaildator = {
            'id': [Number, String],
            'name': [Number, String],
            'character': [Number, String],
            'weapon': [Number, String],
            'armor': [Number, String],
            'accessory': [Number, String],
            'weaponAbility': [Number, String],
            'armorAbility': [Number, String],
            'accessoryAbility': [Number, String],
            'weaponAbilityName': [Number, String],
            'armorAbilityName': [Number, String],
            'accessoryAbilityName': [Number, String],
            'weaponAbStone': [Array, [Number, String]],
            'armorAbStone': [Array, [Number, String]],
            'accessoryAbStone': [Array, [Number, String]],
        };
        for(let i in dat){
            let d = dat[i];
            for(let p in d){
                if(!props_vaildator.hasOwnProperty(p)){
                    console.log("Invalid property: "+p)
                    alert(Vocab['InvalidData']);
                    return;
                }
            }
            for(let p in props_vaildator){
                if(!d.hasOwnProperty(p)){
                    console.log("Invalid property: "+p)
                    alert(Vocab['InvalidData']);
                    return;
                }
                let flag_ok = false;
                for(let cls of props_vaildator[p]){
                    if(cls === Array && d[p]){
                        if(!isClassOf(d[p], cls)){
                            break;
                        }
                        for(let e of d[p]){
                            for(let cls2 of props_vaildator[p][1]){
                                if(e !== null && !isClassOf(e, cls2)){
                                    console.log(`Invalid class of property element: ${p} of ${e}`)
                                    alert(Vocab['InvalidData']);
                                    return;
                                }
                            }
                        }
                        flag_ok = true;
                        break;
                    }
                    else if(d[p] == null || isClassOf(d[p], cls)){
                        flag_ok = true;
                        break;
                    }
                }
                if(!flag_ok){
                    console.log(`Invalid class of property: ${p}`)
                    alert(Vocab['InvalidData']);
                    return;
                }
            }
        }
    }
    catch(error){
       console.error(error);
       alert(Vocab['InvalidData']);
       return;
    }
    EquipmentPresetData = dat;
    saveEquipPreset();
    setupEquipPreset();
}

function isArmor(item){ return item.hasOwnProperty('MArmorId'); }
function isWeapon(item){ return item.hasOwnProperty('MWeaponId'); }
function isAccessory(item){ return item.hasOwnProperty('MAccessoryId'); }
function isCharacter(item){ return item.hasOwnProperty('MCharacterId'); }
function isAbstone(item){ return item.hasOwnProperty('MAbilityStoneId'); }

// item is using by party in background auto play
function isItemLocked(item){
    if(!DataManager.dataBackgroundParty){ return false; }
    for(let p of DataManager.dataBackgroundParty){
        if(!p.UPartyViewModel){ continue; }
        let party = p.UPartyViewModel;
        for(let s of party.UCharacterSlots){
            let wp = -1;
            if(s.UWeapon){
                wp = DataManager.dataWeapons.find((i) => i.Id == s.UWeapon.Id)
            }
            let ar = -1;
            if(s.UArmor){
                ar = DataManager.dataArmors.find((i) => i.Id == s.UArmor.Id)
            }
            let ac = -1;
            if(s.UAccessory){
                ac = DataManager.dataAccessories.find((i) => i.Id == s.UAccessory.Id)
            }
            if(isWeapon(item) && wp.Id == item.Id){ return true; }
            if(isArmor(item) && ar.Id == item.Id){ return true; }
            if(isAccessory(item) && ac.Id == item.Id){ return true; }
            if(isAbstone(item)){
                for(let obj of [wp,ar,ac]){
                    if(!obj || !obj.AbilityStoneSlots){ continue; }
                    for(let as of obj.AbilityStoneSlots){
                        if(as.Id == item.Id){return true; }
                    }
                }
            }
            let ch = s.UCharacter;
            if(ch && isCharacter(item)){
                if(ch.UCharacterBaseViewModel.MCharacterBaseId == item.MCharacterBaseId){
                    return true;
                }
            }
        }
    }
    return false;
}

(function(){
    window.addEventListener("load", init);
})();