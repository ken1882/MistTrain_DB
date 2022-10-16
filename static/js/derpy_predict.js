let ModelAccuracy = [];
let NextRaceData = {};

function getRaceTable(data){
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

function getTanFukushoTable(race){
  let data = race.schedule;
  let table = $(document.createElement('table'));
  table.attr('class', 'table');
  let headings = [
    '枠番',
    '騎番',
    '名前',
    Vocab['Tansho'],
    Vocab['Fukusho'], 
  ];
  let thead = $(document.createElement('thead'));
  let thtr   = $(document.createElement('tr'));
  thead.append(thtr);
  for(let i in headings){
    let title = headings[i];
    let leaf = $(document.createElement('th'));
    leaf.attr('scope', 'col');
    leaf.text(title);
    thtr.append(leaf);
  }
  table.append(thead);
  let tbody = $(document.createElement('tbody'));
  for(let i in data['character']){
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let char = data['character'][i];
    let waku = $(document.createElement('th'));
    waku.text(`${char.waku}`);
    tbtr.append(waku);
    let number = $(document.createElement('th'));
    number.text(`${char.number}`);
    tbtr.append(number);
    let name = $(document.createElement('th'));
    name.text(`${char.name}`);
    tbtr.append(name);
    let tansho = $(document.createElement('th'));
    tansho.text(`${race.odds.tansho[char.number]}`);
    tbtr.append(tansho);
    let fukusho = $(document.createElement('th'));
    fukusho.text(`${race.odds.fukusho[char.number]}`);
    tbtr.append(fukusho);
  }
  console.log(race.odds.tansho);
  console.log(race.odds.fukusho);
  table.append(tbody);
  return table;
}

function getWakurenTable(race){
  let table = $(document.createElement('table'));
  let thead = $(document.createElement('thead'));
  let thtr   = $(document.createElement('tr'));
  table.attr('class', 'table');
  let headings = [''];
  for(let i=0;i<race.character.length;++i){
    let w = race.character[i].waku;
    if(!headings.includes(w)){
      headings.push(w)
    }
  }
  for(let i in headings){
    let leaf = $(document.createElement('th'));
    leaf.attr('scope', 'col');
    leaf.attr('style', 'font-weight: bold; text-align: center;')
    leaf.text(headings[i]);
    if(i == 0){ leaf.text(Vocab['Waku']); }
    thtr.append(leaf);
  }
  thead.append(thtr);
  table.append(thead);
  let tbody = $(document.createElement('tbody'));
  let ele_matrix = [];
  for(let number in headings){
    number = headings[number];
    if(!number){continue;}
    let row = [];
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let num2 = $(document.createElement('th'));
    num2.text(`${number}`);
    num2.attr('style', 'font-weight: bold; text-align: center;')
    tbtr.append(num2);
    for(let _ in headings){
      let leaf = $(document.createElement('th'));
      leaf.attr('style', 'text-align: center;')
      row.push(leaf);
      tbtr.append(leaf);
    }
    ele_matrix.push(row);
  }
  for(let first in headings){
    first = headings[first];
    if(!first){ continue; }
    for(let second in headings){
      second = headings[second];
      if(!second){ continue; }
      let key = `${first}-${second}`;
      if(race.odds.wakuren[key]){
        ele_matrix[second-1][first-1].text(race.odds.wakuren[key]);
      }
      else if(first == second){
        ele_matrix[second-1][first-1].text('-');
      }
    }
  }
  table.append(tbody);
  return table;
}

function getUmarenTable(race){
  let table = $(document.createElement('table'));
  let thead = $(document.createElement('thead'));
  let thtr   = $(document.createElement('tr'));
  table.attr('class', 'table');
  let headings = [''];
  for(let i=0;i<race.character.length;++i){
    let w = race.character[i].number;
    if(!headings.includes(w)){
      headings.push(w)
    }
  }
  for(let i in headings){
    let leaf = $(document.createElement('th'));
    leaf.attr('scope', 'col');
    leaf.attr('style', 'font-weight: bold; text-align: center;')
    leaf.text(headings[i]);
    if(i == 0){ leaf.text(Vocab['DerpyNumber']); }
    thtr.append(leaf);
  }
  thead.append(thtr);
  table.append(thead);
  let tbody = $(document.createElement('tbody'));
  let ele_matrix = [];
  for(let number in headings){
    number = headings[number];
    if(!number){continue;}
    let row = [];
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let num2 = $(document.createElement('th'));
    num2.text(`${number}`);
    num2.attr('style', 'font-weight: bold; text-align: center;')
    tbtr.append(num2);
    for(let _ in headings){
      let leaf = $(document.createElement('th'));
      leaf.attr('style', 'text-align: center;')
      row.push(leaf);
      tbtr.append(leaf);
    }
    ele_matrix.push(row);
  }
  for(let first in headings){
    first = headings[first];
    if(!first){ continue; }
    for(let second in headings){
      second = headings[second];
      if(!second){ continue; }
      let key = `${first}-${second}`;
      if(race.odds.umaren[key]){
        ele_matrix[second-1][first-1].text(race.odds.umaren[key]);
      }
      else if(first == second){
        ele_matrix[second-1][first-1].text('-');
      }
    }
  }
  table.append(tbody);
  return table;
}

function getUmatanTable(race){
  let table = $(document.createElement('table'));
  let thead = $(document.createElement('thead'));
  let thtr   = $(document.createElement('tr'));
  table.attr('class', 'table');
  let headings = [''];
  for(let i=0;i<race.character.length;++i){
    let w = race.character[i].number;
    if(!headings.includes(w)){
      headings.push(w)
    }
  }
  for(let i in headings){
    let leaf = $(document.createElement('th'));
    leaf.attr('scope', 'col');
    leaf.attr('style', 'font-weight: bold; text-align: center;')
    leaf.text(headings[i]);
    if(i == 0){ leaf.text(Vocab['DerpyNumber']); }
    thtr.append(leaf);
  }
  thead.append(thtr);
  table.append(thead);
  let tbody = $(document.createElement('tbody'));
  let ele_matrix = [];
  for(let number in headings){
    number = headings[number];
    if(!number){continue;}
    let row = [];
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let num2 = $(document.createElement('th'));
    num2.text(`${number}`);
    num2.attr('style', 'font-weight: bold; text-align: center;')
    tbtr.append(num2);
    for(let _ in headings){
      let leaf = $(document.createElement('th'));
      leaf.attr('style', 'text-align: center;')
      row.push(leaf);
      tbtr.append(leaf);
    }
    ele_matrix.push(row);
  }
  for(let first in headings){
    first = headings[first];
    if(!first){ continue; }
    for(let second in headings){
      second = headings[second];
      if(!second){ continue; }
      let key = `${first}-${second}`;
      if(race.odds.umatan[key]){
        ele_matrix[second-1][first-1].text(race.odds.umatan[key]);
      }
      else if(first == second){
        ele_matrix[second-1][first-1].text('-');
      }
    }
  }
  table.append(tbody);
  return table;
}

function getModelAccuracy(){
  return $.ajax({
    url: "/static/json/derpy_accuracy.json",
    success: (res) => {
      ModelAccuracy = res;
    },
    error: handleAjaxError,
  });
}

function getNextRaceData(){
  $.ajax({
    url: "/api/GetNextRace",
    success: (res) => {
      debug_log(res);
      NextRaceData = res;
      setupCountdown(res);
      fillContent(res);
      getPredictionMatrix();
    },
    error: handleAjaxError,
  });
}

function getPredictionMatrix(){
  $.ajax({
    url: "/api/GetNextRacePrediction",
    success: (res) => {
      debug_log(res);
      fillPredictionMatrix(res);
    },
    error: handleAjaxError,
  });
}

function setupCountdown(race){
  if(!DataManager.isReady()){
    return setTimeout(() => {
      setupCountdown(race);
    }, 300);
  }
  var magic_offset = 1140;
  var flipdown = new FlipDown(
    race.timestamp + magic_offset, // magic
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
  if(isClassOf(race.odds, Array)){
    race.odds = race.odds[0];
  }
  data = race.schedule;
  let title = data.name;
  title += ` ${data.type == 0 ? '芝' : 'ダート'}`
  title += ` ${1200*(data.range+1)}m`
  title += ` ${data.direction == 0 ? '右回り' : '左回り'}`
  title += ` ${data.weather == 0 ? '晴' : '雨'}`
  $("#race-title").text(title);
  document.getElementById('race-message').innerHTML = race.hiRate.replace('。','。<br>');
  $("#uma-base-stats").append(getRaceTable(data));
  $("#table-tanfukusho").append(getTanFukushoTable(race));
  $("#table-wakuren").append(getWakurenTable(race));
  $("#table-umaren").append(getUmarenTable(race));
  $("#table-umatan").append(getUmatanTable(race));

  $("#loading-indicator2").remove();
  $("#info-section").attr('style', '');
  $("#loading-indicator4").remove();
  $("#odds-section").attr('style', '');
}

function fillPredictionMatrix(data){
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
  let nth_mat = []
  let scores = [];
  for(let i in data){
    let tbtr  = $(document.createElement('tr'));
    tbody.append(tbtr);
    let preditions = data[i];
    let places = [];
    for(let j=0;j<=preditions.length;++j){
      var attr;
      if(j == 0){
        attr = `${Vocab['Prediction']} ${parseInt(i)+1} ▶`;
      }
      else{
        attr = preditions[j-1]; 
        places.push(attr);
        if(i == 0){
          // Score based on popularity
          let base = (20 - NextRaceData.character[j-1].popularity) * (1+ModelAccuracy[0]);
          scores.push(base);
        }
      }
      let ele = $(document.createElement('th'));
      ele.text(`${attr}`);
      tbtr.append(ele);
    }
    nth_mat.push(places);
  }
  // final place summary
  for(let i in nth_mat){
    for(let j in nth_mat[i]){
      i = parseInt(i);
      scores[j] += (20 - nth_mat[i][j]) * (1+ModelAccuracy[i+1]);
    }
  }
  console.log(scores);
  scores_ord = clone(scores);
  scores_ord.sort((a, b)=>{return b - a;})
  let fstr  = $(document.createElement('tr'));
  tbody.prepend(fstr);
  let ftxts = [Vocab.FinalRanking+' ▶']
  for(let i in scores){
    ftxts.push(scores_ord.indexOf(scores[i])+1);
  }
  for(let ss of ftxts){
    let ele = $(document.createElement('th'));
    ele.text(`${ss}`);
    fstr.append(ele);
  }

  table.append(tbody);
  $("#uma-preditions").append(table);
  $("#loading-indicator3").remove();
  $("#predict-section").attr('style', '');
}

function start(){
  if(!DataManager.isReady()){
    return setTimeout(() => {
      start();
    }, 300);
  }
  registerCollapseIndicator($("#header-riders"));
  registerCollapseIndicator($("#header-preditions"));
  registerCollapseIndicator($("#header-odds"));
  registerCollapseIndicator($("#header-tanfukusho"));
  registerCollapseIndicator($("#header-wakuren"));
  registerCollapseIndicator($("#header-umaren"));
  registerCollapseIndicator($("#header-umatan"));
  getNextRaceData();
}

getModelAccuracy();
window.addEventListener("load", start);