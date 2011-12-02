var fs = require('fs'),
    async  = require('async'),
    existsSync = require('path').existsSync,
    Profiler = require('./util/profiler')
;

// setup the global object
Bozuko = {};

// override console.error so error logs have timestamps
var errlog = console.error;
console.error = function(msg) {
    errlog(new Date().toString() + " " + msg);
};

Bozuko.dir = fs.realpathSync(__dirname+'/..');

Bozuko.require = function(module){
    try{
        return require(Bozuko.dir+'/app/'+module);
    }catch(e){
        console.log('Module not found ('+module+')');
        throw(e);
    }
};

Bozuko.require('core/error');
Bozuko.db = Bozuko.require('core/db');

var self = this;

/**
 * Module dependencies.
 */

var http            = Bozuko.require('util/http'),
    create_url      = Bozuko.require('util/url').create,
    express         = require('express'),
    connectForm		= require('connect-form'),
    Schema          = require('mongoose').Schema,
    BozukoStore     = Bozuko.require('core/session/store'),
    Monomi          = require('monomi'),
    Controller      = Bozuko.require('core/controller'),
    Link            = Bozuko.require('core/link'),
    Game            = Bozuko.require('core/game');

Bozuko.env = function(){
    return process.env.NODE_ENV || 'development';

};

Bozuko.getConfig = function(){
    return require(Bozuko.dir+'/config/'+this.env());
};
Bozuko.config = Bozuko.getConfig();

Bozuko.getConfigValue = function(key, defaultValue){

	var getValue = function( keys, obj ){
		if(keys.length > 1){
			var key = keys.shift();
			if( obj[key] === undefined ) return defaultValue;
			return getValue(keys, obj[key]);
		}
		if( obj[keys[0]] === undefined ) return defaultValue;
		return obj[keys[0]];
	};

	return getValue( key.split('.'), Bozuko.getConfig());
};

Bozuko.cfg = Bozuko.getConfigValue;

Bozuko.getApp = function(){
    if( !Bozuko.app ){
        var app = Bozuko.require('core/server');
        Bozuko.configureApp(app);
        initApplication( app );
	initGames( app );
        initControllers( app );
        // setup our device dependent renderer
        Bozuko.require('core/view');
        Bozuko.app = app;

		// Bozuko.socket = socketIO.listen( Bozuko.app );
    }
    return Bozuko.app;
};


/**
 * Bozuko.app MUST be set by the application prior to calling configure()
 */
Bozuko.configureApp = function(app) {
    if (!app) {
        throw new Error("Bozuko.app not set!");
    }
    app.configure( Bozuko.env(), function(){
        switch( Bozuko.env() ){

            case 'production':
                app.use(express.errorHandler());
                break;
            default:
                app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
                break;
        }
    });
};

Bozuko.services = {};
Bozuko.service = function(name){
    if( !Bozuko.services[name] ){
            var Service = this.require('core/services/'+(name||'facebook'));
        Bozuko.services[name] = new Service();
    }
    return Bozuko.services[name];
};

Bozuko.game = function(contest){
    return new this.games[contest.game](contest);
};

Bozuko.validate = function(key, data) {
    if( !data ) return false;
    var prof = new Profiler('/bozuko/validate');
    var ret = this.transfer.objects[key].validate(data);
    prof.stop();
    return ret;
};

Bozuko.sanitize = function(key, data){
    if( !data ) return false;
    var prof = new Profiler('/bozuko/sanitize');
    var ret = this.transfer(key, data);
    prof.stop();
    return ret;
};

Bozuko.transfer = Bozuko.require('core/transfer');

Bozuko.transfers = function(){
    return this.transfer.objects;
};

Bozuko.link = function(key){
    return this.transfer.links[key];
};

Bozuko.links = function(){
    return this.transfer.links;
};

Bozuko.transfer.init({docs_dir: Bozuko.dir+'/content/docs/api'});

Bozuko.enter = function(opts, callback) {
    var entry = this.entry(opts);
    return entry.enter(callback);
};

Bozuko.entry = function(options){
    var Entry = this.require('core/entry/'+options.type);
    return new Entry(options);
};

Bozuko.error = function(name, data){

    var path = name.split('/');
    var err = path.pop();
    var BozukoError = this.require('core/error');

    try{
        var message = this.require('errors/'+path.join('/'))[err];
        var code = null;
		var title = null;
		if( message.title ){
			title = message.title;
		}
        if( typeof message != 'string' ){
            if( message.code ) code = message.code;
			message = message.message;
        }
        return new BozukoError(name,message,data,code,title);
    }catch(e){
        var error = new BozukoError();
        error.name = name;
        error.code = 500;
        return error;
    }
};

Bozuko.t = function(){
    return Bozuko.require('core/lang').translate.apply(this, arguments);
};


