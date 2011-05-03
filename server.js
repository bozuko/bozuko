var cluster         = require('cluster'),
    Bozuko          = require('app/bozuko')
    ;


var proc = cluster( Bozuko.getApp() )
    .set('socket path', Bozuko.dir+'/sockets')
    .in('development')
        .use(cluster.reload())
        .use(cluster.logger('logs', 'debug'))
        .use(cluster.debug())
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( Bozuko.config.server.port+10, '127.0.0.1' ) )
        .listen( Bozuko.config.server.port )
    .in('production')
        .use(cluster.reload())
        .use(cluster.logger('logs', 'info'))
        .use(cluster.pidfiles('pids'))
        .use(cluster.cli())
        .use(cluster.stats())
        .use(cluster.repl( Bozuko.config.server.port+10, '127.0.0.1' ) )
        .listen( Bozuko.config.server.port );
    
if( proc.isMaster ){
    if(Bozuko.env() === 'stats'){
        Bozuko.initStats();
    }
        
    if( Bozuko.env() === 'development' ){
        console.log('intializing development environment');
        Bozuko.require('dev/setup').init();
    }
}