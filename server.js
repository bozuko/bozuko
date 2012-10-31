var cluster         = require('cluster'),
    fs              = require('fs'),
    path            = require('path')
    ;

Bozuko          = require('./app/bozuko');

// var cfg = require('./config/'+(process.env.NODE_EVN || 'development'));
var cfg = Bozuko.getConfig(), env = Bozuko.env();
// create any neccessary directories
var dirs = {
    'logs':'*.log',
    'pids':'*.pid',
    'sockets':'*.sock'
};

Object.keys(dirs).forEach( function(name){
    var dir = __dirname+'/'+name+'/'+env;
    if( path.existsSync(dir) ) return;
    fs.mkdirSync( dir, 0755 );
    fs.writeFileSync(dir+'/.gitignore', dirs[name], 'utf8');
});

var proc = cluster( './app' )
    .set( 'worker title', env+' {n}')
    .set( 'socket path', './sockets/'+env )
    .use( cluster.logger('logs/'+env, cfg.logLevel || 'debug') )
    .use( cluster.pidfiles('pids/'+env) )
    .use( cluster.cli() )
    .use( cluster.stats() )
    .use( cluster.repl(cfg.server.port+10, '127.0.0.1') )
    .listen( cfg.server.port )
    ;

if( proc.isMaster ){

    Bozuko.isMaster = true;
    // Bozuko.pubsub.stop();

    if( env === 'stats'){
        Bozuko.initStats();
    }
    // need a better way to handle this
    if( env === 'api' ){
        // Bozuko.initFacebookPubSub();
    }
    Bozuko.initHttpRedirect();
    if ( env === 'api' || env === 'playground' || env === 'development' ) {
        Bozuko.initAutoRenew();
        Bozuko.initExpirationChecker();
    }
}

// only run stats engine on one child process
setTimeout(function(){
    console.log('Process Startup: '+process.title);
    if( process.title.match(/0/) ){
        Bozuko.require('core/stats').run();
    }
}, 100);
