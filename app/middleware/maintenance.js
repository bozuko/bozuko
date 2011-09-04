module.exports = function() {
    return function(req, res, next) {
        if (Bozuko.config.maintenance_mode) {
            return Bozuko.error('maintenance/generic').send(res);
        }
        return next();
    };
};