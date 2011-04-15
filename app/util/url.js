
module.exports = {
    create: function(path){
        
        path = !path ? '' : (path[0]!='/'?'/'+path:path);
        var parts = [
            Bozuko.config.server.ssl?'https:':'http:',
            '//',
            Bozuko.config.server.host,
            ':',
            Bozuko.config.server.port,
            path
        ];
        return parts.join('');
    }
};