// heaerieMailService

// documentation via: haraka -c /home/ubuntu/mail/Haraka -h plugins/heaerieMailService

// Put your plugin code here
// type: `haraka -h Plugins` for documentation on how to create a plugin

var util = require('util'),
    async = require("async"),
    Transform = require('stream').Transform;
var fs = require('fs');
var httpreq = require("./httpreq");

exports.register = function () {
    this.logdebug("Initializing  heaerieMailServices ");

    var config = this.config.get("heaerieMailServices.json");
    this.logdebug("Config loaded : "+util.inspect(config));
/*
    AWS.config.update({
        accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, region: config.region
    });

    this.s3Bucket = config.s3Bucket;

    this.zipBeforeUpload = config.zipBeforeUpload;
    this.fileExtension = config.fileExtension;
    this.copyAllAddresses = config.copyAllAddresses;
*/

this.register_hook('rcpt_ok', 'hook_rcpt_ok', 'hook_queue', 'hook_data_post');
};

exports.hook_queue = function (next, connection) {
    var plugin = this;
    connection.transaction.parse_body = true;
    this.logdebug("hook_queue");
    var transaction = connection.transaction;
    var emailTo = transaction.rcpt_to;
    this.logdebug("########BODY###################");
/*
    this.logdebug(transaction.uuid); this.logdebug(transaction.mail_from);
    this.logdebug(transaction.rcpt_to);
    this.logdebug(transaction.header_lines);
*/

/*
	var outboundMail = [{"outboundMailRequest":[{ "headers" : []
	, "headers_decoded" : []
	, "header_list" : []   
	, "body" : []
	}  ]}];

 outboundMail[0].outboundMailRequest[0].headers.push(transaction.body.header);
 outboundMail[0].outboundMailRequest[0].headers.push(transaction.body.headers_decoded);
 outboundMail[0].outboundMailRequest[0].header_list.push(transaction.header_lines);

var outboundMailUrl= JSON.stringify(outboundMail);

var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA", "outboundMailRequest": outboundMailUrl};
	var respObj= {};
	var opt = {
				method: 'POST',
				uri: 'http://localhost:5000/service/mail/outboundMail',
				form: JSON.stringify(body),
				headers: respObj
			};
*/
var isValidUserRequest =[{"outboundMailRequest":[{
        "headers":[{"emailId":"H1450002"}]
        ,"headers_decoded":[{"emailId":"H1450002"}]
        ,"header_list":[{"emailId":"H1450002"}]
	,"body": []
}
]}];
 isValidUserRequest[0].outboundMailRequest[0].uuid = transaction.uuid;
 isValidUserRequest[0].outboundMailRequest[0].to = transaction.rcpt_to;
 isValidUserRequest[0].outboundMailRequest[0].body.push(prepareBody(transaction.body));
 isValidUserRequest[0].outboundMailRequest[0].mailFrom = transaction.mail_from;
 isValidUserRequest[0].outboundMailRequest[0].headers.push(transaction.body.header);
 isValidUserRequest[0].outboundMailRequest[0].headers_decoded.push(transaction.body.headers_decoded);
 isValidUserRequest[0].outboundMailRequest[0].header_list.push(transaction.body.header_list);

var isValidUserRequestUrl = JSON.stringify(isValidUserRequest);

var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","outboundMailRequest": isValidUserRequestUrl};
var respObj= {};

	var opt = { method: 'POST', 
			uri: 'http://localhost:5000/service/mail/outboundMail', 
			form: body,
                        headers: respObj
                };

	httpreq.httpRequest(opt, function(err, resp) {
		if (err) {
			return next(OK, "Heaerie Email Accepted.");
		}
		return  next(OK, "Heaerie Email Accepted.");
	});

};

exports.hook_rcpt_ok = function (next, connections, params) {
	this.logdebug(connections);
	this.logdebug(params);
	this.logdebug("params.original =[" + params.original +"]");
	
     this.is_user_valid(params.user, function (isValid) {
		if (isValid) {
				next(OK);
		} else {
				next(DENY);
		}
	});
};

exports.is_user_valid = function (user, callback) {
	var plugin = this;
	var plugin = this;
	var isValidUserRequest =[{"isValidUserRequest":[{"userDetails":[{"emailId":"H1450001"}], "portalDetails":[{"portalKey":"Member Portal"}]}]}];
	var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","isValidUserRequest":"[{\"isValidUserRequest\":[{\"userDetails\":[{\"emailId\":\""+ user + "\"}], \"portalDetails\":[{\"portalKey\":\"Member Portal\"}]}]}];"}
	var respObj= {};
	var opt = {
				method: 'POST',
				uri: 'http://localhost:5000/service/userDetails/isValidUser',
				form: body,
				headers: respObj
			};

	httpreq.httpRequest(opt, function(err, resp) {
		if (err) {
			return	callback(false);	
		}
		return	callback(true);	
	});

};

exports.hook_data_post = function (next, connection) {
    this.loginfo("!!!heaerieMailService.hook_data_post");
    this.loginfo("connection.transaction.body");
    this.loginfo(connection.transaction.body);
    next();
}

exports.hook_data = function (next, connection) {
    this.loginfo("!!!heaerieMailService.hook_data");
    // enable mail body parsing
    connection.transaction.parse_body = 1;
    connection.transaction.attachment_hooks(
        function (ct, fn, body, stream) {
            start_att(connection, ct, fn, body, stream)
        }
    );
    next();
}

function start_att (connection, ct, fn, body, stream) {
    connection.loginfo("!!!heaerieMailService.start_att");
    connection.loginfo("Got attachment: " + ct + ", " + fn 
//+ " for user id: " + connection.transaction.notes.hubdoc_user.email
);
    connection.transaction.notes.attachment_count++;

    stream.connection = connection; // Allow backpressure
    stream.pause();

    var tmp = require('tmp');

    tmp.file(function (err, path, fd) {
        connection.loginfo("Got tempfile: " + path + " (" + fd + ")");
        var ws = fs.createWriteStream(path);
        stream.pipe(ws);
        stream.resume();
        ws.on('close', function () {
            connection.loginfo("End of stream reached");
            fs.fstat(fd, function (err, stats) {
                connection.loginfo("Got data of length: " + stats.size);
                // Close the tmp file descriptor
                fs.close(fd, function(){});
            });
        });
    });
}

function prepareBody(body) {
	return  body.toJson();
}
