Promise = require('bluebird'),
request = Promise.promisify(require('request')); 
var config = require('./config/config.json');

httpRequest = function(options, callback) {
	console.log(options);
	request(options).then(function (resp) {
		console.log("call resp:["+ JSON.stringify(resp) +"]"); 
		if (resp.statusCode == 201) {
			return callback(null, resp.body);
		} else {
			return callback(new Error(resp.body));
		}
	}).catch(function (err) {
		console.log("call err:" + err.message);
		return callback(err);
	});

}

var isValidUserRequest =[{"isValidUserRequest":[{"userDetails":[{"emailId":"H1450002"}], "portalDetails":[{"portalKey":"Member Portal"}]}]}];

var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","isValidUserRequest":"[{\"isValidUserRequest\":[{\"userDetails\":[{\"emailId\":\"H1450003\"}], \"portalDetails\":[{\"portalKey\":\"Member Portal\"}]}]}];"}


//console.log(JSON.stringify(opt));
var respObj= {};

var opt = {
			method: 'POST',
			uri: 'http://localhost:' + config.port + '/service/userDetails/isValidUser',
			form: body,
			headers: respObj
		};

var optStr = JSON.stringify(opt);
console.log("!!!optStr length :" + optStr.length);


httpRequest(opt, function(err, resp) {
if (err) {
	console.error(err);
	return;
}
console.log(resp);
return;
});

exports.httpRequest=httpRequest;
