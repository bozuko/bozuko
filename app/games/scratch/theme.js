
var ScratchTheme = module.exports = function(game){
    this.game = game;
};

ScratchTheme.prototype.getListImage = function(){
    return this.icon || this.game.icon;
};

ScratchTheme.prototype.images ={};
ScratchTheme.prototype.base = '';
ScratchTheme.prototype.name = '';