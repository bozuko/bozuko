var bozuko = require('bozuko');

exports.routes = {

    '/contest/:id': {
        
        description : 'Get information about a contest',
        
        get : function(req,res){
            res.send({success:true});
        }
        
    }
};