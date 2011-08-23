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
    Schema          = require('mongoose').Schema,
    BozukoStore     = Bozuko.require('core/session/store'),
    Monomi          = require('monomi'),
    Controller      = Bozuko.require('core/controller'),
    TransferObject  = Bozuko.require('core/transfer'),
    Link            = Bozuko.require('core/link'),
    Game            = Bozuko.require('core/game');

Bozuko.env = function(){
    return process.env.NODE_ENV || 'development';

};

Bozuko.getConfig = function(){
    return require(Bozuko.dir+'/config/'+this.env());
}

Bozuko.config = Bozuko.getConfig();

Bozuko.getConfigValue = function(key, defaultValue){
	
	var getValue = function( keys, obj ){
		if(keys.length > 1){
			var key = keys.shift();
			if( typeof obj[key] === 'undefined' ) return defaultValue;
			return getValue(keys, obj[key]);
		}
		if( obj[keys[0]] === 'undefined' ) return defaultValue;
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
Bozuko.transfer = function(key, data, user, callback){
    if( !data ) return this._transferObjects[key];
    try{
        if( Array.isArray(data) ){
            var ret = [];
            var self = this;
			return async.forEachSeries( data,
				function iterator(o, next){
					return self._transferObjects[key].create(o, user, function( error, result){
						if( error ) return next(error);
						ret.push(result);
						return next();
					});
				},
				function cb(error){
					if( error ) return callback( error );
					return callback( null, ret );
				}
			);
        }
        else{
            return this._transferObjects[key].create(data, user, function(error, result){
				if( error ) return callback( error );
				return callback( null, result );
			});
        }
    }catch(e){
        return callback(e);
    }
};

Bozuko.validate = function(key, data) {
    if( !data ) return false;
    var prof = new Profiler('/bozuko/validate');
    var ret = this._transferObjects[key].validate(data);
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

Bozuko.transfers = function(){
    return this._transferObjects;
};

Bozuko.link = function(key){
    return this._links[key];
};

Bozuko.links = function(){
    return this._links;
};

Bozuko.entry = function(key, user, options){
    var Entry = this.require('core/contest/entry/'+key);
    return new Entry(key, user, options);
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
				/*
				'/listen',
				'/alive',
				'/data'
				*/
			]
		}));
    }

    // setup basic authentication for development
    if( Bozuko.config.server.auth ){
        app.use(express.basicAuth(function(user, pass){
            return Bozuko.config.auth[user] == pass;
        }));
    }

    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');

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

    // handle unknown errors (How can I check for ETIMEDOUT throwing a socket error?)
//    process.on('uncaughtException', function(err) {
  //      console.error("UNCAUGHT EXCEPTION: "+err);
//    });
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
        // plugin native functions
        schema.plugin(require('./models/plugins/native'));
        // add the name
        schema.static('getBozukoModel', function(){
            return Bozuko.models[Name];
        });

        Bozuko.models[Name] = Bozuko.db.model( Name, schema );
    });
}

function initTransferObjects(){
    Bozuko._transferObjects = {};
    Bozuko._links = {};
    var controllers = [];;
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
        // first check for object_types and links
        controllers.push(Bozuko.require('controllers/'+name));
    });
    // collect all the links first so they can be associated in the Transfer Objects
    controllers.forEach(function(controller){
        if( controller.links ){
            Object.keys(controller.links).forEach(function(key){
                var config = controller.links[key];
                Bozuko._links[key] = Link.create(key, config);
            });
        }
    });
    controllers.forEach(function(controller){
        if(controller.transfer_objects){
            Object.keys(controller.transfer_objects).forEach(function(key){
                var config = controller.transfer_objects[key];
                Bozuko._transferObjects[key] = TransferObject.create(key, config);
            });
        }
    });

    // okay, one last time through the links to associate
    // the return objects

    Object.keys(Bozuko.links()).forEach(function(key){
        var link = Bozuko.link(key);
        Object.keys(link.methods).forEach(function(name){
            var method = link.methods[name];
            var r = method.returns;
            if( r instanceof Array ){
                r = r[0];
            }
            var t = Bozuko.transfer(r);
            if( t ) t.returnedBy(link);
        });
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
            // var Name = name.charAt(0).toUpperCase()+name.slice(1);
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
            if (err) console.log("Failed to get existing facebook subscriptions");
			body = JSON.parse(body);
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

Bozuko.initStats= function(){
    var stats = Bozuko.require('util/stats');
    var ms_per_hr = 1000*60*60;
    var ms_per_day = ms_per_hr*24;

    // Do an initial collection. Mongoose middleware will prevent duplication of records
    // for the same day if a crash occurs.
    stats.collect_all(logErr);

    setInterval(function() {
        stats.collect_all(logErr);
    }, ms_per_day);
    console.log('initStats');
};

function logErr(err, val) {
    if (err) {
        console.log(err);
    }
}


// setup our models
initModels();

// setup out transfer objects
initTransferObjects();


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
