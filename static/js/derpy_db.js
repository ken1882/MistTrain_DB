function createMonthlyGroups(){
  let data = window.__DerpyData;
  let parent = $("#history-monthly")
  let headers = [];
  let last_header = null;
  for(let i in data){
    month = data[i].startTime.split('-').slice(0,2).join('/');
    if(!headers.includes(month)){
      let section = $(document.createElement('div'));
      let node = $(document.createElement('div'));
      let header = $(document.createElement('a'));
      header.attr('class', 'btn btn-primary center');
      header.attr('data-bs-toggle', 'collapse');
      header.attr('aria-controls', '');
      header.attr('data-bs-target', `.race-${month.replaceAll('/','-')}`);
      header.text(month);
      node.append(header);
      section.append(node);
      parent.append(section);
      headers.push(month);
      last_header = section;
      last_header.append(document.createElement('hr'));
    }
    createDailyGroups(data[i], last_header);
  }
  $("#loading-indicator").remove();
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
  parent.prepend(node);
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