let FieldSkillNodes = {};
let MaxEffectsCount = 4;

const ICON_SVG_SWAP = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-arrow-repeat" viewBox="0 0 16 16">
    <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
    <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
</svg>
`;

const PT_LTYPE_NEW_SKILL    = 0;
const PT_LTYPE_COST_DOWN    = 1;
const PT_LTYPE_CHANGE_SKILL = 2;

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
    $('body').on('click', '.pt-swapskill', (e)=>{swapSkillDescription(e)});
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
        if(!AssetsManager.FieldSkillData.hasOwnProperty(i)){ continue; }
        let pt_data = AssetsManager.FieldSkillData[i];
        let cnt = 0;
        for(let sk_data of pt_data.MFieldSkillLevelViewModels){
            if(sk_data.FieldSkillLevelAbilityType == 0){ cnt += 1; }
        }
        MaxEffectsCount = Math.max(MaxEffectsCount, cnt);
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

function swapSkillDescription(e){
    let pt_id    = $(e.currentTarget).attr('pid');
    let cell_idx = $(e.currentTarget).attr('cid');
    let sid_ori  = $(e.currentTarget).attr('val1');
    let sid_upg  = $(e.currentTarget).attr('val2');
    let inode  = `fskill-${pt_id}-cell-${cell_idx}`;
    let inname = `fskill-${pt_id}-cell-${cell_idx}-name`;
    let indesc = `fskill-${pt_id}-cell-${cell_idx}-desc`;
    let skill_ori = AssetsManager.SkillData[sid_ori];
    let skill_upg = AssetsManager.SkillData[sid_upg];
    let cell = $(`#${inode}`);
    if((cell.attr('class') || '').includes('change-skill')){
        cell.removeClass('change-skill');
        $(`#${inname}`).text(skill_ori.Name);
        $(`#${indesc}`).text(skill_ori.Description);
    }
    else{
        cell.addClass('change-skill');
        $(`#${inname}`).text(skill_upg.Name);
        $(`#${indesc}`).text(skill_upg.Description);
    }
    let swap_icon = $(`#${inode}`).children()[1];
    if($(swap_icon).attr('class') == 'change-skill'){
        $(swap_icon).removeClass('change-skill');
        $(swap_icon).addClass('normal-skill');
    }
    else{
        $(swap_icon).addClass('change-skill');
        $(swap_icon).removeClass('normal-skill');
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
        let cell_idx = 4;
        // console.log(cells, data);
        if(data.hasOwnProperty('MFieldSkillLevelViewModels')){
            data.MFieldSkillLevelViewModels = data.MFieldSkillLevelViewModels.sort(
                (a,b) => {return a.Level - b.Level}
            );
            for(let dat of data.MFieldSkillLevelViewModels){
                let type = dat.FieldSkillLevelAbilityType;
                let skill = null;
                let sname = '';
                let sdesc = '';
                let node  = $(document.createElement('div'));
                let inode = `fskill-${i}-cell-${cell_idx}`;
                node.attr('id', inode);
                if(type != PT_LTYPE_NEW_SKILL){ continue; }
                if((dat.EvolutionCount || 0) > 0){
                    node.addClass('change-skill');
                }
                let skid = dat.Value1;
                skill = AssetsManager.SkillData[skid];
                sname = Vocab.SkillName[skid];
                sdesc = Vocab.SkillEffect[skid];
                if(!sname){ sname = skill.Name; }
                if(!sdesc){ sdesc = skill.Description; }
                let nname = $("<b>").text(sname);
                let nhr = $("<hr>");
                let ndesc = $("<span>").text(sdesc);
                let inname = `fskill-${i}-cell-${cell_idx}-name`;
                let indesc = `fskill-${i}-cell-${cell_idx}-desc`;
                nname.attr('id', inname);
                ndesc.attr('id', indesc);
                node.append(nname);
                // setup upgraded skill swap
                for(let dat2 of data.MFieldSkillLevelViewModels){
                    if(dat2.FieldSkillLevelAbilityType != PT_LTYPE_CHANGE_SKILL){ continue; }
                    if(dat2.Value1 != dat.Value1){ continue; }
                    if(!dat2.Value2){
                        console.error(`Missing upgraded skill id for ${sname}:${dat.Value1}`);
                        continue;
                    }
                    let swap_icon = $(document.createElement('span'));
                    swap_icon.html(ICON_SVG_SWAP);
                    $(swap_icon).addClass('change-skill');
                    node.append(swap_icon);
                    node.addClass('pt-swapskill');
                    node.attr('pid', data.Id);
                    node.attr('cid', cell_idx);
                    node.attr('val1', dat2.Value1);
                    node.attr('val2', dat2.Value2);
                }
                node.append(nhr, ndesc);
                $(cells[cell_idx]).append(node);
                cell_idx += 1;
            }
        }
        else{
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