var logger      = require('./logger');
var config      = require('./config')

console.log(config.get("plugin_timeout"));
console.log(config.get("heaerieMailService.timeout"));
