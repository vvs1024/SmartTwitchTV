/*
 * Copyright (c) 2017-2020 Felipe de Leon <fglfgl27@gmail.com>
 *
 * This file is part of SmartTwitchTV <https://github.com/fgl27/SmartTwitchTV>
 *
 * SmartTwitchTV is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SmartTwitchTV is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with SmartTwitchTV.  If not, see <https://github.com/fgl27/SmartTwitchTV/blob/master/LICENSE>.
 *
 */

//Variable initialization
var AddCode_Code = 0;
var AddCode_IsFollowing = false;
var AddCode_IsSub = false;
var AddCode_PlayRequest = false;
var AddCode_Channel_id = '';
var AddCode_Expires_in_offset = 100;

var AddCode_Scopes = [
    'user:read:follows',
    'user:read:subscriptions',
    'chat:edit',
    'chat:read'
];
//Variable initialization end

function AddCode_CheckNewCode(code) {
    AddCode_Code = code;
    Main_showLoadDialog();
    AddCode_requestTokens();
}

function AddCode_refreshTokens(position, callbackFunc, callbackFuncNOK, key, sync) {
    //Main_Log('AddCode_refreshTokens ' + position);

    if (!AddUser_UserIsSet() || !AddUser_UsernameArray[position] || !AddUser_UsernameArray[position].access_token) {

        if (callbackFuncNOK) callbackFuncNOK();

        return;
    }

    var url = AddCode_UrlToken + 'grant_type=refresh_token&client_id=' + AddCode_clientId +
        '&client_secret=' + AddCode_client_token + '&refresh_token=' + AddUser_UsernameArray[position].refresh_token +
        '&redirect_uri=' + AddCode_redirect_uri;

    //Run in synchronous mode to prevent anything happening until user token is restored
    if (Main_IsOn_OSInterface && sync) {

        AddCode_refreshTokensReady(
            position,
            callbackFunc,
            callbackFuncNOK,
            key,
            JSON.parse(
                OSInterface_mMethodUrlHeaders(
                    url,
                    DefaultHttpGetTimeout,
                    'POST',
                    null,
                    0,
                    null
                )
            )
        );

    } else {

        if (!Main_IsOn_OSInterface) {

            var xmlHttp = new XMLHttpRequest();

            xmlHttp.open("POST", url, true);
            xmlHttp.timeout = DefaultHttpGetTimeout;

            xmlHttp.onreadystatechange = function() {

                if (this.readyState === 4) {
                    //Main_Log('AddCode_refreshTokens ' + xmlHttp.status);
                    AddCode_refreshTokensReady(position, callbackFunc, callbackFuncNOK, key, this);
                }

            };

            xmlHttp.send(null);

        } else {

            OSInterface_BaseXmlHttpGet(
                url,
                DefaultHttpGetTimeout,
                null,
                'POST',
                null,
                'AddCode_refreshTokensResult',
                position,
                key,
                callbackFunc ? callbackFunc.name : null,
                callbackFuncNOK ? callbackFuncNOK.name : null
            );

        }

    }
}

function AddCode_refreshTokensResult(result, key, callbackSucess, calbackError, position) {

    AddCode_refreshTokensReady(position, eval(callbackSucess), eval(calbackError), key, JSON.parse(result));// jshint ignore:line

}

function AddCode_refreshTokensReady(position, callbackFunc, callbackFuncNOK, key, xmlHttp) {

    if (xmlHttp.status === 200) {

        AddCode_refreshTokensSucess(xmlHttp.responseText, position, callbackFunc, key);
        return;

    } else {

        try {
            var response = JSON.stringify(JSON.parse(xmlHttp.responseText));
            if (response) {
                if (Main_A_includes_B(response, 'Invalid refresh token')) {

                    AddCode_requestTokensFailRunning(position);
                    if (callbackFuncNOK) callbackFuncNOK(key);

                    return;
                }
            }
        } catch (e) {
            Main_Log('AddCode_refreshTokens e ' + e);
        }

    }

    AddCode_refreshTokensError(callbackFuncNOK, key);
}

function AddCode_refreshTokensError(callbackFuncNOK, key) {

    if (callbackFuncNOK) callbackFuncNOK(key);
}

