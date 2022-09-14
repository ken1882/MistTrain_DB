let B64ck = '';
let Token = '';

function login(){
    $("#btn-login").attr('disabled', 'true');
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
        },
        error: (res) => {
            console.log(res);
            alert(Vocab.LoginFailed);
            window.location = window.location;
        },
    });
}

function login_totp(){
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
        },
        error: (res) => {
            console.log(res);
            alert(Vocab.LoginFailed);
            window.location = window.location;
        },
    });
}

function switchOAuthLogin(enabled){
    console.log(enabled)
    if(enabled){
        window.__OAuthLogin = false;
        $("#inp-email").attr('disabled', 'true');
        $("#inp-email").attr('disabled', 'true');
        $("#inp-password").attr('placeholder', 'Bearer xxxxx...');
        $("#login-warning").css('visibility', 'hidden');
        $("#section_remember").css('visibility', 'hidden');
    }
    else{
        window.__OAuthLogin = true;
        $("#inp-email").removeAttr('disabled');
        $("#inp-password").attr('placeholder', '');
        $("#login-warning").css('visibility', '');
        $("#section_remember").css('visibility', '');
    }
}