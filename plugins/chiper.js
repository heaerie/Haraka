var openpgp = require('openpgp'); // use as CommonJS, AMD, ES6 module or via window.openpgp
var sleep = require('sleep');
var Sync = require('sync');
var keys = require("./keys.json");
 
openpgp.initWorker({ path:'openpgp.worker.js' }) // set the relative web worker path
 
openpgp.config.aead_protect = true // activate fast AES-GCM mode (not yet OpenPGP standard)

generateKey = function() {
	var options = {
	    userIds: [{ name:'Jon Smith', email:'jon@example.com' }], // multiple user IDs
	    numBits: 1024,                                            // RSA key size
	    passphrase: 'super long and hard to guess secret'         // protects the private key
	};
	 
	openpgp.generateKey(options).then(function(key) {
	    var privkey = key.privateKeyArmored; // '-----BEGIN PGP PRIVATE KEY BLOCK ... '
	    var pubkey = key.publicKeyArmored;   // '-----BEGIN PGP PUBLIC KEY BLOCK ... '
		console.log(privkey);
		console.log(pubkey);
	});
}

var passphrase='super long and hard to guess secret' ;
var privKeyObj = openpgp.key.readArmored(keys.privkey).keys[0];
privKeyObj.decrypt(passphrase);

function encryptData(plaintext, key, callback) {
	options = {
	    data: plaintext,                             // input as String (or Uint8Array)
	    publicKeys: openpgp.key.readArmored(key).keys//,  // for encryption
//	    privateKeys: privKeyObj // for signing (optional)
	}
	openpgp.encrypt(options).then(function(ciphertext) {
	    callback(null, ciphertext.data); 
	});
}

//decrypt() 
decryptData=function(chipertext, pubkey, callback) {
	var passphrase='super long and hard to guess secret' ;
	var privKeyObj = openpgp.key.readArmored(keys.privkey).keys[0];
	privKeyObj.decrypt(passphrase);
        options = {
            message: openpgp.message.readArmored(chipertext),     // parse armored message
            publicKeys: openpgp.key.readArmored(pubkey).keys,    // for verification (optional)
            privateKey: privKeyObj // for decryption
        };

        openpgp.decrypt(options).then(function(plaintext) {
		console.log(plaintext);
            callback(null, plaintext.data); // 'Hello, World!'
        });
}

encryptDataSync = function(plaintext, key) {
	console.log("start");
	Sync(function() {
	    try {
		console.log("call encryptData.sync");
		var result=encryptData.sync(null, plaintext, key);
		console.log("result" + result);
		return result;
	    }
	    catch (e) {
		console.log("exception" + e);
		return e;	
	    }
	});
	console.log("end sync");
}
decryptDataSync = function(plaintext, key, callback) {
	Sync(function(){
	    try {
		result=decryptData.sync(null, plaintext, pubkey);
		callback(result);
	    }
	    catch (e) {
		return e;	
	    }
	});
}
//encryptData("Hello World", keys.pubkey, function(err,data) { console.log(data); });
/*
Sync(function() {
	encyptDataSync("Hello World", keys.pubkey, function(err, encrypted){
		console.log(encrypted);
	});
});
*/
/*
bodytext = "-----BEGIN PGP MESSAGE-----\r\nVersion: OpenPGP.js v2.5.13\r\nComment: https://openpgpjs.org\r\n\r\nwYwDmiGi9RalvLsBA/wK0NyGCxUBKL1ijeEk/aMEV37BrA6XpRxeHkOGYE4q\nZAIOsnlIY/+j/3RqWQBds4jmn7ME/6Isd7pZLJuomw5FyiInjBXA/vtS6bqj\n1MI6QQDrZEldSWN4qKDHbLSNaiNgUNZMJW7jlmIVZX3887uuxt7S/1P1JsCC\nRoKlY6ZH4dTBmgHyL9Tdo2nTUcYs1U5+NmSY+meag3KFZ5hyYkDRpmiy0ozG\ng7YUv8nTd3o5pyytlILVP/XqHO5b+SXbRGCnCmCG7GI6PbUFCuPZmfmifNS9\nuuJo28x1Q6hr4IQrDx0/ebtSqLD4jf3GVvkrlKB7LJAocu/0zZ3XVQKyzVZA\nPIdhDWWNGTeRFEtnRmiBo2NrSr160ajrjQFJpHBJTNXaNUspDmtwNn6M5A+b\ngiqLgLqmb4JdTteEDFFoaKyeRkg4MCFhEvmpZFUpC4tPnQws9RKrx5eD21zM\nbjadDdKndMLvObq9/9BaaCTRNCciHq07yijFxQNfITctRNpVxLaD6cVF64of\n1ezq60aLmMu2lpAmqy5ogkmL8Lr3BEVc/ytnrtf6qdBrnjuM8xUTHztVXcmg\nc7DRu0Xy6GswzB5S7S59KKRiRQ00MW3dvKqXVeCdrmRnX514xFIFESXhCQTo\nZm3/82oWT0f2XAvFlAdJSaeFB/GgnMJ7PzjNhkYpy8mTeo6bHYd0Z7vDSyVG\nM+0lvgsOAPHkUrVQ05AssyYn9W1alN84zWql/xT2FZeqqXjgnlEegc8PZDx+\nhTnN7AKH1hsWXywgcL0bbV56RG7wPoMr6bxkTkSd+OAKkokojaePpTYAZtS5\nGYpZpT3VmU7/yL6EoM+W/w6CouaFkW9ESy2PmUHW1ClcNMb7WhMFHKCnPyv8\nQ4C2pexrckA7evtz/p7Xt4kro5uYgMPO66miou264sxI55c8S8d7BEzJ0fmq\ndpXv6W+oAr8TRSWvgDGVBSNCdw139I4fFfk5\r\n=Qg5c\r\n-----END PGP MESSAGE-----\r\n";
console.log("call decrypt");
decryptDataSync(bodytext, pubkey, function(decrypted){
	console.log(decrypted);
});
*/
console.log(encryptDataSync("Hello", keys.pubkey));
exports.encryptData = encryptData;
exports.decryptData = decryptData;
exports.encryptDataSync = encryptDataSync;
exports.decryptDataSync = decryptDataSync;

