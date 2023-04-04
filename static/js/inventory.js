/**
 * This class manages items and provide search functions
 */
class Game_Inventory{
    constructor(id, options={}){
        this.id = id;
        this.options = options;
        this.setup();
        this.setupTable(id, options);
        this.addToPage();
    }

    setupTable(id, options){
        this.container = $(document.createElement('div'));
        this.container.addClass('modal fade').attr('tabindex', '-1').attr('role', 'dialog');
        this.container.attr('aria-labelledby', `${id}_modal_label`).attr('aria-hidden', 'true');
        this.container.attr('id', id);
        
        this.dialog = $(document.createElement('div'));
        this.dialog.addClass('modal-dialog inventory-popup mx-auto').attr('role', 'document');
        this.dialog_content = $(document.createElement('div'));
        this.dialog_content.addClass('modal-content');
        this.dialog_header = $(document.createElement('div'));
        this.dialog_header.addClass('modal-header');
        this.dialog_title  = $(document.createElement(options['title_size'] || 'h5'));
        this.dialog_title.text(options['title'] || '');
        this.dialog_title.addClass('modal-title').attr('id', `${id}_modal_label`);
        this.close_btn = $(document.createElement('button'));
        this.close_btn.attr('type', 'button').addClass('close');
        this.close_btn.attr('data-bs-dismiss', 'modal').attr('aria-label', 'Close');
        this.close_text = $(document.createElement('span'));
        this.close_text.attr('aria-hidden', 'true').html('&times;');

        this.container.append(this.dialog);
        this.dialog.append(this.dialog_content);
        this.dialog_content.append(this.dialog_header);
        this.dialog_header.append(this.dialog_title);
        this.dialog_header.append(this.close_btn);
        this.close_btn.append(this.close_text);

        this.setupItemsTab();
        this.container.on("hidden.bs.modal", ()=>{
            if(this.currentType !== undefined){
                this.tabs[this.currentType].remove();
            }
        });
        this.modal = new bootstrap.Modal(this.container[0]);
    }

    setupItemsTab(){
        this.tabs = [];
        this.setupCharacterTab();
        this.setupWeaponTab();
        this.setupArmorTab();
        this.setupAccessoryTab();
        this.setupAbstoneTab();
        this.setupFieldSkillTab();
    }
    
    setup(){
        this.__htmlCache = {};
        this.tabTable    = {};
        this.currentAbStoneType = ITYPE_WEAPON;
    }

    createTabBody(type_name, categories, handlers){
        let body = $(document.createElement('div'))
        body.addClass('modal-body');
        body.css('height', `${window.innerHeight*0.8}px`);
        body.css('overflow-y', 'scroll');
        let ul = $(document.createElement('ul'));
        ul.addClass('nav nav-tabs').attr('id', `tab-${type_name}`).attr('role', 'tablist');
        let content = $(document.createElement('div'));
        content.addClass('tab-content').attr('id', `${type_name}-tab-content`);
        body.append(ul);
        body.append(content);
        this.tabTable[type_name] = {};
        for(let i=0;i<categories.length;++i){
            let cat = categories[i];
            let li = $(document.createElement('li'));
            li.addClass('nav-item');
            let a = $(document.createElement('a'));
            a.text(cat).addClass('nav-link').attr('id', `${type_name}-${cat}`);
            a.attr('data-bs-toggle', 'tab').attr('href', `#tab-${type_name}-${cat}`);
            a.attr('role', 'tab').attr('aria-controls', `#tab-${type_name}-${cat}`);
            a.attr('aria-selected', i==0? 'true' : 'false');
            a.click(()=>{
                this.loadItem(type_name, cat);
            });
            let container = $(document.createElement('div'));
            container.addClass('tab-pane fade').attr('id', `tab-${type_name}-${cat}`);
            container.attr('role', 'tabpanel').attr('aria-labelledby', `${type_name}-${cat}`);
            let table = handlers[cat]();
            this.tabTable[type_name][cat] = table;
            ul.append(li);
            li.append(a);
            content.append(container);
            container.append(table);
        }
        return body;
    }

