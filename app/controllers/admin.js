var facebook    = Bozuko.require('util/facebook'),
    http        = Bozuko.require('util/http'),
    Page        = Bozuko.require('util/page'),
    qs          = require('querystring'),
    url         = require('url'),
    spawn       = require('child_process').spawn,
    sys         = require('sys')
;

exports.access = 'admin';

exports.routes = {
    
    '/admin' : {
        
        get : {
            
            title: 'Bozuko Administration',
            locals:{
                layout: false
            },
            
            handler: function(req,res){
                res.render('admin/index');
            }
        }
    },
    
    '/admin/pages' : {
        
        get : {
            handler : function(req, res){
                // need to get all pages
                return Bozuko.models.Page.find({},{},{sort:{name:1}}, function(error, pages){
                    if( error ) return error.send(res);
                    return res.send({items:pages});
                });
            }
        }
    },
    
    'admin/pages/:id' : {
        
        /* update */
        put : {
            handler : function(req,res){
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error ) return error.send( res );
                    // else, lets bind the reqest to the page
                    page.set( req.body );
                    return page.save( function(error){
                        if( error ) return error.send(res);
                        return res.send( {items: [page]} );
                    });
                })
            }
        }
    }
};