function AddCode_refreshTokensSucess(responseText, position, callbackFunc, key) {

    var response = JSON.parse(responseText);
    if (AddCode_TokensCheckScope(response.scope)) {
        AddUser_UsernameArray[position].access_token = response.access_token;
        AddUser_UsernameArray[position].refresh_token = response.refresh_token;
        AddUser_UsernameArray[position].expires_in = (parseInt(response.expires_in) - AddCode_Expires_in_offset) * 1000;
        AddUser_UsernameArray[position].expires_when = (new Date().getTime()) + AddUser_UsernameArray[position].expires_in;
        //Main_Log(JSON.stringify(AddUser_UsernameArray[position]));


        if (!position) {
            HttpGetSetUserHeader();
        }

        AddUser_SaveUserArray();

        AddCode_Refreshtimeout(position);

    } else AddCode_requestTokensFailRunning(position);

    if (callbackFunc) callbackFunc(key);
}

//Check if has all scopes, in canse they change
function AddCode_TokensCheckScope(scope) {

    var i = 0, len = AddCode_Scopes.length;

    for (i; i < len; i++) {
        if (!Main_A_includes_B(scope, AddCode_Scopes[i])) return false;
    }

    return true;
}

function AddCode_requestTokens() {
    var theUrl = AddCode_UrlToken + 'grant_type=authorization_code&client_id=' + AddCode_clientId +
        '&client_secret=' + AddCode_client_token + '&code=' + AddCode_Code + '&redirect_uri=' + AddCode_redirect_uri;

    FullxmlHttpGet(
        theUrl,
        null,
        AddCode_requestTokensSucess,
        noop_fun,
        0,
        0,
        'POST',
        null
    );
}

function AddCode_requestTokensSucess(obj) {

    if (obj.status === 200) {

        var response = JSON.parse(obj.responseText);
        AddUser_UsernameArray[Main_values.Users_AddcodePosition].access_token = response.access_token;
        AddUser_UsernameArray[Main_values.Users_AddcodePosition].refresh_token = response.refresh_token;

        FullxmlHttpGet(
            AddCode_ValidateUrl,
            [
                [Main_Authorization, Main_OAuth + AddUser_UsernameArray[Main_values.Users_AddcodePosition].access_token]
            ],
            AddCode_requestTokensSucessValidate,
            noop_fun,
            0,
            0,
            null,
            null
        );

    } else AddCode_requestTokensFail();
}

function AddCode_requestTokensFail() {

    Main_HideLoadDialog();
    Main_showWarningDialog(STR_OAUTH_FAIL);
    Main_setTimeout(
        function() {
            Main_HideWarningDialog();
            Main_newUsercode = 0;
            Main_SaveValues();
            Main_values.Main_Go = Main_Users;
            Main_LoadUrl(Main_IsOn_OSInterface ? OSInterface_mPageUrl() : AddCode_redirect_uri);
        },
        4000
    );
    AddUser_UsernameArray[Main_values.Users_AddcodePosition].access_token = 0;
    AddUser_UsernameArray[Main_values.Users_AddcodePosition].refresh_token = 0;
    AddUser_SaveUserArray();

}

function AddCode_requestTokensFailRunning(position) {
    //Token fail remove it and warn
    Users_status = false;
    Main_HideLoadDialog();
    AddUser_UsernameArray[position].access_token = 0;
    AddUser_UsernameArray[position].refresh_token = 0;
    AddUser_SaveUserArray();
    Main_SaveValues();
}

function AddCode_requestTokensSucessValidate(obj, position) {

    if (obj.status === 200) AddCode_CheckOauthTokenSucess(obj.responseText);
    else AddCode_requestTokensFail(position);

}

function AddCode_CheckOauthTokenSucess(response) {

    var token = JSON.parse(response);

    if (token.login && Main_A_includes_B(token.login, AddUser_UsernameArray[Main_values.Users_AddcodePosition].name)) {
        Main_setItem('New_User_Token_Added', 1);
        AddUser_SaveUserArray();
        Main_newUsercode = 0;
        Main_HideLoadDialog();
        Users_status = false;
        Main_values.Main_Go = Main_Users;
        Main_SaveValues();
        Main_showWarningDialog(STR_USER_CODE_OK);
        OSInterface_clearCookie();
        Main_setTimeout(
            function() {
                Main_LoadUrl(Main_IsOn_OSInterface ? OSInterface_mPageUrl() : AddCode_redirect_uri);
            },
            3000
        );
    } else {
        AddUser_UsernameArray[Main_values.Users_AddcodePosition].access_token = 0;
        AddUser_UsernameArray[Main_values.Users_AddcodePosition].refresh_token = 0;
        Main_showWarningDialog(STR_OAUTH_FAIL_USER + AddUser_UsernameArray[Main_values.Users_AddcodePosition].name);
        Main_setTimeout(
            function() {
                Main_HideWarningDialog();
                Main_newUsercode = 0;
                Main_SaveValues();
                Main_values.Main_Go = Main_Users;
                Main_LoadUrl(Main_IsOn_OSInterface ? OSInterface_mPageUrl() : AddCode_redirect_uri);
            },
            4000
        );
    }
    return;
}