function initApplication(app){

    // Handle socket errors
    app.use(Bozuko.require('middleware/errorHandler')());

    if (Bozuko.env() != 'test') {
        app.use(Bozuko.require('middleware/profiler')({
            ignore: [
		'/listen',
		'/alive',
		'/data'
	    ]
	}));
    }

//    app.use(Bozuko.require('middleware/maintenance'));

    // setup basic authentication for development
    if( Bozuko.config.server.auth ){
        app.use(express.basicAuth(function(user, pass){
            return Bozuko.config.auth[user] == pass;
        }));
    }

    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');

	// create our upload folder if it doesn't exist
	var uploadDir = __dirname + '/../uploads';
	if( !existsSync( uploadDir ) ){
		fs.mkdirSync( uploadDir, 0755 );
	}

	app.use((function(){
		var form = connectForm({
			keepExtensions:true,
			uploadDir: uploadDir
		});
		return function(req, res, next){

			return form(req, res, function(){

				if( !req.form ) return next();

				var complete = false, error, fields, files;

				function finish(cb){
					return cb(error, fields, files);
				};
				req.form.processed = function(cb){
					if( !complete ) {
						return req.form.on('processed', function(){
							finish(cb);
						});
					}
					return finish(cb);
				};

				// start this right away.
				req.form.complete(function(_error, _fields, _files){
					error = _error;
					fields = _fields;
					files = _files;
					complete = true;
					req.form.emit('processed');
				});
				return next();
			});
		};
	})());

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());

    Bozuko.sessionStore = new BozukoStore({
        reapInterval: 1000 * 60 * 5,
        maxAge: 1000 * 60 * 60 * 24
    });

    app.use(express.session({key:'bozuko_sid', secret: 'chqsmells', store: Bozuko.sessionStore }));
    app.use(Monomi.detectBrowserType());
    app.use(Bozuko.require('middleware/device')());
    app.use(Bozuko.require('middleware/session')());
    app.use(Bozuko.require('middleware/mobile')());
	// app.use(Bozuko.require('middleware/location')());
	app.use(Bozuko.require('middleware/poweredby')());

    if (Bozuko.env() != 'test') {
        app.use(Bozuko.require('middleware/logger')({
			ignore: [
				/*
				'/listen',
				'/alive',
				'/data'
				*/
			],
			format: ':date [:remote-addr] :method :url :response-time'
		}));
    }
    if( Bozuko.env() == 'playground' ){
        // app.use(Bozuko.require('middleware/debug')());
    }

    app.use(express.compiler({ src: __dirname + '/static', enable: ['less'] }));

    app.use(app.router);

    app.use(express.static(__dirname + '/static',{maxAge: 1000 * 60 * 60 * 24 * 2}));

    // listen for http server errors
    app.on('clientError', function(err) {
        console.error("HTTP Client Error: "+err);
    });
    app.on('error', function(err) {
        console.error("HTTP Server Error: "+err);
    });
}

function initModels(){
    Bozuko.models = {};
    fs.readdirSync(__dirname + '/models').forEach(function(file){

        if( !/\.js$/.test(file) ) return;

        // get the name
        var name = file.replace(/\..*?$/, '');
        var Name = name.charAt(0).toUpperCase()+name.slice(1);

        // create the model
        var schema =  require('./models/'+name);

		// global plugins
        schema.plugin(require('./models/plugins/native'));

		if( existsSync( __dirname+'/models/events/'+file) ){
			schema.plugin(require('./models/events/'+name));
		}

		// add the name
        schema.static('getBozukoModel', function(){
            return Bozuko.models[Name];
        });

        Bozuko.models[Name] = Bozuko.db.model( Name, schema );
    });
}

function useController(name){
	var cfg = Bozuko.getConfig();
	if(!cfg.controllers) return true;
	if( cfg.controllers.only && !~cfg.controllers.only.indexOf(name) ) return false;
	if( cfg.controllers.except && ~cfg.controllers.except.indexOf(name) ) return false;
	return true;
}

function initControllers(app){
    Bozuko.controllers = {};
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
		if( !useController(name) ) return;
        var Name = name.charAt(0).toUpperCase()+name.slice(1);
        Bozuko.controllers[Name] = Controller.create(app,name,Bozuko.require('controllers/'+name));
    });
}

