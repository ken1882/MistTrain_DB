const DMM_CK_KEY = 'DMM_B64CK';
const MTG_TOKEN_KEY = 'MTG_TOKEN';
const MTG_SERVER_KEY = 'MTG_HOST';
const ORIGIN_MASQUERADE = 'https://assets.mist-train-girls.com';
const PROFILE_KEY = 'MTG_PROFILE';

let PlayerProfile = {};
let FlagConnLock = false;

function init_mtggame(){
    if(!DataManager.isReady()){
        return setTimeout(init_mtggame, 500);
    }
    reloadProfile();
    $("#chk-conn").on('click', ()=>{
        if(FlagConnLock){ return ; }
        FlagConnLock = true;
        $("#conn-icon").css('display', 'none');
        $("#conn-indicator").css('display', '');
        Promise.all(fetchPlayerProfile()).then(()=>{
            console.log("Ajax done");
            reloadProfile();
            alert(`${Vocab.GameLoginOK}\n${Vocab.Name}: ${PlayerProfile.Name} (Lv.${PlayerProfile.Level})`)
            FlagConnLock = false;
        }).catch(() => {
            console.log("Ajax failed");
            reloadProfile();
            alert(Vocab.GameLoginFailed+'\n\n'+Vocab.GameLoginFailed2);
            FlagConnLock = false;
        });
    });
}

function reloadProfile(){
    PlayerProfile = DataManager.getSetting(PROFILE_KEY) || {};
    let pname  = PlayerProfile.Name || '-';
    let plevel = PlayerProfile.Level || '-';
    $("#prof-name").text(`${Vocab.Name}: ${pname}`);
    $("#prof-level").text(`Lv.: ${plevel}`);
    $("#conn-icon").css('display', '');
    $("#conn-indicator").css('display', 'none');
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
        success: processGameLogin,
        error: (res) => {
            console.log(res);
            if(res.status == 429){
                alert(Vocab.RateLimited);
            }
            else{
                alert(Vocab.LoginFailed);
            }
            window.location = window.location;
        },
    });
}


function processGameLogin(ret){
    saveMTGServer(ret.server);
    saveMTGToken(ret.mtg_token);
    verifyGameLogin();
}

function verifyGameLogin(){
    Promise.all(fetchPlayerProfile()).then(()=>{
        console.log("Ajax done");
        var u = new URL(window.location.href);
        var path = u.searchParams.get('loginback');
        console.log(path);
        if(!path || path.includes('http')){ path = '/'; }
        alert(`${Vocab.GameLoginOK}\n${Vocab.Name}: ${PlayerProfile.Name} (Lv.${PlayerProfile.Level})`)
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

function handleGameConnectionError(res){
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
        
    }
}

function fetchPlayerProfile(){
    DataManager.changeSetting(PROFILE_KEY, {});
    return [
        sendMTG({
            url: '/api/Users/Me',
            method: 'GET',
            success: (res) => {
                PlayerProfile = Object.assign({}, PlayerProfile, res.r);
                DataManager.changeSetting(PROFILE_KEY, PlayerProfile);
            },
            error: (res)=>{console.error(res)},
        }),
        sendMTG({
            url: '/api/Users/MyPreferences',
            method: 'GET',
            success: (res) => {
                PlayerProfile = Object.assign({}, PlayerProfile, res.r);
                DataManager.changeSetting(PROFILE_KEY, PlayerProfile);
            },
            error: handleGameConnectionError,
        }),
    ];
}

window.addEventListener('load', init_mtggame);