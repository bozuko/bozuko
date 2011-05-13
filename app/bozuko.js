var fs              = require('fs');

// setup the global object
Bozuko = {};

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

Bozuko.getApp = function(){
    if( !Bozuko.app ){
        var app = Bozuko.require('core/server');
        Bozuko.configureApp(app);
        initApplication( app );
        initControllers( app );
        initGames( app );
        // setup our device dependent renderer
        Bozuko.require('core/view');
        Bozuko.app = app;
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
Bozuko.transfer = function(key, data, user){
	if( !data ) return this._transferObjects[key];
	try{

		if( Array.isArray(data) ){
			var ret = [];
			var self = this;
			data.forEach( function(o){ ret.push(self._transferObjects[key].create(o, user)); } );
			return ret;
		}
        else{
			return this._transferObjects[key].create(data, user);
		}
	}catch(e){
        return Bozuko.error('bozuko/transfer', e.message);
	}
};

Bozuko.validate = function(key, data) {
    if( !data ) return false;
    return this._transferObjects[key].validate(data);
};

Bozuko.sanitize = function(key, data){
    if( !data ) return false;
    return this.transfer(key, data);
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
	    if( typeof message != 'string' && message.code ){
			code = message.code;
	        message = message.message;
	    }
	    return new BozukoError(name,message,data,code);
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
    if (Bozuko.env() != 'test') {
        app.use(Bozuko.require('middleware/profiler')());
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
    if (Bozuko.env() != 'test') {
        app.use(express.logger({ format: ':date [:remote-addr] :method :url :response-time' }));
    }
    app.use(express.compiler({ src: __dirname + '/static', enable: ['less'] }));
    app.use(app.router);
    app.use(express.static(__dirname + '/static'));
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

function initControllers(app){
    Bozuko.controllers = {};
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
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
        }
    });
}

// this will be called 4 times with multinode...
// not sure how to avoid this...
function initFacebookPubSub(){
    var url = 'https://graph.facebook.com/'+
              Bozuko.config.facebook.app.id+
              '/subscriptions?access_token='+
              Bozuko.config.facebook.app.access_token;

    // first we need to delete any existing subscriptions
    http.request({
        url: url,
        method: 'DELETE',
        callback: function(body){
            // now lets setup the new subscriptions
            console.log('deleted?');
            http.request({
                url: url,
                method: 'POST',
                params: {
                    object: 'user',
                    fields: 'likes',
                    callback_url: create_url('/facebook/pubsub'),
                    verify_token: Bozuko.config.facebook.app.pubsub_verify
                }
            });
            http.request({
                url: url,
                method: 'POST',
                params: {
                    object: 'permissions',
                    fields: Bozuko.config.facebook.perms.business,
                    callback_url: create_url('/facebook/pubsub'),
                    verify_token: Bozuko.config.facebook.app.pubsub_verify
                }
            });
        }
    });
}
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

module.exports = Bozuko;
