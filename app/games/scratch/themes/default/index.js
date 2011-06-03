var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var DefaultTheme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
};

inherits(DefaultTheme, ScratchTheme);

DefaultTheme.prototype.name = 'default';
DefaultTheme.prototype.images = {
    'background'    :'background.png?v2'
};

DefaultTheme.prototype.base = burl('/games/scratch/themes/'+path.basename(__dirname)+'/default_theme' );
DefaultTheme.prototype.icon = burl('/games/scratch/themes/'+path.basename(__dirname)+'/scratch.png' );