var util = require('util'),
        Transform = require('stream').Transform;
var fs = require('fs');
var httpreq = require("./httpreq");
var keys = require("./keys.json");
var store = require("./store");
var file = require("./file");
//var config = require("./config");

is_user_valid = function (user, callback) {
        var plugin = this;
        var plugin = this;
        var isValidUserRequest ={"isValidUserRequest":{"userDetails":{"emailId": user}, "portalDetails":{"portalKey":"Member Portal"}}};
        var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","isValidUserRequest": isValidUserRequest }
        var respObj= {};
        var opt = {
                                method: 'POST',
                                uri: 'http://localhost:5000/service/userDetails/isValidUser',
                                form: body,
                                headers: respObj
                        };
        httpreq.httpRequest(opt, function(err, resp) {
                if (err) {
                        return  callback(false);        
                }
                return  callback(true); 
        });
};

is_user_valid('H1450002', function(ret) { 
	if (!ret) {
		console.log(ret);	
	}
	console.log(ret);

});
