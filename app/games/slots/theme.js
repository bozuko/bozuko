
var SlotsTheme = module.exports = function(game){
    this.game = game;
};

SlotsTheme.prototype.getListImage = function(){
    console.log('slotsTheme::getListImage', this.icon);
    return this.icon || this.game.icon;
};

SlotsTheme.prototype.icons = {
    'bell'      :'bell.png',
    'bar'       :'bar.png',
    'cherry'    :'cherry.png',
    'coins'     :'coins.png',
    'dollar'    :'dollar.png',
    'free_spin' :'free_spin.png',
    'doublebar' :'doublebar.png',
    'gold'      :'gold.png',
    'horseshoe' :'horseshoe.png',
    'lemon'     :'lemon.png',
    'raygun'    :'raygun.png',
    'rocket'    :'rocket.png',
    'seven'     :'seven.png',
    'shamrock'  :'shamrock.png',
    'strawberry':'strawberry.png',
    'watermelon':'watermelon.png'
};
SlotsTheme.prototype.base = '';
SlotsTheme.prototype.name = '';