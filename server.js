var cluster         = require('cluster');
Bozuko          = require('./app/bozuko');

// var cfg = require('./config/'+(process.env.NODE_EVN || 'development'));
var cfg = Bozuko.getConfig();

var proc = cluster( './app' )
    .set('socket path', './sockets')

    .in('development')
        .use(cluster.logger('logs/development', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids/development'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        //.use(cluster.reload(['app','config','content'], {sig: 'SIGTERM'}))
        .listen( cfg.server.port )
        
    .in('fuzz')
        .use(cluster.logger('logs/fuzz', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids/fuzz'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        //.use(cluster.reload(['app','config','content'], {sig: 'SIGTERM'}))
        .listen( cfg.server.port )

    .in('stats')
        .use(cluster.logger('logs/stats', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids/stats'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        .use(cluster.reload(['app','config','content']))
        .listen( cfg.server.port )

    .in('production')
        .use(cluster.logger('logs/production', 'info'))
        .use(cluster.pidfiles('pids/production'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( cfg.server.port+10, '127.0.0.1' ) )
        .listen( cfg.server.port )
    
    .in('playground')
        .use(cluster.logger('logs/playground', 'info'))
        .use(cluster.pidfiles('pids/playground'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( '8069', '127.0.0.1' ) )
        .listen( cfg.server.port )

    .in('load')
        .use(cluster.reload())
        .use(cluster.logger('logs/load', 'info'))
        .use(cluster.pidfiles('pids/load'))
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
