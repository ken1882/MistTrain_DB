const __DerpyStartYear  = 2021;
const __DerpyStartMonth = 4;
let __FlagDataLoaded = {};

// Append monthly race data from current back to first
function createMonthlyGroups(){
  let end_t = new Date();
  let cur_y = end_t.getFullYear(), cur_m = end_t.getMonth()+1;
  let end_y = __DerpyStartYear, end_m = __DerpyStartMonth;
  let parent = $("#history-monthly")
  let last_header = null;
  cur_m += 1;
  while(cur_y != end_y || cur_m != end_m){
    cur_m -= 1;
    if(cur_m == 0){
      cur_m = 12;
      cur_y -= 1;
    }
    month = `${cur_y}/`;
    if(cur_m < 10){ month += `0${cur_m}`; }
    else{ month += `${cur_m}`; }
    let section = $(document.createElement('div'));
    let node = $(document.createElement('div'));
    let header = $(document.createElement('button'));
    header.attr('class', 'btn btn-primary center');
    header.attr('data-bs-toggle', 'collapse');
    header.attr('aria-controls', '');
    header.attr('style', 'width: 100%;');
    header.attr('data-bs-target', `.race-${month.replaceAll('/','-')}`);
    header.text(month);
    registerCollapseIndicator(header);
    node.append(header);
    section.append(node);
    parent.append(section);
    last_header = section;
    appendLoadingIndicator(cur_y, cur_m, last_header);
    __FlagDataLoaded[`${cur_y}-${cur_m}`] = false;
    last_header.prepend(document.createElement('hr'));
    header.on('click', (e)=>{
      var date = $(e.target).attr('data-bs-target');
      if(!date){ return ;}
      var y = parseInt(date.split('-')[1]), m = parseInt(date.split('-')[2]);
      if(!__FlagDataLoaded[`${y}-${m}`]){
        __FlagDataLoaded[`${y}-${m}`] = true;
        $(`#loading-indicator-${y}-${m}`).show();
        $(e.target).prop('disabled', true);
        loadMonthlyRaceData(y, m, $(e.target.parentElement));
        setTimeout(() => {
          $(e.target).prop('disabled', false);
          e.target.click();
        }, 100);
      }
    });
  }
}

function appendLoadingIndicator(year, month, parent){
  let loading_container = $(document.createElement('div'));
  loading_container.attr('class', `spinner-border center race-${year}-${month}`);
  loading_container.attr('id', `loading-indicator-${year}-${month}`);
  loading_container.hide();
  let loading_img = $(document.createElement('span'));
  loading_img.attr('class', 'sr-only');
  loading_container.append(loading_img);
  parent.append(loading_container);
}

function loadMonthlyRaceData(year, month, parent){
  let heading = `${year}-`;
  if(month < 10){ heading += `0${month}_`; }
  else{ heading += `${month}_`; }
  let path = __BaseDerpyDataFilePath.replace('{}', heading);
  processJSON(path,
    (res)=>{
      res = JSON.parse(res);
      for(let i=res.length-1;i>=0;--i){
        let data = res[i];
        createDailyGroups(data, parent);
      }
      $(`#loading-indicator-${year}-${month}`).remove();
    },
    (res)=>{
      console.log(res);
    }
  );
}

function createDailyGroups(data, parent, nested=true){
  times = data.startTime.replaceAll('-','/').split('T');
  date  = times[0].split('/').slice(1).join('/');
  time  = times[1].split(':').slice(0,2).join(':');
  var node = $(document.createElement("div"));
  node.attr('id', `race-${data.id}`);
  if(nested){
    let cls = node.attr('class');
    let month = data.startTime.split('-').slice(0,2).join('-');
    node.attr('class', `${cls} collapse race-${month}`);
  }
  var section = $(document.createElement('div'));
  section.attr('class', 'card card-body');
  var spoiler_btn = $(document.createElement('a'));
  var container_id = `table-container-${data.id}`;
  spoiler_btn.attr('class', 'btn btn-secondary');
  spoiler_btn.attr('data-bs-toggle', 'collapse');
  spoiler_btn.attr('aria-controls', `${container_id}`);
  spoiler_btn.attr('href', `#${container_id}`);
  var race_title = `${date}@${time} ${data.name} ${data.type ? 'ダート' : '芝'} ${1200*(data.range+1)}m `
  race_title += `${data.direction ? '左回り' : '右回り'} ${data.weather ? '雨' : '晴'}`
  spoiler_btn.text(race_title)
  registerCollapseIndicator(spoiler_btn);
  parent.append(node);
  var table_container = $(document.createElement('div'));
  table_container.attr('class', 'collapse');
  table_container.attr('id', `${container_id}`);
  var race_info = $(document.createElement('p'));
  var table = get_race_table(data);
  table_container.append(race_info);
  table_container.append(table);
  section.append(spoiler_btn);
  section.append(table_container);
  node.append(section);
  parent.append(node);
}

function get_race_table(data){
  let table = $(document.createElement('table'));
  table.attr('class', 'table');
  // table.attr('style', 'display: block;')
  let headings = [
    '着',
    '騎番',
    '枠番',
    '人気',
    '名前',
    '予想',
    '作戦',
    '得意',
    'スピ', 
    'スタ', 
    '状態', 
  ];
  let thead = $(document.createElement('thead'));
  let thtr   = $(document.createElement('tr'));
  thead.append(thtr);
  for(let i in headings){
    let name = headings[i];
    let leaf = $(document.createElement('th'));
    leaf.attr('scope', 'col');
    leaf.text(name);
    thtr.append(leaf);
  }
  table.append(thead);
  let tbody = $(document.createElement('tbody'));
  for(let i in data['character']){
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let char = data['character'][i];
    let row = $(document.createElement('th'));
    row.attr('scope', 'row');
    row.text(data['result'][i].rank);
    tbtr.append(row);
    let attrs = [
      'number', 'waku', 'popularity', 'name', 'report',
      'tactics', 'forte', 'speed', 'stamina', 'condition'
    ]
    for(let j in attrs){
      let attr = char[attrs[j]];
      let ele = $(document.createElement('th'));
      ele.text(`${attr}`);
      tbtr.append(ele);
    }
  }
  table.append(tbody);
  return table;
}

window.addEventListener("load", createMonthlyGroups);