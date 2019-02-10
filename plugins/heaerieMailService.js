// heaerieMailService

// documentation via: haraka -c /home/ubuntu/mail/Haraka -h plugins/heaerieMailService

// Put your plugin code here
// type: `haraka -h Plugins` for documentation on how to create a plugin

var util = require('util'),
	Transform = require('stream').Transform;
var fs = require('fs');
var httpreq = require("./httpreq");
var keys = require("./keys.json");
var store = require("./store");
var file = require("./file");

exports.register = function () {
	this.logdebug("!!!Initializing  heaerieMailServices H:001");
	this.register_hook('rcpt_ok', 'hook_rcpt_ok', 'hook_queue', 'hook_data_post');
};

var hook_queue = function (next, connection) {
	this.logdebug("before sync HQ:001 ###");
	var plugin = this;
	connection.transaction.parse_body = true;
	this.logdebug("hook_queue");
	var transaction = connection.transaction;
	var emailTo = transaction.rcpt_to;
	var isValidUserRequest ={"outboundMailRequest":{
			"headers":{"emailId":"H1450002"}
			,"headers_decoded":{"emailId":"H1450002"}
			,"header_list":{"emailId":"H1450002"}
			,"body": []
	}};
	isValidUserRequest.outboundMailRequest.body.push(prepareBody(transaction.body));
	this.logdebug("call encryptBodyList A:001");
	var inpList=JSON.parse(JSON.stringify(isValidUserRequest.outboundMailRequest.body));	
	//file.writeJson("/home/ubuntu/bin/" + "test2.json", inpList);
	this.logdebug(this.logdebug);
	this.logdebug("call encryptBodyList A:002");
	encryptBodyList(inpList, this.logdebug, function (err, logdebug, outList) {
		logdebug("EBL:001");
		if (err) {
			logdebug("Error" + err);
			return next(DENY, "Heaerie Email Denied.");
		} else  {
			logdebug("outList = " + JSON.stringify(outList, null, 4));
			isValidUserRequest.outboundMailRequest.body=outList;
			isValidUserRequest.outboundMailRequest.to = transaction.rcpt_to;
			isValidUserRequest.outboundMailRequest.mailFrom = transaction.mail_from;
			isValidUserRequest.outboundMailRequest.uuid = transaction.uuid;
			//TODO:
			//	transaction.body.header.emailId=H1450002
			isValidUserRequest.outboundMailRequest.headers.push(transaction.body.header);
			isValidUserRequest.outboundMailRequest.headers_decoded.push(transaction.body.headers_decoded);
			isValidUserRequest.outboundMailRequest.header_list.push(transaction.body.header_list);
			
			var isValidUserRequestUrl = JSON.stringify(isValidUserRequest);

			var body = {"grantType":"password","clientId":"CLIENTSP","scope":"GPA","outboundMailRequest": isValidUserRequest};
			var respObj= {};

			var opt = { method: 'POST', 
			//TODO: hostname should be read from config.json
					uri: 'http://localhost:5000/service/mail/outboundMail', 
					form: body,
					headers: respObj
			};

			store.saveToLocal(JSON.stringify(opt));
			httpreq.httpRequest(opt, function(err, resp) {
				if (err) {
		//		TODO: Need to customize the message by  domain
					return next(OK, "Heaerie Email Accepted.");
				}
		//		TODO: Need to customize the message by  domain
				return  next(OK, "Heaerie Email Accepted.");
			});
		}

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
/**
 * heaerie V2 changes , schema definition is changed.
 * 
 * */
exports.is_user_valid = function (user, callback) {
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
/*
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
*/

exports.hook_data_post = function (next, connection) {
    this.loginfo("!!!heaerieMailService.hook_data_post");
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
    connection.loginfo("Got attachment: " + ct + ", " + fn );
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


var openpgp = require('openpgp'); // use as CommonJS, AMD, ES6 module or via window.openpgp
var sleep = require('sleep');
var keys = require("./keys.json");

function encryptData(plaintext, logdebug, key, callback) {
	var options = {
            data: plaintext,                             // input as String (or Uint8Array)
            publicKeys: openpgp.key.readArmored(key).keys//,  // for encryption
//          privateKeys: privKeyObj // for signing (optional)
        }
	logdebug("call openpgp.encrypt");
        openpgp.encrypt(options).then(function(ciphertext) {
		logdebug("encrypted=" + ciphertext);
		return callback(null, ciphertext.data);
        });
}

function WaterfallOver(list, logdebug, iterator, callback) {
	logdebug("in WaterfallOver");
    var nextItemIndex = 0;  //keep track of the index of the next item to be processed

    var outList = [];
    function report(err, obj) {

        nextItemIndex++;

	logdebug("R001: nextItemIndex" +  nextItemIndex);
	outList.push(obj);
        // if nextItemIndex equals the number of items in list, then we're done
        if(nextItemIndex === list.length) {
		logdebug("R099: nextItemIndex" +  nextItemIndex);
		callback(err, logdebug, outList);
	} else {
            // otherwise, call the iterator on the next item
		logdebug("R002: nextItemIndex" +  nextItemIndex);
            	iterator(list[nextItemIndex],logdebug, report);
	}
    }

    // instead of starting all the iterations, we only start the 1st one
    iterator(list[0], logdebug, report);
}


function IterateOver(list, iterator, callback) {
    // this is the function that will start all the jobs
    // list is the collections of item we want to iterate over
    // iterator is a function representing the job when want done on each item
    // callback is the function we want to call when all iterations are over

    var doneCount = 0;  // here we'll keep track of how many reports we've got
    var outList = [];
    function report(err, obj) {
        // this function resembles the phone number in the analogy above
        // given to each call of the iterator so it can report its completion
	if (err) {
		callback(err, null);
	}
	outList.push(obj);
	this.logdebug("in report  doneCount=" + doneCount);
        doneCount++;

        // if doneCount equals the number of items in list, then we're done
        if(doneCount === list.length) {
	this.logdebug("this is final=" + doneCount);
            callback(err, outList);
	}
    }

    // here we give each iteration its job
    for(var i = 0; i < list.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        iterator(list[i], report)
    }
}
var encryptBodyList =  function(bodyList, logdebug, fcallback) {
	logdebug("in encryptBodyList");
	logdebug("call WaterfallOver");
	WaterfallOver(bodyList, logdebug, function(bodyObj, logdebug, callback) {
		encryptData(bodyObj.bodytext, logdebug, keys.pubkey, function(err, encryptedBodytext) {
			logdebug("in WR:2.001 err=" + err + ", encryptedBodytext=" +  encryptedBodytext);
			if(err) {
				return	callback(err, null);
			}
			bodyObj.bodytext = encryptedBodytext;
			logdebug("in WR:3.001 err=" + err + ", encryptedBodytext=" +  encryptedBodytext);
			encryptData(bodyObj.body_text_encoded, logdebug, keys.pubkey, function(err, encryptedBodyTextEncoded) {
				logdebug("in WR:4.001 err=" + err + ", encryptedBodytext=" +  encryptedBodytext);
			
				if(err) {
					return 	callback(err, null);
				}
				bodyObj.body_text_encoded = encryptedBodyTextEncoded ;
				logdebug("in WR:4.002 bodyObj.childern= " + bodyObj.childern);
				if ((bodyObj.childern != undefined ) &&  (bodyObj.childern.length != 0)) {
					logdebug("in WR:5.001 call encryptBodyList ");
					encryptBodyList(bodyObj.childern, logdebug, function(err, childList) {
						if(err) {
							return	callback(err, null);
						}
						bodyObj.childern = childList;
						logdebug("in WR:6.001 err=" + err + ", encryptedBodytext=" +  encryptedBodytext);
						return callback(err, bodyObj);
					});
				} else {
					return callback(err, bodyObj);
				}
			})
			
		});
	
	}, 
	function(err, logdebug, outList) {
		logdebug("F001:in encryptBodyList final");
		logdebug(fcallback)
		logdebug("F002:in encryptBodyList final" + outList);
		fcallback(err, logdebug,  outList);
	});
}
/*
encryptBodyList([{"bodytext" : "1", "body_text_encoded" : "1" , childern: [ { "bodytext" : "1.1" , "body_text_encoded" : "1.1", childern : [] } ]} , { "bodytext" : "2", "body_text_encoded" : "2", childern:[]}],  keys.pubkey, this.loginfo, function (err, outList) {
		if (err) {
			this.loginfo("Error " + err);
		} else  {
			this.loginfo("outList = " + JSON.stringify(outList, null, 4));
		}

		
});
*/
/*
loginfo=function(str) {
	this.loginfo(str);
};
this.logdebug=loginfo;
this.loginfo(this);
hook_queue(function() {
		this.loginfo("next called");
	}, { transaction: {
		body : [{"bodytext" : "1", "body_text_encoded" : "1" , childern: [ { "bodytext" : "1.1" , "body_text_encoded" : "1.1", childern : [] } ]}]
		}} );
*/
/*
	var inpList = require("/home/ubuntu/bin/" + "test2.json");
	this.logdebug=console.log;
        this.logdebug(this.logdebug);
        this.logdebug("call encryptBodyList A:002");
	
        encryptBodyList(inpList, this.logdebug, function(err, logdebug, outList) {
		logdebug("FNL:001 on final");
                if (err) {
                        logdebug("Error" + err);
                        return next(DENY, "Heaerie Email Denied.");
                } else  {
                        logdebug("outList = " + JSON.stringify(outList, null, 4));
		}
	}
	);
	*/
exports.hook_queue = hook_queue;
exports.encryptBodyList=encryptBodyList;
