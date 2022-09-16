let B64ck = '';
let Token = '';
let LoginLock = false, TotpLock = false;

const DEFAULT_SERVER = 'https://app-misttrain-prod-001.azurewebsites.net';

function login(){
    if(LoginLock){ return ;}
    LoginLock = true;
    $("#btn-login").attr('disabled', 'true');
    $("#inp-email").attr('disabled', 'true');
    $("#inp-password").attr('disabled', 'true');
    if(window.__OAuthLogin){ return login_oauth(); }
    $.ajax({
        url: "/api/login/pwd",
        method: 'POST',
        data: {
            email: $("#inp-email").val(),
            password: $("#inp-password").val(),
            remember: document.getElementById('section_remember').checked,
        },
        success: (res) => {
            console.log(res)
            if(res.totp){
                $("#main-form").css('display', 'none');
                $("#tfa-form").css('display', '');
                B64ck = res.result;
                Token = res.token;
            }
            else{
                on_login_ok(res);
            }
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
            window.location = window.location;
        },
    });
}

function login_totp(){
    if(TotpLock){ return ;}
    TotpLock = true;
    $("#inp-pin").attr('disabled', 'true');
    $("#btn-login-totp").attr('disabled', 'true');
    $.ajax({
        url: "/api/login/totp",
        method: 'POST',
        data: {
            b64ck: B64ck,
            token: Token,
            pin: $("#inp-pin").val(),
        },
        success: (res) => {
            console.log(res)
            on_login_ok(res);
        },
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

function login_oauth(){
    saveMTGServer($("#inp-email").val());
    saveMTGToken($("#inp-password").val());
    verifyGameLogin();
}

function on_login_ok(res){
    if($("#ckb-remember").prop('checked')){
        saveDMMLogin(res.result);
    }
    if(res.mtg_result.status == 403){
        alert(Vocab.UnderMaintenance);
    }
    let ret = res.mtg_result;
    processGameLogin(ret);
}

function switchOAuthLogin(enabled){
    console.log(enabled)
    if(enabled){
        window.__OAuthLogin = true;
        $("#inp-email").val(DEFAULT_SERVER);
        $("#inp-password").val('');
        $("#l-email").text(Vocab.ServerLocation);
        $("#inp-password").attr('placeholder', 'Bearer xxxxx...');
        $("#inp-password").attr('type', 'text');
        $("#login-warning").css('visibility', 'hidden');
        $("#section_remember").css('visibility', 'hidden');
    }
    else{
        window.__OAuthLogin = false;
        $("#inp-email").val('');
        $("#inp-password").val('');
        $("#l-email").text(Vocab.Email);
        $("#inp-password").attr('placeholder', '');
        $("#inp-password").attr('type', 'password');
        $("#login-warning").css('visibility', '');
        $("#section_remember").css('visibility', '');
    }
}