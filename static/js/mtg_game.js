const DMM_CK_KEY = 'DMM_B64CK';
const MTG_TOKEN_KEY = 'MTG_TOKEN';
const MTG_SERVER_KEY = 'MTG_HOST';
const ORIGIN_MASQUERADE = 'https://mist-production-api-001.mist-train-girls.com';

let FlagConnLock = false;

function init_mtggame(){
    if(!DataManager.isReady()){
        return setTimeout(init_mtggame, 500);
    }
    injectExtensionTokenInput();
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

async function* asyncIteror(iterable) {
    yield iterable;
}

async function unpackResponse(buffer){
    let ret = [];
    for await (const item of MessagePack.decodeMultiStream(asyncIteror(buffer))){
        ret.push(item);
    }
    return ret;
}

function injectExtensionTokenInput(){
    let ina = $(document.createElement('input'));
    let inb = $(document.createElement('input'));
    ina.prop('type', 'hidden').prop('id', 'inp-ext-token-a');
    inb.prop('type', 'hidden').prop('id', 'inp-ext-token-b');
    ina.on('change', onExtensionInputChange);
    inb.on('change', onExtensionInputChange);
    $('body').append(ina);
    $('body').append(inb);
}

function onExtensionInputChange(){
    let ta = $('#inp-ext-token-a').val();
    let tb = $('#inp-ext-token-b').val();
    if(ta && tb && !isLoggedIn()){
        FlagConnLock = true;
        $("#conn-icon").css('display', 'none');
        $("#conid-game").css('display', '');
        $.ajax({
            url: "/api/GetOAuthToken",
            method: 'POST',
            data: {
                token_a: ta,
                token_b: tb
            },
            success: (res) => {
                saveMTGServer(res.server);
                saveMTGToken(res.token);
                fetchPlayerProfile().then(()=>{
                    reloadProfile();
                    let p = DataManager.playerProfile;
                    FlagConnLock = false;
                }).catch(() => {
                    console.log("Ajax failed");
                    reloadProfile();
                    FlagConnLock = false;
                });
            },
            error: (res) => {
                console.log(res);
                if(res.status == 429){
                    alert(Vocab.RateLimited);
                }
                else{
                    var ret = res.responseJSON;
                    var msg = Vocab.LoginFailed;
                    if(ret.msg){
                        msg += "\n\n"+ret.msg;
                    }
                    alert(msg);
                }
                FlagConnLock = false;
                window.location = window.location;
            },
        });
    }
}

function checkGameConnection(){
    if(FlagConnLock){ return ; }
    if(!getMTGServer()){
        return handleNotLoggedin();
    }
    FlagConnLock = true;
    $("#conn-icon").css('display', 'none');
    $("#conid-game").css('display', '');
    fetchPlayerProfile().then(()=>{
        console.log("Ajax done");
        reloadProfile();
        let p = DataManager.playerProfile;
        alert(`${Vocab.GameLoginOK}\n${Vocab.Name}: ${p.Name} (Lv.${p.Level})`)
        FlagConnLock = false;
    }).catch((e) => {
        console.log("Ajax failed", e);
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

function getMTGServer(cached=true){
    let ret = DataManager.getSetting(MTG_SERVER_KEY);
    if(!ret || !cached){
        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/game_server', false);
        xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
        xhr.send(null);
        let uri = JSON.parse(xhr.response)['uri'];
        xhr.abort();
        if(uri){
            saveMTGServer(uri);
            ret = uri;
        }
    }
    return ret;
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
    fetchPlayerProfile().then(()=>{
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

function sendMTG(payload) {
    return new Promise((resolve, reject) => {
        if (!payload.headers) {
            payload.headers = {
                Accept: 'application/vnd.msgpack',
            };
        }
        payload.headers['Origin'] = ORIGIN_MASQUERADE;
        payload.headers['Referer'] = ORIGIN_MASQUERADE;
        payload.headers['Authorization'] = getMTGToken();
        payload.xhrFields = { responseType: 'arraybuffer' };
        payload.url = getMTGServer() + payload.url;
        $.ajax(payload)
            .done((data, textStatus, jqXHR) => {
                // Only resolve if the status code is 2XX
                if (parseInt(jqXHR.status / 100) == 2) {
                    resolve(data);
                } else {
                    reject(new Error(`Request failed with status code ${jqXHR.status}`));
                }
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                reject(new Error(`Request failed: ${textStatus}, ${errorThrown}`));
            });
    });
}

function handleNotLoggedin(){
    let msg = Vocab.NotLogin + '\n\n';
    msg += Vocab.ReloginDMM;
    let cont = window.confirm(msg);
    if(cont){
        window.location = `/dmmlogin?loginback=${window.location.pathname}`;
    }
    msg += Vocab.ForceAuthPluginLogin;
    alert(msg);
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

async function fetchPlayerProfile(){
    try{
        const [profileResponse, preferencesResponse] = await Promise.all([
            sendMTG({ url: '/api/Users/Me', method: 'GET' }),
            sendMTG({ url: '/api/Users/MyPreferences', method: 'GET' }),
        ]);
        let profileData = await unpackResponse(profileResponse);
        let preferencesData = await unpackResponse(preferencesResponse);
        profileData = parseProfileData(profileData[1]);
        preferencesData = parseUserPreference(preferencesData[1]);
        DataManager.updateProfile(profileData);
        DataManager.updateProfile(preferencesData);
    } catch (error) {
        console.error('Error fetching player profile:', error);
        throw error;
    }
}

async function fetchCharacters(){
    try{
        const [characterResponse] = await Promise.all([
            sendMTG({url: '/api/UCharacters', method: 'GET' })
        ]);

        let characterData = await unpackResponse(characterResponse);
        let data = [];
        for(let dat of characterData[1]){
            data.push(parseUCharacter(dat));
        }
        DataManager.dataCharacters = data;
      } catch (error) {
        console.error('Error fetching characters:', error);
      }
}

function fetchInventory(){
    return;
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
        }),
        sendMTG({
            url: '/api/UFieldSkills',
            method: 'GET',
            success: (res) => {
                DataManager.dataFieldSkills = res.r;
            },
            error: (res)=>{console.error(res)}
        }),
        sendMTG({
            url: '/api/UFormations',
            method: 'GET',
            success: (res) => {
                DataManager.dataFormations = res.r;
            },
            error: (res)=>{console.error(res)}
        })
    ];
}

function fetchBackgroundParty(){
    return;
    return sendMTG({
        url: '/api/Battle/GetBackGroundAutoPlayProgress',
        method: 'GET',
        success: (res) => {
            DataManager.dataBackgroundParty = res.r;
        },
        error: (res)=>{console.error(res)},
    });
}

function loadCharacters(){
    if(FlagConnLock){ return ;}
    if(!getMTGServer()){
        return handleNotLoggedin();
    }
    FlagConnLock = true;
    $("#conid-chars").css('display', '');
    fetchCharacters().then(()=>{
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
    return;
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
    xhr.setRequestHeader('Accept', 'application/vnd.msgpack');
    xhr.setRequestHeader('Origin', ORIGIN_MASQUERADE);
    xhr.setRequestHeader('Referer', ORIGIN_MASQUERADE);
    xhr.setRequestHeader('Authorization', getMTGToken());
    xhr.send(null);
    let ret_code = xhr.status;
    xhr.abort()
    return ret_code == 200;
}