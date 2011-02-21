/**
 * Module dependencies.
 */
var fs          = require('fs'),
    // log4js      = require('log4js')(),
    express     = require('express'),
    Schema      = require('mongoose').Schema,
    MemoryStore = require('connect/lib/connect/middleware/session/memory'),
    Monomi      = require('monomi'),
    Controller  = Bozuko.require('controller'),
    Game        = Bozuko.require('game');

exports.run = function(app){
    
    // initialize the application
    initApplication(app);
    
    // setup our device dependent renderer
    Bozuko.require('view');
    
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
    log4js.addAppender(log4js.fileAppender(Bozuko.dir+'/logs/bozuko.log'), 'bozuko' );
    Bozuko.logger = log4js.getLogger('bozuko');
    Bozuko.logger = console;
     */
    app.set('view engine', 'jade');
    app.set('views', __dirname + '/views');
    
    
    app.use(express.bodyDecoder());
    app.use(express.methodOverride());
    app.use(express.cookieDecoder());
    app.use(express.session({ store: new MemoryStore({ reapInterval: -1 }), secret: 'chqsmells' }));
    
    app.use(Monomi.detectBrowserType());
    app.use(Bozuko.require('middleware/device')());
    app.use(Bozuko.require('middleware/session')());
    
    app.use(express.logger({ format: ':date [:remote-addr] :method :url :response-time' }));
    app.use(express.compiler({ src: __dirname + '/../static', enable: ['less'] }));
    app.use(app.router);
    app.use(express.repl('bozuko>', 8050));
    app.use(express.staticProvider({root:__dirname + '/../static',maxAge:(1000*60*60*24)*1}));
    
}

function initModels(){
    Bozuko.models = {};
    fs.readdirSync(__dirname + '/models').forEach(function(file){
        // get the name
        var name = file.replace(/\..*?$/, '');
        var Name = name.charAt(0).toUpperCase()+name.slice(1);
        
        // create the model
        var schema =  require('./models/'+name);
        
        Bozuko.db.model( Name, schema );
        //Mongoose.Model.define(Name, config);
        Bozuko.models[Name] = Bozuko.db.model(Name);
    });
}

function initControllers(app){
    Bozuko.controllers = {};
    fs.readdirSync(__dirname + '/controllers').forEach( function(file){
        
        var name = file.replace(/\..*?$/, '');
        var Name = name.charAt(0).toUpperCase()+name.slice(1);
        Bozuko.controllers[Name] = Controller.create(app,name,Bozuko.require('controllers/'+name).routes);
    });
}

function initGames(app){
    Bozuko.games = {};
    var dir = Bozuko.dir + '/games';
    fs.readdirSync(dir).forEach( function(file){
        var stat = fs.statSync(dir+'/'+file);
        if( stat.isDirectory() ){
            var name = file.replace(/\..*?$/, '');
            // var Name = name.charAt(0).toUpperCase()+name.slice(1);
            Bozuko.games[name] = Game.create(Bozuko.dir+'/games/'+file, app);
        }
    });
}