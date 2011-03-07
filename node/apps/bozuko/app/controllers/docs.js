var bozuko = require('bozuko');

exports.routes = {

    '/docs/?': {
        
        description : 'Documentation Output',
        
        get : function(req,res){
            res.render('docs/index', {bozuko:bozuko});
        }
        
    }
};