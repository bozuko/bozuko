Bozuko = require('../bozuko');
var http = Bozuko.require('util/http'),
    create_url = Bozuko.require('util/url').create;

/**
 * Module dependencies.
 */
var fs              = require('fs'),
    // log4js      = require('log4js')(),
    express         = require('express'),
    Schema          = require('mongoose').Schema,
    BozukoStore     = Bozuko.require('core/session/store'),
    Monomi          = require('monomi'),
    Controller      = Bozuko.require('core/controller'),
    TransferObject  = Bozuko.require('core/transfer'),
    Link            = Bozuko.require('core/link'),
    Game            = Bozuko.require('core/game');

exports.init = function(app){

    // setup our models
    initModels();

    // initialize the application
    initApplication(app);

    // setup our device dependent renderer
    Bozuko.require('core/view');

    // setup out transfer objects
    initTransferObjects();

    // setup the controllers
    initControllers(app);

    // setup the games
    initGames(app);

};

function initApplication(app){

    /**
    * Fix for the logger and possibly session stuff with ssl
    */
    app.use(function(req,res, next){
        if( req.socket.socket ){
            req.socket.remoteAddress = req.socket.socket.remoteAddress;
        }
        next();
    });
    // app.use(express.profiler());


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
    // app.use(express.session({key:'bozuko_sid', secret: 'chqsmells'}));

    app.use(Monomi.detectBrowserType());
    app.use(Bozuko.require('middleware/device')());
    app.use(Bozuko.require('middleware/session')());
    app.use(Bozuko.require('middleware/mobile')());
    // app.use(express.profiler());
    app.use(express.logger({ format: ':date [:remote-addr] :method :url :response-time' }));
    app.use(express.compiler({ src: __dirname + '/static', enable: ['less'] }));
    app.use(app.router);
    app.use(express.static(__dirname + '/static'));
    //    app.use(express.repl('Bozuko.', 8050))
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

        Bozuko.db.model( Name, schema );
        Bozuko.models[Name] = Bozuko.db.model(Name);
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
            app.use('/game/'+name, express.static(Bozuko.dir+'/games/'+name+'/resources'));
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
