
var SlotsTheme = module.exports = function(game){
    this.game = game;
};

SlotsTheme.prototype.getListImage = function(){
    return this.icon || this.game.icon;
};

SlotsTheme.prototype.icons = {
    'dollar'    :'dollar.png',
    'coins'     :'coins.png',
    'cherry'    :'cherry.png',
    'bar'       :'bar.png',
    'raygun'    :'raygun.png',
    'rocket'    :'rocket.png',
    'bell'      :'bell.png',
    'doublebar' :'doublebar.png',
    'gold'      :'gold.png',
    'horseshoe' :'horseshoe.png',
    'lemon'     :'lemon.png',
    'seven'     :'seven.png',
    'shamrock'  :'shamrock.png',
    'strawberry':'strawberry.png',
    'watermelon':'watermelon.png',
    'free_spin' :'free_spin.png',
};
SlotsTheme.prototype.base = '';
SlotsTheme.prototype.name = '';