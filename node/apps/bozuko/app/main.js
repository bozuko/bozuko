var bozuko = require('bozuko');

/**
 * Module dependencies.
 */
var fs          = require('fs'),
    // log4js      = require('log4js')(),
    express     = require('express'),
    Schema      = require('mongoose').Schema,
    MemoryStore = require('connect').middleware.session.MemoryStore,
    Monomi      = require('monomi'),
    Controller  = bozuko.require('core/controller'),
    Game        = bozuko.require('core/game');
    

exports.run = function(app){
    
    // initialize the application
    initApplication(app);
    
    // setup our device dependent renderer
    bozuko.require('core/view');
    
    // setup our models
    initModels();
    
    // setup the controllers
    initControllers(app);
    
    // setup the games
    initGames(app);
    
};

function initApplication(app){
    
    /**
     * Setup our Logger
     *
    log4js.addAppender(log4js.fileAppender(bozuko.dir+'/logs/bozuko.log'), 'bozuko' );
    bozuko.logger = log4js.getLogger('bozuko');
    bozuko.logger = console;
     */
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
    var dir = bozuko.dir + '/games';
    fs.readdirSync(dir).forEach( function(file){
        var stat = fs.statSync(dir+'/'+file);
        if( stat.isDirectory() ){
            var name = file.replace(/\..*?$/, '');
            // var Name = name.charAt(0).toUpperCase()+name.slice(1);
            bozuko.games[name] = Game.create(bozuko.dir+'/games/'+file, app);
        }
    });
}