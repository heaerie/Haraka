var fs=require('fs');
var writeJson=function(filename, json) {
	fs.writeFileSync(filename, JSON.stringify(json, null, 4));
}

var writeJsonTest = function() {
	writeJson("/home/ubuntu/bin/"+"test1.json", [{"test": "001"}]);
}
writeJsonTest();
exports.writeJson =  writeJson;