    getCommonHandlers(){
        let handlers = {};
        let handler = ()=>{
            let table = $(document.createElement('table'));
            table.addClass('table');
            let thead = $(document.createElement('thead'));
            let th_tr = $(document.createElement('tr'));
            let cols = [Vocab['Image'], Vocab['Name'], Vocab['Description'], Vocab['Action']];
            for(let col of cols){
                let td = $(document.createElement('td'));
                td.text(col);
                th_tr.append(td);
            }
            thead.append(th_tr);
            table.append(thead);
            return table;
        };
        handlers[Vocab['Bookmark']] = handler;
        handlers['SS'] = handler;
        handlers['S'] = handler;
        handlers['A'] = handler;
        return handlers;
    }

    setupCharacterTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('character', categories, this.getCommonHandlers());
        this.tabs[ITYPE_CHARACTER] = body;
    }

    setupWeaponTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('weapon', categories, this.getCommonHandlers());
        this.tabs[ITYPE_WEAPON] = body;
    }

    setupArmorTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('armor', categories, this.getCommonHandlers());
        this.tabs[ITYPE_ARMOR] = body;
    }

    setupAccessoryTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('accessory', categories, this.getCommonHandlers());
        this.tabs[ITYPE_ACCESSORY] = body;
    }

    setupAbstoneTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let types = [ITYPE_WEAPON, ITYPE_ARMOR, ITYPE_ACCESSORY];
        let type_names = ['weapon', 'armor', 'accessory'];
        for(let i=0;i<types.length;++i){
            let body = this.createTabBody(`abstone-${type_names[i]}`, categories, this.getCommonHandlers());
            this.tabs[Game_Inventory.hashAbStoneType(types[i])] = body;
        }
    }

    setupFieldSkillTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('fieldskill', categories, this.getCommonHandlers());
        this.tabs[ITYPE_FIELD_SKILL] = body;
    }

    createEditorActionIcon(id){
        let ret = $(document.createElement('td'));
        let btn_html = `
            <button class="btn btn-primary btn-handler" type="button" onclick="onFieldSkillAdd(${id})">
            ${BICON_PLUS}
            </button>
        `;
        ret.html(btn_html);
        return ret;
    }

    static hashAbStoneType(type){
        return 100*type + ITYPE_ABSTONE;
    }

    loadItem(type_name, category){
        let type_id = ITYPE_FIELD_SKILL;
        let data = {};
        if(!this.tabTable.hasOwnProperty(type_name)){
            this.tabTable[type_name] = {};
        }
        switch(type_name){
            case 'weapon':
                type_id = ITYPE_WEAPON;
                data = AssetsManager.WeaponData;
                break;
            case 'armor':
                type_id = ITYPE_ARMOR;
                data = AssetsManager.ArmorData;
                break;
            case 'accessory':
                type_id = ITYPE_ACCESSORY;
                data = AssetsManager.AccessoryData;
                break;
            case 'abstone':
            case 'abstone-weapon':
            case 'abstone-armor':
            case 'abstone-accessory':
                return this.loadAbStone(type_name, category);
            case 'character':
                type_id = ITYPE_CHARACTER;
                data = AssetsManager.CharacterData;
                break;
            case 'ptskill':
            case 'fieldskill':
                type_id = ITYPE_FIELD_SKILL;
                data = AssetsManager.FieldSkillData;
                break;
            case 'formation':
                return this.loadFormation();
        }
        if(!this.__htmlCache.hasOwnProperty(type_id)){
            this.__htmlCache[type_id] = {};
        }
        let rarity = 4;
        switch(category){
            case 'A':
                rarity = 2;
                break;
            case 'S':
                rarity = 3;
                break;
            case 'SS':
                rarity = 4;
                break;
            case Vocab['Bookmark']:
                rarity = 0;
                break;
        }
        if(rarity > 0 && this.tabTable[type_name][category][0].childElementCount < 2){
            let tbody = $(document.createElement('tbody'));
            let ids = Object.keys(data);
            for(let id of ids){
                if(!data.hasOwnProperty(id)){ continue; }
                let instance = data[id];
                let irariry = instance.Rarity || instance.EquipmentRarity || instance.CharacterRarity;
                if(irariry != rarity){ continue; }
                if(this.__htmlCache[type_id].hasOwnProperty(id)){
                    tbody.append(this.__htmlCache[type_id][id]);
                    continue;
                }
                let img = null;
                let desc = '';
                let name = instance.Name;
                switch(type_id){
                    case ITYPE_CHARACTER:
                        img = AssetsManager.createCharacterAvatarNode(id);
                        name = `${instance.Name} ${instance.MCharacterBase.Name}`;
                        desc += `${Vocab.WeaponTypeList[instance.MCharacterBase.WeaponEquipType]} / `;
                        desc += `${Vocab.CharacterTypeList[instance.CharacterType]}`;
                        break;
                    case ITYPE_WEAPON:
                    case ITYPE_ARMOR:
                    case ITYPE_ACCESSORY:
                        img = AssetsManager.createEquipmentImageNode(id, type_id);
                        desc = instance.Description;
                        break;
                    case ITYPE_FIELD_SKILL:
                        img = AssetsManager.createFieldSkillImageNode(id);
                        desc = `${Vocab['Cost']}: ${instance.Cost}`;
                        break;

                }
                if(!img){ continue; }
                let row = $(document.createElement('tr'));
                let cells = [];
                for(let i=0;i<3;++i){
                    cells.push($(document.createElement('td')));
                    row.append(cells[i]);
                }
                cells[0].append(img);
                cells[1].text(name);
                cells[2].text(desc.replaceAll('/n', ' '));
                let act = this.createEditorActionIcon(id);
                row.append(act);
                this.__htmlCache[type_id][id] = row;
                tbody.prepend(row);
            }
            this.tabTable[type_name][category].append(tbody);
        }
    }

    loadAbStone(type_name, category){
        let type_id   = ITYPE_ABSTONE;
        let attachment_id = 0;
        switch(type_name){
            case 'abstone-weapon':
                attachment_id = ITYPE_WEAPON;
                break;
            case 'abstone-armor':
                attachment_id = ITYPE_ARMOR;
                break;
            case 'abstone-accessory':
                attachment_id = ITYPE_ACCESSORY;
                break;
        }
        type_id = Game_Inventory.hashAbStoneType(attachment_id);
        if(!this.tabTable.hasOwnProperty(type_name)){
            this.tabTable[type_name] = {};
        }
        if(!this.__htmlCache.hasOwnProperty(type_id)){
            this.__htmlCache[type_id] = {};
        }
        let rarity = 4;
        switch(category){
            case 'A':
                rarity = 2;
                break;
            case 'S':
                rarity = 3;
                break;
            case 'SS':
                rarity = 4;
                break;
            case Vocab['Bookmark']:
                rarity = 0;
                break;
        }
        if(rarity > 0 && this.tabTable[type_name][category][0].childElementCount < 2){
            let tbody = $(document.createElement('tbody'));
            let data = [];
            switch(attachment_id){
                case ITYPE_WEAPON:
                    data = ItemManager.getPureWeaponAbstones();
                    break;
                case ITYPE_ARMOR:
                    data = ItemManager.getPureArmorAbstones();
                    break;
                case ITYPE_ACCESSORY:
                    data = ItemManager.getPureAccessoryAbstones();
                    break;
            }
            for(let instance of data){
                let id = instance.Id;
                let irariry = instance.MAbilityStone.Rarity;
                if(irariry != rarity){ continue; }
                if(this.__htmlCache[type_id].hasOwnProperty(id)){
                    tbody.append(this.__htmlCache[type_id][id]);
                    continue;
                }
                let desc = instance.Description;
                let name = instance.Name;
                let row = $(document.createElement('tr'));
                let cells = [];
                for(let i=0;i<3;++i){
                    cells.push($(document.createElement('td')));
                    row.append(cells[i]);
                }
                cells[1].text(name);
                cells[2].text(desc.replaceAll('/n', ' '));
                let act = this.createEditorActionIcon(id);
                row.append(act);
                this.__htmlCache[type_id][id] = row;
                tbody.append(row);
            }
            this.tabTable[type_name][category].append(tbody);
        }
    }

    loadFormation(category){

    }
    

    setItemType(type){
        this.dialog_content.append(this.tabs[type]);
        this.dialog_title.text(Vocab['ItemType'][`${type}`]);
        this.currentType = type;
    }

    show(type){
        this.setItemType(type);
        this.modal.show();
    }

    hide(){
        this.modal.hide();
    }

    clearCache(){
        this.container.remove();
        this.setup();
        this.setupTable(this.id, this.options);
        this.addToPage();
    }

    addToPage(){
        $('body').append(this.container);
    }
}