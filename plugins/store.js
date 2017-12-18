var sqlite3 = require("sqlite3");
var db = new sqlite3.Database('/home/ubuntu/mail/data/sample.db');
var keys = require("./keys.json");
  // insert one row into the langs table
saveToLocal= function(req) {
  db.run(`INSERT INTO MAIL001TT(send_time, request, status) VALUES(DATETIME('now'), ?, 0)`, [req], function(err) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been inserted with rowid ${this.lastID}`);
  });

}

close = function() { 
  // close the database connection
  db.close();
}

exports.saveToLocal = saveToLocal;
exports.close = close;
saveToLocal(JSON.stringify(require("./req.json")));


