let FieldSkillNodes = {};
let MaxEffectsCount = 3;

function init(){
    AssetsManager.loadPartyFrames();
    AssetsManager.loadSkillArchive();
    AssetsManager.loadFieldSkillArchive();
    setup();
}

function setup(){
    if(!DataManager.isReady() || !AssetsManager.isReady()){
        return setTimeout(setup, 300);
    }
    setupMaxEffects()
    for(let i=1;i<=MaxEffectsCount;++i){
        $(`#th-effect-${i}`).text(Vocab['Effect']+ ` ${i}`);
    }
    insertFieldSkills();
    setupTableUtils();
    updateHitCount();
    $("#loading-indicator").remove();
}


function setupTableUtils(){
    let params = {
      sortReset: true,
      search: true,
      searchOnEnterKey: true,
      columns: [
        {sortable: false},  // image
        {sortable: false},  // name
        {sortable: true},   // rarity
        {sortable: true},   // cost
        {sortable: false},  // effect 1
        {sortable: false},  // effect 2
        {sortable: false},  // effect 3
      ],
      onAll: (e)=>{
        if(e == 'post-body.bs.table'){
          if($("#loading-indicator")[0]){ return ;}
          setTimeout(updateHitCount, 100);
        }
      },
      customSearch: (data, text) => {
        let fragments = text.split(' ');
        let fields = [
            'fname', 'frarity', 'fcost', 'feffect1', 'feffect2', 'feffect3'
        ];
        return data.filter(function (row) {
            return fragments.every((keyword) => {
                keyword = keyword.toLocaleLowerCase();
                return fields.some((field) => {
                    return row[field].toLocaleLowerCase().indexOf(keyword) >= 0;
                })
            });
        })
      }
    };
    for(let key in Vocab.BootstrapTable){
        if(!Vocab.BootstrapTable.hasOwnProperty(key)){ continue; }
        let name = Vocab.BootstrapTable[key];
        params[key] = ()=>{ return name; };
    }
    $("#fieldskill-table").bootstrapTable(params);
    
    localizeBootstrapTable($("#fieldskill-table"));
    $(".multi-sort")[0].children[0].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-filter" viewBox="0 0 16 16"><path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/></svg>';
    $(".fixed-table-container").css('padding-bottom', '50px');
}

function setupMaxEffects(){
    for(let i in AssetsManager.FieldSkillData){
        for(let j=1;j<99;++j){
            let attr = `AbilityMSkill${j}Id`;
            if(AssetsManager.FieldSkillData[i].hasOwnProperty(attr)){
                MaxEffectsCount = Math.max(MaxEffectsCount, j);
            }
            else{
                break;
            }
        }
    }
    let tr = $("#fieldskill-trhead");
    for(let i=1;i<=MaxEffectsCount;++i){
        let th = $(document.createElement("th"));
        th.attr('id', `th-effect-${i}`);
        th.attr('data-field', `feffect${i}`);
        th.addClass('col-2');
        tr.append(th);
    }
}

function insertFieldSkills(){
    let parent = $('#fieldskill-table');
    for(let i in AssetsManager.FieldSkillData){
        if(!AssetsManager.FieldSkillData.hasOwnProperty(i)){ continue; }
        let data = AssetsManager.FieldSkillData[i];
        let tr = document.createElement('tr');
        tr.id = `fieldskill-${i}`;
        FieldSkillNodes[i] = tr;
        let cells = [];
        for(let i=0;i<4+MaxEffectsCount;++i){
            let node = document.createElement('td');
            cells.push(node);
            tr.append(node);
        }
        let ptname = Vocab.FieldSkillName[i];
        if(!ptname){ ptname = data.Name; }
        let container = AssetsManager.createFieldSkillImageNode(i);
        if(!container){ continue; }
        let a = $(container).children()[0];
        a.href = `${ASSET_HOST}/Textures/Backgrounds/HomePtSkill/${i}.jpg`;
        a.target = '_blank';
        $(cells[0]).append(container);
        $(cells[1]).text(ptname);
        $(cells[2]).text(Vocab.RarityList[data.Rarity]);
        $(cells[3]).text(data.Cost);
        for(let j=1;j<=MaxEffectsCount;++j){
            let attr = `AbilityMSkill${j}Id`;
            let sid = data[attr];
            if(!sid){ continue; }
            if(!AssetsManager.SkillData.hasOwnProperty(sid)){ continue; }
            let skill = AssetsManager.SkillData[sid];
            let sname = Vocab.SkillName[sid];
            let sdesc = Vocab.SkillEffect[sid];
            if(!sname){ sname = skill.Name; }
            if(!sdesc){ sdesc = skill.Description; }
            cells[3+j].innerHTML = `<b>${sname}</b><hr>${sdesc}`;
        }
        parent.append(tr);
        
    }
}

function updateHitCount(){
    let cnt = 0, len = Object.keys(AssetsManager.FieldSkillImageMap).length;
    for(let id in FieldSkillNodes){
        if(document.getElementById(`fieldskill-${id}`)){ cnt += 1; }
    }
    $('#hit-count').text(`(HIT: ${cnt}/${len})`);
  }

(function(){
    window.addEventListener("load", init);
})();