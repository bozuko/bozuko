var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var CougarTheme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
};

inherits(CougarTheme, ScratchTheme);

CougarTheme.prototype.name = 'kccougars';
CougarTheme.prototype.images = {
    'background'    :'background.png'
};

CougarTheme.prototype.base = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/MILB/KaneCountyCougars/theme';
CougarTheme.prototype.icon = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/MILB/KaneCountyCougars/icon.png';