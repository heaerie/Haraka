"use strict";

var Stream = require('stream');
var util   = require('util');

function AttachmentStream () {
    var self = this;
    Stream.call(this);
    this.encoding = null;
    this.paused = false;
    this.end_emitted = false;
    this.buffer = [];
}

util.inherits(AttachmentStream, Stream);

AttachmentStream.prototype.emit_data = function (data) {
    // console.log("YYY: DATA emit");
    if (this.paused) {
        return this.buffer.push(data);
    }

    if (this.encoding) {
        this.emit('data', data.toString(this.encoding));
    }
    else {
        this.emit('data', data);
    }
}

AttachmentStream.prototype.emit_end = function () {
    if (this.paused) {
        this.end_emitted = true;
    }
    else {
        this.emit('end');
    }
}

AttachmentStream.prototype.pipe = function (dest, options) {
    var self = this;
    this.paused = false;
    Stream.prototype.pipe.call(this, dest, options);
    dest.on('drain', function () {
        // console.log("YYY: DRAIN!!!");
        if (self.paused) self.resume();
    });
    dest.on('end', function () {
        // console.log("YYY: END!!");
        if (self.paused) self.resume();
    })
    dest.on('close', function () {
        // console.log("YYY: CLOSE!!");
        if (self.paused) self.resume();
    })
}

AttachmentStream.prototype.setEncoding = function (enc) {
    if (enc !== 'binary') {
        throw "Unable to set encoding to anything other than binary";
    }
    this.encoding = enc;
}

AttachmentStream.prototype.pause = function () {
    // console.log("YYY: PAUSE!!");
    this.paused = true;
    if (this.connection && this.connection.client && this.connection.client.pause) {
        // console.log("YYYY: Backpressure pause");
        this.connection.client.pause();
    }
}

AttachmentStream.prototype.resume = function () {
    // console.log("YYY: RESUME!!");
    if (this.connection && this.connection.client && this.connection.client.resume) {
        // console.log("YYYY: Backpressure resume");
        this.connection.client.resume();
    }
    this.paused = false;
    if (this.buffer.length) {
        while (this.paused === false && this.buffer.length > 0) {
            this.emit_data(this.buffer.shift());
        }
        if (this.buffer.length === 0 && this.end_emitted) {
            this.emit('end');
        }
    }
}

AttachmentStream.prototype.destroy = function () {
    // console.log("YYYY: Stream destroyed");
}

exports.createStream = function () {
    return new AttachmentStream ();
}
