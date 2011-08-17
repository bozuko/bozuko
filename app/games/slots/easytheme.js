var SlotsTheme = require('./theme'),
    path = require('path'),
    burl = Bozuko.require('util/url').create,
    fs = require('fs'),
    inherits = require('util').inherits
    ;

var EasyTheme = module.exports = {
    create : function(options){
        
        if( !options.dirname ){
            throw new Error('No dirname specified for EasyTheme (slots)');
        }
        
        var dirname = options.dirname,
            name = path.basename(dirname),
            icons = {},
            iconsDir = options.iconsDir || 'icons';
        
        var Theme = function(){
            SlotsTheme.apply(this, arguments);
        };
        
        inherits(Theme, SlotsTheme);
        
        Theme.prototype.name = name;
        Theme.prototype.base = burl('/games/slots/themes/'+name+'/'+iconsDir);
        
        // okay, lets grab the icons...
        var iconsPath = dirname+'/resources/'+iconsDir;
        fs.readdirSync( iconsPath ).forEach(function(filename){
            // only include png files
            var matches;
            if( !(matches = filename.match(/(.+)\.png$/)) ) return;
            icons[matches[1]] = filename;
        });
        
        // anything specific that should be the first properties in the array?
        if( options.order ){
            var ordered = {};
            options.order.forEach(function(icon){
                if( icons[icon] ){
                    ordered[icon] = icons[icon];
                    delete icons[icon];
                }
            });
            var i;
            for( i in icons ){
                if( icons.hasOwnProperty(i) ) ordered[i] = icons[i];
            }
            icons = ordered;
        }
        Theme.prototype.icons = icons;
        return Theme;
    }
};