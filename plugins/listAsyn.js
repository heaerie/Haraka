var openpgp = require('openpgp'); // use as CommonJS, AMD, ES6 module or via window.openpgp
var sleep = require('sleep');
var Sync = require('sync');
var keys = require("./keys.json");

function encryptData(plaintext, key, callback) {
        options = {
            data: plaintext,                             // input as String (or Uint8Array)
            publicKeys: openpgp.key.readArmored(key).keys//,  // for encryption
//          privateKeys: privKeyObj // for signing (optional)
        }
        openpgp.encrypt(options).then(function(ciphertext) {
            callback(null, ciphertext.data);
        });
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
        doneCount++;

        // if doneCount equals the number of items in list, then we're done
        if(doneCount === list.length) {
            callback(err, outList);
	}
    }

    // here we give each iteration its job
    for(var i = 0; i < list.length; i++) {
        // iterator takes 2 arguments, an item to work on and report function
        iterator(list[i], report)
    }
}

IterateOver(["1", "2"], function(value, callback) {
		encryptData(value, keys.pubkey, function(err, encryptedData) {
			callback(null, encryptedData);
		});
	
	}, 
	function(err, outList) {
		console.log("I am  in  final=%s",outList); 
	});
