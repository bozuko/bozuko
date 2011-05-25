var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var Theme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
};

inherits(Theme, ScratchTheme);

Theme.prototype.name = path.basename(__dirname);
Theme.prototype.images = {
    'background'    :'background.png'
};

Theme.prototype.base = burl('/games/slots/themes/'+path.basename(__dirname)+'/rock_theme' );