function AddCode_AppTokenCheck() {
    var header = [
        [Main_Authorization, Bearer + AddCode_main_token]
    ];
    if (Main_IsOn_OSInterface) {

        var obj = OSInterface_mMethodUrlHeaders(
            AddCode_ValidateUrl,
            DefaultHttpGetTimeout,
            null,
            null,
            0,
            JSON.stringify(header)
        );

        if (obj) {

            obj = JSON.parse(obj);

            if (obj) {

                AddCode_AppTokenCheckReady(obj);
                return;

            }

        }

        //AddCode_refreshTokens(position, null, null, null, !position); //token expired

    } else {

        FullxmlHttpGet(
            AddCode_ValidateUrl,
            header,
            AddCode_AppTokenCheckReady,
            noop_fun,
            0,
            0,
            null,
            null
        );

    }
}

function AddCode_AppTokenCheckReady(obj) {
    if (obj.status === 200) {

        Main_initWindowsEnd();

        var data = JSON.parse(obj.responseText);

        window.setTimeout(function() {

            AddCode_AppToken();

        }, (parseInt(data.expires_in) - 60) * 1000);

    } else {

        AddCode_AppToken(0, Main_initWindowsEnd, Main_initWindowsEnd, 0, true);

    }

}

function AddCode_AppToken(position, callbackFunc, callbackFuncNOK, key, sync) {

    var url = 'https://id.twitch.tv/oauth2/token?client_id=' + AddCode_clientId +
        '&client_secret=' + AddCode_client_token +
        '&grant_type=client_credentials';

    //Run in synchronous mode to prevent anything happening until user token is restored
    if (Main_IsOn_OSInterface && sync) {

        AddCode_AppTokenReady(
            position,
            callbackFunc,
            callbackFuncNOK,
            key,
            JSON.parse(
                OSInterface_mMethodUrlHeaders(
                    url,
                    DefaultHttpGetTimeout,
                    'POST',
                    null,
                    0,
                    null
                )
            )
        );

    } else {

        if (!Main_IsOn_OSInterface) {

            var xmlHttp = new XMLHttpRequest();

            xmlHttp.open("POST", url, true);
            xmlHttp.timeout = DefaultHttpGetTimeout;

            xmlHttp.onreadystatechange = function() {

                if (this.readyState === 4) {
                    //Main_Log('AddCode_AppToken ' + xmlHttp.status);
                    AddCode_AppTokenReady(position, callbackFunc, callbackFuncNOK, key, this);
                }

            };

            xmlHttp.send(null);

        } else {

            OSInterface_BaseXmlHttpGet(
                url,
                DefaultHttpGetTimeout,
                null,
                'POST',
                null,
                'AddCode_AppTokenResult',
                position,
                key,
                callbackFunc ? callbackFunc.name : null,
                callbackFuncNOK ? callbackFuncNOK.name : null
            );

        }

    }
}

function AddCode_AppTokenResult(result, key, callbackSucess, calbackError, position) {

    AddCode_AppTokenReady(
        position,
        eval(callbackSucess),// jshint ignore:line
        eval(calbackError),// jshint ignore:line
        key,
        JSON.parse(result)
    );// jshint ignore:line

}

function AddCode_AppTokenReady(position, callbackFunc, callbackFuncNOK, key, xmlHttp) {

    if (xmlHttp.status === 200) {

        AddCode_AppTokenSucess(xmlHttp.responseText, position, callbackFunc, key);
        return;

    }

    AddCode_AppTokenError(callbackFuncNOK, key);
}

function AddCode_AppTokenError(callbackFuncNOK, key) {

    if (callbackFuncNOK) callbackFuncNOK(key);
}

function AddCode_AppTokenSucess(responseText, position, callbackFunc, key) {

    var response = JSON.parse(responseText);

    if (response) {
        AddCode_main_token = response.access_token;
    }

    OSInterface_setAppToken();
    Main_values.AddCode_main_token = AddCode_main_token;
    HttpGetSetMainHeader();

    if (callbackFunc) callbackFunc(key);

    Main_SaveValues();
}


