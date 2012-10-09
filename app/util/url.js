
module.exports = {
    create: function(path){
        
        path = !path ? '' : (path[0]!='/'?'/'+path:path);
        
        var port = !~[443,80].indexOf(Number(Bozuko.config.server.port)) ?
            (':'+Bozuko.config.server.port) :
            '';
        
        var parts = [
            Bozuko.config.server.ssl?'https:':'http:',
            '//',
            Bozuko.config.server.host,
            port,
            path
        ];
        return parts.join('');
    }
};