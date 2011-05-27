var SlotsTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var DefaultTheme = module.exports = function(game){
    SlotsTheme.apply(this, arguments);
};

inherits(DefaultTheme, SlotsTheme);

DefaultTheme.prototype.name = path.basename(__dirname);

DefaultTheme.prototype.base = burl('/games/slots/themes/'+path.basename(__dirname)+'/default_theme' );

// this is clearly here. why won't it show up in fuzz?
DefaultTheme.prototype.icon = burl('/games/slots/themes/'+path.basename(__dirname)+'/slots.png' );