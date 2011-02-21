var http            = require('http'),
    merge           = require('connect/lib/connect/utils').merge;

/**
 * register our device dependent renderer
 */
var expressRender = http.ServerResponse.prototype.render;
http.ServerResponse.prototype.render = function(view, options, fn, parent){
    
    var global_locals = {
        user            :this.req.session.user||false
    };
    var locals = options.locals || {};
    options.locals = merge(global_locals, locals);
    var device = options.device || this.req.session.device;    
    view = device+'/'+view;
    return expressRender.call( this, view, options, fn, parent );
};

/*
var expressPartial = http.ServerResponse.prototype.partial;

http.ServerResponse.prototype.partial = function(){
    console.log(arguments[0]);
    var ret = expressPartial.apply(this,arguments);
    console.log(ret);
    return ret;
};
*/