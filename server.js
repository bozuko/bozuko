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
    .set( 'socket path', './sockets/'+env )
    .use( cluster.logger('logs/'+env, cfg.logLevel || 'debug') )
    .use( cluster.pidfiles('pids/'+env) )
    .use( cluster.cli() )
    .use( cluster.stats() )
    .use( cluster.repl(cfg.server.port+10, '127.0.0.1') )
    .listen( cfg.server.port )
    ;


if( proc.isMaster ){

    if( env === 'stats'){
        Bozuko.initStats();
    }

    if( env === 'development' ){
        // console.log('intializing development environment');
        // Bozuko.require('dev/setup').init();
    }

}