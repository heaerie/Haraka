// heaerieMailService

// documentation via: haraka -c /home/ubuntu/mail/Haraka -h plugins/heaerieMailService

// Put your plugin code here
// type: `haraka -h Plugins` for documentation on how to create a plugin

var util = require('util'),
    async = require("async"),
    Transform = require('stream').Transform;


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

this.register_hook('rcpt_ok', 'hook_rcpt_ok');
};

exports.hook_queue = function (next, connection) {
    var plugin = this;

	
    this.logdebug("hook_queue");

    var transaction = connection.transaction;
    var emailTo = transaction.rcpt_to;

		next(OK, "Heaerie Email Accepted.");
};

exports.hook_rcpt_ok = function (next, connections, params) {
	this.logdebug(connections);
	this.logdebug(params);
	this.logdebug("params.original =[" + params.original +"]");
	
     this.is_user_valid(params.original, function (isValid) {
		if (isValid) {
				next(OK);
		} else {
				next(DENY);
		}
	});
};

exports.is_user_valid = function (userID, callback) {
    var plugin = this;
	if (userID == "<user1@myroomexpense.com>") {
		callback(true);	
	} else {
		callback(false);	

	}
};
