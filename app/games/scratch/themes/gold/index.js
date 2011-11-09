var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var GoldTheme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
};

inherits(GoldTheme, ScratchTheme);

GoldTheme.prototype.name = 'gold';
GoldTheme.prototype.images = {
    'background'    :'background.png'
};

GoldTheme.prototype.base = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/gold/theme';
GoldTheme.prototype.icon = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/gold/icon.png';