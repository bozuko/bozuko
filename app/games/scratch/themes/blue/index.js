var ScratchTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var BlueTheme = module.exports = function(game){
    ScratchTheme.apply(this, arguments);
};

inherits(BlueTheme, ScratchTheme);

BlueTheme.prototype.name = 'blue';
BlueTheme.prototype.images = {
    'background'    :'background.png'
};

BlueTheme.prototype.base = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/blue/theme';
BlueTheme.prototype.icon = 'https://s3.amazonaws.com/bozuko/public/scratch/themes/blue/icon.png';