function initGames(app){
    Bozuko.games = {};
    var dir = __dirname + '/games';
    fs.readdirSync(dir).forEach( function(file){
        var stat = fs.statSync(dir+'/'+file);
        if( stat.isDirectory() && file != 'test'){
            var name = file.replace(/\..*?$/, '');
            Bozuko.games[name] = Bozuko.require('/games/'+file);
            app.use('/games/'+name, express.static(Bozuko.dir+'/app/games/'+name+'/resources'));
            Bozuko.games[name].themes = [];

            // check for themes
            var themes_dir = dir+'/'+name+'/themes';
            if( existsSync(themes_dir) ) fs.readdirSync(themes_dir).forEach( function(theme){
	        if( theme == 'test' ) return;
		var stat = fs.statSync(themes_dir+'/'+theme);
                if( !stat.isDirectory() ) return;

		// lets listen on their resources folders
                app.use('/games/'+name+'/themes/'+theme, express.static(themes_dir+'/'+theme+'/resources'));

		// check for the meta file
		var meta = themes_dir+'/'+theme+'/meta.js';
		if( existsSync( meta ) ){
	            // the meta information to our themes array
	            Bozuko.games[name].themes.push(
		        Bozuko.require('core/game').parseThemeMeta(
		            themes_dir+'/'+theme,
			    name,
			    theme,
			    require( meta )
			)
		    );
		}
            });

	    Bozuko.games[name].themes.sort(function(a,b){
		if( a.theme == 'default' && b.theme != 'default'){
	            return -1;
		}
		if( b.theme == 'default' && a.theme != 'default'){
	            return 1;
		}
		return a.theme.toLowerCase() - b.theme.toLowerCase();
	    });
        }
    });
}

// this will be called 4 times with multinode...
// not sure how to avoid this...
Bozuko.initFacebookPubSub = function(){
    var url = 'https://graph.facebook.com/'+
              Bozuko.config.facebook.app.id+
              '/subscriptions?access_token='+
              Bozuko.config.facebook.app.access_token,

		pubsub_url = create_url('/facebook/pubsub')
		;

    // first we need to delete any existing subscriptions
    http.request({
        url: url,
        method: 'GET'},
        function(err, body){
            if (err){
				console.log("Failed to get existing facebook subscriptions");
				return;
			}
			console.log('Existing Facebook Subscriptions');
			console.log(body);
			// now lets setup the new subscriptions
            // Should there be other error checking for the following 2 http requests?
			if(body && body.data && body.data.length ){
				var found = false;
				body.data.forEach(function(subscription){
					if( subscription.callback_url == pubsub_url ){
						found = true;
					}
				});
				if( found ){
					console.log('Facebook PubSub for '+pubsub_url+' exists.');
					return;
				}
			}
			console.log('Creating PubSub for '+pubsub_url);
            http.request({
                url: url,
                method: 'POST',
                params: {
                    object: 'user',
                    fields: 'likes,friends',
                    callback_url: pubsub_url,
                    verify_token: Bozuko.config.facebook.app.pubsub_verify
                }
            });
            http.request({
                url: url,
                method: 'POST',
                params: {
                    object: 'permissions',
                    fields: Bozuko.config.facebook.perms.user,
                    callback_url: pubsub_url,
                    verify_token: Bozuko.config.facebook.app.pubsub_verify
                }
            });
        }
    );
}

Bozuko.initHttpRedirect = function(){
	var http = require('http'),
		config = Bozuko.getConfig()
		;

	var redirect_server = http.createServer(function(req, res){
		var ssl_url = (config.server.ssl ? 'https://' : 'http://')
					+ config.server.host
					+ req.url;

		res.writeHead(301, {
			'Location':ssl_url
		});
		res.end();
	});

	redirect_server.listen(80);
};

var ms_per_hr = 1000*60*60;
Bozuko.initStats= function(){
    var stats = Bozuko.require('util/stats');
    var ms_per_day = ms_per_hr*24;

    // Do an initial collection. Mongoose middleware will prevent duplication of records
    // for the same day if a crash occurs.
    stats.collect_all(logErr);

    setInterval(function() {
        stats.collect_all(logErr);
    }, ms_per_day);
    console.log('initStats');
};

Bozuko.initAutoRenew = function() {
    Bozuko.models.Contest.autoRenew(logErr);
    setInterval(function() {
        Bozuko.models.Contest.autoRenew(logErr);
    }, ms_per_hr*12);
};

function logErr(err, val) {
    if (err) {
        console.error(err);
    }
}


// setup our models
initModels();


var PubSub = Bozuko.require('core/pubsub');
Bozuko.pubsub = new PubSub();
Bozuko.pubsub.setMaxListeners(20);
Bozuko.publish = function(){
	Bozuko.pubsub.publish.apply( Bozuko.pubsub, arguments );
};
Bozuko.subscribe = function(){
	Bozuko.pubsub.subscribe.apply( Bozuko.pubsub, arguments );
};
Bozuko.unsubscribe = function(){
	Bozuko.pubsub.unsubscribe.apply( Bozuko.pubsub, arguments );
};
Bozuko.since = function(date, callback){
	Bozuko.pubsub.since(date, callback);
};

if( !Bozuko.cfg('pubsub.enabled', true) ){
	Bozuko.pubsub.stop();
}
module.exports = Bozuko;
