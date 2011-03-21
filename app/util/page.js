var merge = require('connect').utils.merge;

var Page = module.exports = function(title, template, options){
    options = options || {};
    var locals = merge({title:title}, options.locals || {});
    
    return {
        description : options.description || title,
        get : function(req,res){
            res.render(template,locals);
        }
    };
};