function AddCode_CheckTokenStart(position) {

    if (Main_IsOn_OSInterface && !position) {

        var obj = OSInterface_mMethodUrlHeaders(
            AddCode_ValidateUrl,
            DefaultHttpGetTimeout,
            null,
            null,
            0,
            JSON.stringify(
                [
                    [Main_Authorization, Main_OAuth + AddUser_UsernameArray[position].access_token]
                ]
            )
        );

        if (obj) {

            obj = JSON.parse(obj);

            if (obj) {

                AddCode_CheckTokenReady(obj, position);
                return;

            }

        }

        AddCode_refreshTokens(position, null, null, null, !position); //token expired

    } else {

        FullxmlHttpGet(
            AddCode_ValidateUrl,
            [
                [Main_Authorization, Main_OAuth + AddUser_UsernameArray[position].access_token]
            ],
            AddCode_CheckTokenReady,
            noop_fun,
            position,
            0,
            null,
            null
        );

    }
}

function AddCode_CheckTokenReady(obj, position) {

    if (obj.status === 200) {

        AddCode_CheckTokenSuccess(obj.responseText, position);

    } else {

        AddCode_refreshTokens(position, null, null, null, !position); //token expired

    }

}

function AddCode_CheckTokenSuccess(responseText, position) {

    var token = JSON.parse(responseText);

    if (token.hasOwnProperty('scopes') && !AddCode_TokensCheckScope(token.scopes)) AddCode_requestTokensFailRunning(position);
    else if (token.hasOwnProperty('expires_in')) {

        AddUser_UsernameArray[position].expires_in = (parseInt(token.expires_in) - AddCode_Expires_in_offset) * 1000;
        AddUser_UsernameArray[position].expires_when = (new Date().getTime()) + AddUser_UsernameArray[position].expires_in;
        AddCode_Refreshtimeout(position);

    }
}

function AddCode_Refreshtimeout(position) {

    if (AddUser_UsernameArray[position].access_token) {

        AddUser_UsernameArray[position].timeout_id = Main_setTimeout(
            function() {

                AddCode_refreshTokens(position, null, null);

            },
            AddUser_UsernameArray[position].expires_in,
            AddUser_UsernameArray[position].timeout_id
        );

    } else Main_clearTimeout(AddUser_UsernameArray[position].timeout_id);

    //Main_Log('AddCode_Refreshtimeout position ' + position + ' expires_in ' + AddUser_UsernameArray[position].expires_in + ' min ' + (AddUser_UsernameArray[position].expires_in / 60000) + ' plus offset ' + AddCode_Expires_in_offset + ' s');
}

function AddCode_CheckFollow() {
    AddCode_IsFollowing = false;
    var theUrl = Main_helix_api + 'users/follows?from_id=' +
        AddUser_UsernameArray[0].id + '&to_id=' + AddCode_Channel_id,
        header;

    if (AddUser_UserIsSet() && AddUser_UsernameArray[0].access_token) {

        header = Main_Bearer_User_Headers;

    } else {
        header = Main_Bearer_Headers;
    }

    FullxmlHttpGet(
        theUrl,
        header,
        AddCode_RequestCheckFollowSucess,
        noop_fun,
        0,
        0,
        'GET',
        null
    );
}

function AddCode_RequestCheckFollowSucess(obj) {

    if (obj.status === 200) { //yes
        var response = JSON.parse(obj.responseText);

        if (response && response.data.length) {
            AddCode_RequestCheckFollowOK();
        } else {
            AddCode_RequestCheckFollowError();
        }


    } else { // no

        AddCode_RequestCheckFollowError();

    }
}

function AddCode_RequestCheckFollowOK() {
    AddCode_IsFollowing = true;
    AddCode_RequestCheckFollowEnd();
}

function AddCode_RequestCheckFollowError() {
    AddCode_IsFollowing = false;
    AddCode_RequestCheckFollowEnd();
}

function AddCode_RequestCheckFollowEnd() {

    if (AddCode_PlayRequest) Play_setFollow();
    else ChannelContent_setFollow();

}

function AddCode_Follow() {

    var theUrl = Main_kraken_api + 'users/' + AddUser_UsernameArray[0].id + '/follows/channels/' + AddCode_Channel_id + Main_TwithcV5Flag_I;

    FullxmlHttpGet(
        theUrl,
        Main_GetHeader(3, Main_OAuth + AddUser_UsernameArray[0].access_token),
        AddCode_FollowSucess,
        noop_fun,
        0,
        0,
        'PUT',
        null
    );
}

