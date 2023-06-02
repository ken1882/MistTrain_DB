const DMM_CK_KEY = 'DMM_B64CK';
const MTG_TOKEN_KEY = 'MTG_TOKEN';
const MTG_SERVER_KEY = 'MTG_HOST';
const ORIGIN_MASQUERADE = 'https://assets.mist-train-girls.com';

let FlagConnLock = false;

function init_mtggame(){
    if(!DataManager.isReady()){
        return setTimeout(init_mtggame, 500);
    }
    reloadProfile();
    $("#chk-conn").on('click', checkGameConnection);
    $("#conn-chars").on('click', loadCharacters);
    $("#conn-items").on('click', loadInventory);
    if(isMobile){
        $("#profile-dropdown").addClass('dropend');
    }
    else{
        $("#profile-dropdown").addClass('dropstart');
    }
}
window.addEventListener('load', init_mtggame);


function checkGameConnection(){
    if(FlagConnLock){ return ; }
    if(!getMTGServer()){
        return handleNotLoggedin();
    }
    FlagConnLock = true;
    $("#conn-icon").css('display', 'none');
    $("#conid-game").css('display', '');
    Promise.all(fetchPlayerProfile()).then(()=>{
        console.log("Ajax done");
        reloadProfile();
        let p = DataManager.playerProfile;
        alert(`${Vocab.GameLoginOK}\n${Vocab.Name}: ${p.Name} (Lv.${p.Level})`)
        FlagConnLock = false;
    }).catch(() => {
        console.log("Ajax failed");
        reloadProfile();
        alert(Vocab.GameLoginFailed+'\n\n'+Vocab.GameLoginFailed2);
        handleGameConnectionError();
        FlagConnLock = false;
    });
}

function reloadProfile(){
    let p = DataManager.playerProfile;
    let pname  = p.Name || '-';
    let plevel = p.Level || '-';
    $("#prof-name").text(`${Vocab.Name}: ${pname}`);
    $("#prof-level").text(`Lv.: ${plevel}`);
    $("#conn-icon").css('display', '');
    $("#conid-game").css('display', 'none');
}

function saveDMMLogin(b64ck){
    DataManager.changeSetting(DMM_CK_KEY, b64ck);
}

function getDMMLogin(){
    return DataManager.getSetting(DMM_CK_KEY);
}

function saveMTGToken(token){
    DataManager.changeSetting(MTG_TOKEN_KEY, token);
}

function getMTGToken(){
    return DataManager.getSetting(MTG_TOKEN_KEY);
}

function saveMTGServer(loc){
    return DataManager.changeSetting(MTG_SERVER_KEY, loc);
}

function getMTGServer(){
    return DataManager.getSetting(MTG_SERVER_KEY);
}

function refreshMTGToken(){
    $.ajax({
        url: "/api/login/game",
        method: 'POST',
        data: {
            b64ck: getDMMLogin(),
        },
        success: (res)=>{
            processGameLogin(res, window.location.pathname);
        },
        error: (res) => {
            console.log(res);
            if(res.status == 429){
                alert(Vocab.RateLimited);
            }
            else{
                alert(Vocab.LoginFailed);
            }
            window.location.reload();
        },
    });
}


function processGameLogin(ret, back='/'){
    saveMTGServer(ret.server);
    saveMTGToken(ret.mtg_token);
    verifyGameLogin(back);
}

function verifyGameLogin(back='/'){
    Promise.all(fetchPlayerProfile()).then(()=>{
        console.log("Ajax done");
        var u = new URL(window.location.href);
        var path = u.searchParams.get('loginback') || back;
        if(!path || path.includes('http')){ path = '/'; }
        let p = DataManager.playerProfile;
        alert(`${Vocab.GameLoginOK}\n${Vocab.Name}: ${p.Name} (Lv.${p.Level})`)
        window.location = path;
    }).catch(() => {
        console.log("Ajax failed");
        alert(Vocab.GameLoginFailed+'\n\n'+Vocab.GameLoginFailed2);
    });
}

function sendMTG(payload){
    if(!payload.headers){
        payload.headers = {
            Accept: 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
        };
    }
    payload.headers['Origin']  = ORIGIN_MASQUERADE;
    payload.headers['Referer'] = ORIGIN_MASQUERADE;
    payload.headers['Authorization'] = getMTGToken();
    payload.url = getMTGServer()+payload.url;
    return $.ajax(payload);
}

function handleNotLoggedin(){
    let msg = Vocab.NotLogin + '\n\n';
    msg += Vocab.ReloginDMM;
    let cont = window.confirm(msg);
    if(cont){
        window.location = `/dmmlogin?loginback=${window.location.pathname}`;
    }
}

