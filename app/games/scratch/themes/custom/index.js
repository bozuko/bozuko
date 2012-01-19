var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var Theme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
    
    var custom_background = this.game.config.custom_background;
    
    this.base = path.dirname( custom_background);
    this.images = {
        background: path.basename( custom_background )
    };
    
    if( this.game.config.custom_icon ) this.icon = this.game.config.custom_icon;
};

inherits(Theme, ScratchTheme);
Theme.prototype.icon = burl('/images/icons/custom-game-icon.png');
Theme.prototype.name = path.basename(__dirname);
