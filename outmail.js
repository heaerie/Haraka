// node.js built-in libs
var dns         = require('dns');
var fs          = require('fs');
var net         = require('net');
var os          = require('os');
var path        = require('path');

// npm libs
var constants = require('haraka-constants');
var ipaddr      = require('ipaddr.js');
var constants   = require('haraka-constants');
var net_utils   = require('haraka-net-utils');
var utils       = require('haraka-utils');
var Address     = require('address-rfc2821').Address;

// Haraka libs
var outbound    = require('./outbound');
var ResultStore = require('haraka-results');
var util = require('util'),
    async = require("async");
var fs = require('fs');


var hostname    = (os.hostname().split(/\./))[0];
var version     = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'package.json'))).version;


var outbound = require('./outbound');

var plugin = this;

var to = 'durai145@gmail.com';
var from = 'jayagopal.govindaraj@myroomexpense.com';

var contents = [
    "From: " + from,
    "To: " + to,
    "MIME-Version: 1.0",
    "Content-type: text/plain; charset=us-ascii",
    "Subject: Some subject here",
    "",
    "Some email body here",
    ""].join("\n");
    
var outnext = function (code, msg) {
	console.log("code : %s, msg: %s", code, msg);
/*
    switch (code) {
        case DENY:  plugin.logerror("Sending mail failed: " + msg);
                    break;
        case OK:    plugin.loginfo("mail sent");
                    next();
                    break;
        default:    plugin.logerror("Unrecognized return code from sending email: " + msg);
                    next();
    }
*/
};

outbound.send_email(from, to, contents, outnext);
