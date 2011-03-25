var bozuko = Bozuko = require('bozuko');

/**
 * Module dependencies.
 */
var fs              = require('fs'),
    // log4js      = require('log4js')(),
    express         = require('express'),
    Schema          = require('mongoose').Schema,
    MemoryStore     = require('connect').middleware.session.MemoryStore,
    Monomi          = require('monomi'),
    Controller      = bozuko.require('core/controller'),
    TransferObject  = bozuko.require('core/transfer'),
    Link            = bozuko.require('core/link'),
    Game            = bozuko.require('core/game');

exports.run = function(app){

    // initialize the application
    initApplication(app);

    // setup our device dependent renderer
    bozuko.require('core/view');

    // setup our models
    initModels();

    // setup out transfer objects
    initTransferObjects();

    // setup the controllers
    initControllers(app);

    // setup the games
    initGames(app);

    // setup stats collection
    //initStats();

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
    if( bozuko.env == 'development'){
        app.use(express.basicAuth(function(user, pass){
            return bozuko.config.auth[user] == pass;
        }));
    }

    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ store: new MemoryStore({ reapInterval: -1 }), secret: 'chqsmells' }));
    
    app.use(Monomi.detectBrowserType());
    app.use(bozuko.require('middleware/device')());
    app.use(bozuko.require('middleware/session')());

    app.use(express.logger({ format: ':date [:remote-addr] :method :url :response-time' }));
    app.use(express.compiler({ src: __dirname + '/../static', enable: ['less'] }));
    app.use(app.router);
    //    app.use(express.repl('bozuko>', 8050));
    app.use(express.static(__dirname + '/../static'));

}

function initModels(){
    bozuko.models = {};
    fs.readdirSync(__dirname + '/models').forEach(function(file){

        if( !/\.js$/.test(file) ) return;

        // get the name
        var name = file.replace(/\..*?$/, '');
        var Name = name.charAt(0).toUpperCase()+name.slice(1);

        // create the model
        var schema =  require('./models/'+name);

        bozuko.db.model( Name, schema );
        //Mongoose.Model.define(Name, config);
        bozuko.models[Name] = bozuko.db.model(Name);
    });
}

function initTransferObjects(){
    bozuko._transferObjects = {};
    bozuko._links = {};
    var controllers = [];;
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
        // first check for object_types and links
        controllers.push(bozuko.require('controllers/'+name));
    });
    // collect all the links first so they can be associated in the Transfer Objects
    controllers.forEach(function(controller){
        if( controller.links ){
            Object.keys(controller.links).forEach(function(key){
                var config = controller.links[key];
                bozuko._links[key] = Link.create(key, config);
            });
        }
    });
    controllers.forEach(function(controller){
        if(controller.transfer_objects){
            Object.keys(controller.transfer_objects).forEach(function(key){
                var config = controller.transfer_objects[key];
                bozuko._transferObjects[key] = TransferObject.create(key, config);
            });
        }
    });

    // okay, one last time through the links to associate
    // the return objects

    Object.keys(bozuko.links()).forEach(function(key){
        var link = bozuko.link(key);
        Object.keys(link.methods).forEach(function(name){
            var method = link.methods[name];
            var r = method.returns;
            if( r instanceof Array ){
                r = r[0];
            }
            var t = bozuko.transfer(r);
            if( t ) t.returnedBy(link);
        });
    });
}

function initControllers(app){
    bozuko.controllers = {};
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){

        if( !/js$/.test(file) ) return;

        var name = file.replace(/\..*?$/, '');
        var Name = name.charAt(0).toUpperCase()+name.slice(1);
        bozuko.controllers[Name] = Controller.create(app,name,bozuko.require('controllers/'+name).routes);
    });
}

function initGames(app){
    bozuko.games = {};
    var dir = __dirname + '/games';
    fs.readdirSync(dir).forEach( function(file){
        var stat = fs.statSync(dir+'/'+file);
        if( stat.isDirectory() ){
            var name = file.replace(/\..*?$/, '');
            // var Name = name.charAt(0).toUpperCase()+name.slice(1);
            bozuko.games[name] = bozuko.require('/games/'+file);
            app.use('/game/'+name, express.static(bozuko.dir+'/games/'+name+'/resources'));
        }
    });
}

function initStats() {
    var stats = bozuko.require('util/stats');
    var ms_per_hr = 1000*60*60;
    var ms_per_day = ms_per_hr*24;
    var now = new Date();
    var hours = 24 - now.getHours();

    // If the server crashes stats will be accurate to within 1 hour
    setTimeout(function() {
        stats.collect_all(logErr);
        setInterval(function() {
            stats.collect_all(logErr);
        }, ms_per_day);
    }, hours*ms_per_hr);
    console.log("initstats");
}

function logErr(err, val) {
    if (err) {
        console.log(JSON.stringify(err));
    }
}