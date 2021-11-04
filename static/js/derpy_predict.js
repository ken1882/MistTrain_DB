function get_race_table(data){
  let table = $(document.createElement('table'));
  table.attr('class', 'table');
  // table.attr('style', 'display: block;')
  let headings = [
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

function getNextRaceData(){
  $.ajax({
    url: "/api/GetNextRace",
    success: (res) => {
      debug_log(res);
      setupCountdown(res);
      fillContent(res);
      getPredictionMatrix();
    },
    error: (res) => {
      debug_log(res);
    }
  });
}

function getPredictionMatrix(){
  $.ajax({
    url: "/api/GetNextRacePredition",
    success: (res) => {
      debug_log(res);
      fillPreditionMatrix(res);
    },
    error: (res) => {
      debug_log(res);
    }
  });
}

function setupCountdown(race){
  if(!DataManager.isReady()){
    return setTimeout(() => {
      setupCountdown(race);
    }, 300);
  }
  var jp_zone = -60 * 9 * 60;
  var cur_zone = new Date().getTimezoneOffset() * 60;
  var flipdown = new FlipDown(
    race.timestamp - (cur_zone - jp_zone),
    {
      theme: 'light',
      headings: [
        Vocab['Day'],
        Vocab['Hour'],
        Vocab['Minute'],
        Vocab['Second']
      ]
    }
  );
  flipdown.start();
  $("#loading-indicator").remove();
}

function fillContent(race){
  data = race.schedule;
  let title = data.name;
  title += ` ${data.type == 0 ? '芝' : 'ダート'}`
  title += ` ${1200*(data.range+1)}m`
  title += ` ${data.direction == 0 ? '右回り' : '左回り'}`
  title += ` ${data.weather == 0 ? '晴' : '雨'}`
  $("#race-title").text(title);
  document.getElementById('race-message').innerHTML = race.hiRate.replace('。','。<br>');
  $("#uma-base-stats").append(get_race_table(data))
  $("#loading-indicator2").remove();
  $("#info-section").attr('style', '');
}

function fillPreditionMatrix(data){
  let table = $(document.createElement('table'));
  table.attr('class', 'table');
  // table.attr('style', 'display: block;')
  let headings = ['騎番 ▶'];
  let size_n = data[0].length;
  for(let i=1;i<=size_n;++i){
    headings.push(i);
  }
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
  for(let i in data){
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let preditions = data[i];
    for(let j=0;j<=preditions.length;++j){
      var attr;
      if(j == 0){
        attr = `${Vocab['Predition']} ${parseInt(i)+1} ▶`;
      }
      else{ attr = preditions[j-1]; }
      let ele = $(document.createElement('th'));
      ele.text(`${attr}`);
      tbtr.append(ele);
    }
  }
  table.append(tbody);
  $("#uma-preditions").append(table);
  $("#loading-indicator3").remove();
  $("#predict-section").attr('style', '');
}

function start(){
  getNextRaceData();
}

window.addEventListener("load", start);