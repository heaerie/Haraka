'use strict';

var fs           = require('fs');
var path         = require('path');

var fixtures     = require('haraka-test-fixtures');

var Connection   = fixtures.connection;
var Plugin       = fixtures.plugin;

var _set_up = function (done) {
    this.plugin = new Plugin('tls');
    this.connection = Connection.createConnection();
    this.plugin.tls_opts = {};
    done();
};

exports.plugin = {
    setUp : _set_up,
    'should have function register' : function (test) {
        test.expect(2);
        test.ok(this.plugin);
        test.equal('function', typeof this.plugin.register);
        test.done();
    },
    'should have function load_tls_ini' : function (test) {
        test.expect(1);
        test.equal('function', typeof this.plugin.load_tls_ini);
        test.done();
    },
    'should have function upgrade_connection' : function (test) {
        test.expect(1);
        test.equal('function', typeof this.plugin.upgrade_connection);
        test.done();
    },
    'should have function advertise_starttls' : function (test) {
        test.expect(1);
        test.equal('function', typeof this.plugin.advertise_starttls);
        test.done();
    },
    'should have function emit_upgrade_msg' : function (test) {
        test.expect(1);
        test.equal('function', typeof this.plugin.emit_upgrade_msg);
        test.done();
    },
};

function tls_ini_overload (plugin) {
    plugin.config = plugin.config.module_config(path.resolve('tests'));
    plugin.cfg = plugin.config.get('tls.ini', {
        booleans: [
            '-main.honorCipherOrder',
            '-main.requestCert',
            '-main.rejectUnauthorized',
        ]
    });

    var config_options = [
        'ciphers','requestCert','rejectUnauthorized',
        'key','cert','honorCipherOrder','ecdhCurve','dhparam',
        'secureProtocol'
    ];

    for (var i = 0; i < config_options.length; i++) {
        var opt = config_options[i];
        if (plugin.cfg.main[opt] === undefined) { continue; }
        plugin.tls_opts[opt] = plugin.cfg.main[opt];
    }
}

exports.load_tls_ini = {
    setUp : _set_up,
    'loads test/config/tls.ini' : function (test) {
        tls_ini_overload(this.plugin);

        test.expect(4);
        test.equal(true, this.plugin.cfg.main.requestCert);
        test.ok(this.plugin.cfg.main.ciphers);
        test.ok(this.plugin.cfg.no_tls_hosts);
        test.equal(true, this.plugin.cfg.main.honorCipherOrder);
        test.done();
    }
};

exports.load_tls_opts = {
    setUp : function (done) {
        this.plugin = new Plugin('tls');
        this.plugin.tls_opts = {};
        tls_ini_overload(this.plugin);
        done();
    },
    'TLS key loaded' : function (test) {
        test.expect(1);
        this.plugin.load_tls_opts();
        test.ok(this.plugin.tls_opts.key.length);
        test.done();
    },
    'TLS cert loaded' : function (test) {
        test.expect(1);
        this.plugin.load_tls_opts();
        test.ok(this.plugin.tls_opts.cert.length);
        test.done();
    },
    'TLS dhparams loaded' : function (test) {
        test.expect(1);
        this.plugin.load_tls_opts();
        test.equal(this.plugin.tls_opts.dhparam.toString(), '-----BEGIN DH PARAMETERS-----\nMIGHAoGBAMylA+U3JgfrXqnNYJXQN70nRWjzA4sndjkjW+hLhHgQ/K8Ndwj7lfQz\ng95rLJOuvjEAkYqSANhaVNnKge6FqMM0FdW0/gFSfAh7PZJsOt9ypQRvyyX8/P3T\nzW4WTRaHNBOala5yT7pxXrzpIbkaUXAkrk2E9TjqD4pjgk9VYtFrAgEC\n-----END DH PARAMETERS-----\n');
        test.done();
    },
};

exports.register = {
    setUp : function (done) {
        this.plugin = new Plugin('tls');

        // overload load_pem to get files from tests/config
        this.plugin.load_pem = function (file) {
            return fs.readFileSync('./tests/config/' + file);
        };

        done();
    },
    'with certs, should call register_hook()' : function (test) {
        test.expect(2);
        this.plugin.register();
        test.ok(this.plugin.cfg.main.requestCert);
        test.ok(this.plugin.register_hook.called);
        // console.log(this.plugin);
        test.done();
    },
};

exports.dont_register = {
    setUp : function (done) {
        this.plugin = new Plugin('tls');

        // overload load_pem to get files from tests/config
        this.plugin.load_pem = function (file) {
            try {
                return fs.readFileSync('./non-exist/config/' + file);
            }
            catch (ignore) {}
        };

        done();
    },
    'w/o certs, should not call register_hook()' : function (test) {
        test.expect(1);
        this.plugin.register();
        test.equal(this.plugin.register_hook.called, false);
        // console.log(this.plugin);
        test.done();
    },
};

exports.emit_upgrade_msg = {
    setUp : _set_up,
    'should emit a log message': function (test) {
        test.expect(1);
        test.equal(this.plugin.emit_upgrade_msg(this.connection, true, '', {
            subject: {
                CN: 'TLS.subject',
                O: 'TLS.org'
            },
        }),
        'secured: verified=true cn="TLS.subject" organization="TLS.org"');
        test.done();
    },
    'should emit a log message with error': function (test) {
        test.expect(1);
        test.equal(this.plugin.emit_upgrade_msg(this.connection, true, 'oops', {
            subject: {
                CN: 'TLS.subject',
                O: 'TLS.org'
            },
        }),
        'secured: verified=true error="oops" cn="TLS.subject" organization="TLS.org"');
        test.done();
    }
}