function AddCode_FollowSucess(obj) {

    if (obj.status === 200) { //success user now is following the channel

        AddCode_IsFollowing = true;

        if (AddCode_PlayRequest) {

            Play_setFollow();
            ChatLive_checkFallowSuccessUpdate(obj.responseText, 0);

        } else ChannelContent_setFollow();

        return;
    } else if (obj.status === 401 || obj.status === 403) { //token expired

        AddCode_refreshTokens(0, AddCode_Follow, null);

    }

}

function AddCode_UnFollow() {

    var theUrl = Main_kraken_api + 'users/' + AddUser_UsernameArray[0].id + '/follows/channels/' + AddCode_Channel_id + Main_TwithcV5Flag_I;

    FullxmlHttpGet(
        theUrl,
        Main_GetHeader(3, Main_OAuth + AddUser_UsernameArray[0].access_token),
        AddCode_UnFollowSucess,
        noop_fun,
        0,
        0,
        'DELETE',
        null
    );
}

function AddCode_UnFollowSucess(xmlHttp) {

    if (xmlHttp.status === 204) { //success user is now not following the channel

        AddCode_IsFollowing = false;

        if (AddCode_PlayRequest) {

            Play_setFollow();
            ChatLive_FollowState[0].follows = false;

        } else ChannelContent_setFollow();


    } else if (xmlHttp.status === 401 || xmlHttp.status === 403) { //token expired

        AddCode_refreshTokens(0, AddCode_UnFollow, null);

    }

}

function AddCode_CheckSub() {
    AddCode_IsSub = false;

    var theUrl = Main_kraken_api + 'users/' + AddUser_UsernameArray[0].id + '/subscriptions/' + AddCode_Channel_id + Main_TwithcV5Flag_I;

    FullxmlHttpGet(
        theUrl,
        Main_GetHeader(3, Main_OAuth + AddUser_UsernameArray[0].access_token),
        AddCode_CheckSubSucess,
        noop_fun,
        0,
        0,
        'GET',
        null
    );

}

function AddCode_CheckSubSucess(obj) {

    if (obj.status === 200) { //success yes user is a SUB

        AddCode_IsSub = true;
        PlayVod_isSub();

    } else if (obj.status === 401 || obj.status === 403) { //token expired

        AddCode_refreshTokens(0, AddCode_CheckSub, AddCode_CheckSubSucessFail);

    } else { // internet error
        AddCode_CheckSubSucessFail();
    }

}

function AddCode_CheckSubSucessFail() {
    AddCode_IsSub = false;
    PlayVod_NotSub();
}

var AddCode_redirect_uri = 'http://localhost:8080/index.html';
//Get yours app register to get tokens at https://dev.twitch.tv/console
var AddCode_clientId = "05xojqihn5hlx0i6yavjo206ql8zpz";//public but get yours link above is free
//none public get yours link above is free
//secret: lmkt1rfgpy0t5qbsie9j5x11y5npyx
var AddCode_main_token = "lmkt1rfgpy0t5qbsie9j5x11y5npyx"; //not sure
var AddCode_client_token = "lmkt1rfgpy0t5qbsie9j5x11y5npyx";
var AddCode_backup_client_id;

var AddCode_UrlToken = 'https://id.twitch.tv/oauth2/token?';
var AddCode_ValidateUrl = 'https://id.twitch.tv/oauth2/validate';


//To pass to Java
var Play_Headers;
var Play_live_token_prop = 'streamPlaybackAccessToken';
var Play_live_token = '{"query":"{streamPlaybackAccessToken(channelName:\\"%x\\", params:{platform:\\"android\\",playerType:\\"mobile\\"}){value signature}}"}';
var Play_live_links = "https://usher.ttvnw.net/api/channel/hls/%x.m3u8?&token=%s&sig=%s&reassignments_supported=true&playlist_include_framerate=true&allow_source=true&fast_bread=true&cdm=wv&p=%d";

var Play_vod_token_prop = 'videoPlaybackAccessToken';
var Play_vod_token = '{"query":"{videoPlaybackAccessToken(id:\\"%x\\", params:{platform:\\"android\\",playerType:\\"mobile\\"}){value signature}}"}';
var Play_vod_links = "https://usher.ttvnw.net/vod/%x.m3u8?&nauth=%s&nauthsig=%s&reassignments_supported=true&playlist_include_framerate=true&allow_source=true&cdm=wv&p=%d";
