var cluster         = require('cluster')
    Bozuko          = require('./app/bozuko')
    ;

// var cfg = require('./config/'+(process.env.NODE_EVN || 'development'));
var cfg = Bozuko.getConfig();

var proc = cluster( './app' )
    .set('socket path', './sockets')
    
    .in('development')
        .use(cluster.logger('logs', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        //.use(cluster.reload(['app','config','content'], {sig: 'SIGTERM'}))
        .listen( cfg.server.port )
    
    .in('stats')
        .use(cluster.logger('logs', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        .use(cluster.reload(['app','config','content']))
        .listen( cfg.server.port )
        
    .in('production')
        .use(cluster.logger('logs', 'info'))
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        .listen( cfg.server.port )
        
    .in('load')
        .use(cluster.reload())
        .use(cluster.logger('logs', 'info'))
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        .listen( cfg.server.port );


if( proc.isMaster ){
    
    if(Bozuko.env() === 'stats'){
        Bozuko.initStats();
    }

    if( Bozuko.env() === 'development' ){
        // console.log('intializing development environment');
        // Bozuko.require('dev/setup').init();
    }
    
}
