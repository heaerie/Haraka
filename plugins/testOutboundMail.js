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

var isValidUserRequest =[{"outboundMailRequest":[
{
	"headers":[{"emailId":"H1450002"}]
	,"headers_decoded":[{"emailId":"H1450002"}]
	,"header_list":[{"emailId":"H1450002"}]
}
]}];

isValidUserRequestUrl = JSON.stringify(isValidUserRequest);

var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","outboundMailRequest": isValidUserRequestUrl};

console.log(JSON.stringify(opt));
var respObj= {};

var opt = {
			method: 'POST',
			uri: 'http://localhost:' + config.port + '/service/mail/outboundMail',
			form: body,
			headers: respObj
		};

httpRequest(opt, function(err, resp) {
if (err) {
	console.error(err);
	return;
}
console.log(resp);
return;
});

exports.httpRequest=httpRequest;
