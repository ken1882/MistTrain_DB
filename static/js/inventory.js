/**
 * This class manages items and provide search functions
 */
class Game_Inventory{
    constructor(id, options={}){
        this.setupTable(id, options);
        this.addToPage();
    }

    setupTable(id, options){
        this.container = $(document.createElement('div'));
        this.container.addClass('modal fade').attr('tabindex', '-1').attr('role', 'dialog');
        this.container.attr('aria-labelledby', `${id}_modal_label`).attr('aria-hidden', 'true');
        this.container.attr('id', id);
        
        this.dialog = $(document.createElement('div'));
        this.dialog.addClass('modal-dialog').attr('role', 'document');
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
    
    createTabBody(type_name, categories, handlers){
        let body = $(document.createElement('div'))
        body.addClass('modal-body');
        let ul = $(document.createElement('ul'));
        ul.addClass('nav nav-tabs').attr('id', `tab-${type_name}`).attr('role', 'tablist');
        let content = $(document.createElement('div'));
        content.addClass('tab-content').attr('id', `${type_name}-tab-content`);
        body.append(ul);
        body.append(content);
        for(let i=0;i<categories.length;++i){
            let cat = categories[i];
            let li = $(document.createElement('li'));
            li.addClass('nav-item');
            let a = $(document.createElement('a'));
            a.text(cat).addClass('nav-link').attr('id', `${type_name}-${cat}`);
            a.attr('data-bs-toggle', 'tab').attr('href', `#tab-${type_name}-${cat}`);
            a.attr('role', 'tab').attr('aria-controls', `#tab-${type_name}-${cat}`);
            a.attr('aria-selected', i==0? 'true' : 'false');
            let container = $(document.createElement('div'));
            container.addClass('tab-pane fade').attr('id', `tab-${type_name}-${cat}`);
            container.attr('role', 'tabpanel').attr('aria-labelledby', `${type_name}-${cat}`);
            let table = handlers[cat]();

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
        let body = this.createTabBody('abstone', categories, this.getCommonHandlers());
        this.tabs[ITYPE_ABSTONE] = body;
    }

    setupFieldSkillTab(){
        let categories = [Vocab['Bookmark'], 'SS', 'S', 'A'];
        let body = this.createTabBody('fieldskill', categories, this.getCommonHandlers());
        this.tabs[ITYPE_FIELD_SKILL] = body;
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

    addToPage(){
        $('body').append(this.container);
    }
}