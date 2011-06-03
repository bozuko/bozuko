
module.exports = function errorHandler() {
    return function(req, res, next) {
        req.on('error', function(err) {
            console.error('Connection error: '+err);
        });
        req.on('close', function(err) {
            console.error('Connection closed for '+req.method+' '+req.url+', from '+
                req.connection.remoteAddress+':'+req.connection.remotePort+
                ', reason = '+err);
        });
        next();
    };
};