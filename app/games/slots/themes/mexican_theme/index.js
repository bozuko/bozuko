var SlotsTheme = require('./../../theme'),
    burl = Bozuko.require('util/url').create,
    path = require('path'),
    inherits = require('util').inherits;

var MexicanTheme = module.exports = function(game){
    SlotsTheme.apply(this, arguments);
};

inherits(MexicanTheme, SlotsTheme);

MexicanTheme.prototype.icons = {
    'margarita'     :'margarita.png',
    'mask'          :'mask.png',
    'cactus'        :'cactus.png',
    'chilipepper'   :'chilipepper.png',
    'hat'           :'hat.png',
    'burrito'       :'burrito.png',
    'nachos'        :'nachos.png',
    'sculpture'     :'sculpture.png',
    'shakers'       :'shakers.png',
    //'skull'         :'skull.png',
    'temple'        :'temple.png',
    'tequila'       :'tequila.png',
    'free_spin'     :'free_spin.png'
};

MexicanTheme.prototype.name = path.basename(__dirname);

MexicanTheme.prototype.base = burl('/games/slots/themes/'+path.basename(__dirname)+'/icons' );

// this is clearly here. why won't it show up in fuzz?
MexicanTheme.prototype.icon = burl('/games/slots/themes/'+path.basename(__dirname)+'/icons/margarita.png' );