function handleGameConnectionError(res){
    // this pop should display last
    console.error(res);
    let b64ck = getDMMLogin();
    let msg = Vocab.GameLoginFailed + '\n';
    if(b64ck){
        msg += Vocab.LoginSavedDMM;
    }
    else{
        msg += Vocab.ReloginDMM;
    }
    let cont = window.confirm(msg);
    if(cont){
        if(b64ck){
            refreshMTGToken();
        }
        else{
            window.location = `/dmmlogin?loginback=${window.location.pathname}`;
        }
    }
    else{
        var t = window.prompt(Vocab.AskOuathLogin);
        if(t.includes('Bearer')){
            saveMTGToken(t);
            verifyGameLogin(window.location.pathname);
        }
    } 
}

function fetchPlayerProfile(){
    // DataManager.playerProfile = {};
    return [
        sendMTG({
            url: '/api/Users/Me',
            method: 'GET',
            success: (res) => {
                DataManager.updateProfile(res.r)
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/Users/MyPreferences',
            method: 'GET',
            success: (res) => {
                DataManager.updateProfile(res.r)
            },
            error: (res)=>{console.error(res)},
        }),
    ];
}

function fetchCharacters(){
    return [
        sendMTG({
            url: '/api/UCharacters',
            method: 'GET',
            success: (res) => {
                DataManager.dataCharacters = res.r;
            },
            error: (res)=>{console.error(res)},
        })
    ];
}

function fetchInventory(){
    return [
        sendMTG({
            url: '/api/UItems',
            method: 'GET',
            success: (res) => {
                DataManager.dataItems = res.r;
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/UWeapons',
            method: 'GET',
            success: (res) => {
                DataManager.dataWeapons = res.r;
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/UArmors',
            method: 'GET',
            success: (res) => {
                DataManager.dataArmors = res.r;
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/UAccessories',
            method: 'GET',
            success: (res) => {
                DataManager.dataAccessories = res.r;
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/UAbilityStones',
            method: 'GET',
            success: (res) => {
                DataManager.dataAbstone = res.r;
            },
            error: (res)=>{console.error(res)},
        })
    ];
}

function loadCharacters(){
    if(FlagConnLock){ return ;}
    if(!getMTGServer()){
        return handleNotLoggedin();
    }
    FlagConnLock = true;
    $("#conid-chars").css('display', '');
    Promise.all(fetchCharacters()).then(()=>{
        var msg = `${Vocab.LoadCharactersOK}\n${Vocab.Amount}: ${DataManager.dataCharacters.length}`;
        $("#conid-chars").css('display', 'none');
        alert(msg);
        FlagConnLock = false;
    }).catch(()=>{
        $("#conid-chars").css('display', 'none');
        handleGameConnectionError();
        FlagConnLock = false;
    });
}

function loadInventory(){
    if(FlagConnLock){ return ;}
    if(!getMTGServer()){
        return handleNotLoggedin();
    }
    $("#conid-items").css('display', '');
    Promise.all(fetchInventory()).then(()=>{
        var msg = `${Vocab.LoadInventoryOK}, ${Vocab.Amount}:\n`;
        msg += `${Vocab.Item}: ${DataManager.dataItems.length}\n`;
        msg += `${Vocab.Weapon}: ${DataManager.dataWeapons.length}\n`;
        msg += `${Vocab.Armor}: ${DataManager.dataArmors.length}\n`;
        msg += `${Vocab.Accessory}: ${DataManager.dataAccessories.length}\n`;
        msg += `${Vocab.ABStone}: ${DataManager.dataAbstone.length}\n`;
        $("#conid-items").css('display', 'none');
        alert(msg);
        FlagConnLock = false;
    }).catch(()=>{
        $("#conid-items").css('display', 'none');
        handleGameConnectionError();
        FlagConnLock = false;
    });
}

function isLoggedIn(){
    let xhr = new XMLHttpRequest();
    let host = getMTGServer();
    if(!host){ return false; }
    if(!getMTGToken()){ return false; }
    xhr.open('GET', getMTGServer()+'/api/Users/Me', false);
    xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
    xhr.setRequestHeader('Accept-Encoding', 'gzip, deflate, br');
    xhr.setRequestHeader('Connection', 'keep-alive');
    xhr.setRequestHeader('Origin', ORIGIN_MASQUERADE);
    xhr.setRequestHeader('Referer', ORIGIN_MASQUERADE);
    xhr.setRequestHeader('Authorization', getMTGToken());
    xhr.send(null);
    let ret_code = xhr.status;
    xhr.abort()
    return ret_code == 200;
}