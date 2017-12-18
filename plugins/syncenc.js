var openpgp = require('openpgp'); // use as CommonJS, AMD, ES6 module or via window.openpgp
var sleep = require('sleep');
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

function WaterfallOver(list, iterator, callback) {
    var nextItemIndex = 0;  //keep track of the index of the next item to be processed

    var outList = [];
    function report(err, obj) {

        nextItemIndex++;

	outList.push(obj);
        // if nextItemIndex equals the number of items in list, then we're done
        if(nextItemIndex === list.length)
            callback(err, outList);
        else
            // otherwise, call the iterator on the next item
            	iterator(list[nextItemIndex], report);
    }

    // instead of starting all the iterations, we only start the 1st one
    iterator(list[0], report);
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
	log("in report  doneCount=" + doneCount);
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

function encryptBodyList(bodyList, pubkey, log, fcallback) {
WaterfallOver(bodyList, function(bodyObj, callback) {
		log("\nbodyObj=" + JSON.stringify(bodyObj));
		log("\ncall encryptData..");
		encryptData(bodyObj.bodytext, pubkey, function(err, encryptedBodytext) {
			log("\nin encryptData.." + JSON.stringify(encryptedBodytext, null,4));
			if(err) {
				callback(err, null);
			}
			bodyObj.bodytext = encryptedBodytext;
			encryptData(bodyObj.body_text_encoded, keys.pubkey, function(err, encryptedBodyTextEncoded) {
			
				if(err) {
					callback(err, null);
				}
				bodyObj.body_text_encoded = encryptedBodyTextEncoded ;
				if ((bodyObj.children != undefined ) &&  (bodyObj.children.length != 0)) {
					console.log("bodyObj.children " + bodyObj.children);
					encryptBodyList(bodyObj.children,  pubkey, log, function(err, childList) {
						if(err) {
							callback(err, null);
						}
						log(childList);
						bodyObj.children = childList;
						callback(err, bodyObj);
					});
				} else {
					callback(err, bodyObj);
				}
			})
			
		});
	
	}, 
	function(err, outList) {
		log("\n final call err=" + err + "outList " + JSON.stringify(outList));
		log(fcallback);
		fcallback(err, outList);
	});
}

encryptBodyList([{"bodytext" : "1", "body_text_encoded" : "1" , children: [ { "bodytext" : "1.1" , "body_text_encoded" : "1.1", children : [] } ]} , { "bodytext" : "2", "body_text_encoded" : "2", children:[]}],  keys.pubkey, console.log, function (err, outList) {
		if (err) {
			console.log("Error " + err);
		} else  {
			console.log("outList = " + JSON.stringify(outList, null, 4));
		}

		
});

exports.encryptBodyList=encryptBodyList;
