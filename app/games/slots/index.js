var Game = Bozuko.require('core/game'),
    burl = Bozuko.require('util/url').create;

var Slots = module.exports = function(){
    Game.apply(this,arguments);
    this.config = this.config || {};
    this.icons = this.config.icons || this.default_icons.slice();
};

Slots.prototype.__proto__ = Game.prototype;

Slots.prototype.name = "Slots";

Slots.prototype.icon = burl('/games/slots/slots_icon.png');

Slots.prototype.default_icons = ['seven','bar','bell','banana','monkey','cherries'];

Slots.prototype.process = function(outcome){

    var ret = [];
    
    if( outcome === false ){
        // need random icons
        var icons = this.icons.slice();
        for(var i =0; i<3; i++){
            ret.push( icons.splice( parseInt(Math.random()*icons.length), 1)[0] );
        }
    }

    else {
        var icon;
        if( outcome === this.contest.prizes.length ){
            icon = 'free_spin';
        }
        else{
            icon = this.icons[outcome];
        }
        ret = [icon,icon,icon];
    }

    return ret;

};

Slots.prototype.getConfig = function(){
    var theme = this.getTheme();

    return {
        theme: theme,
        icons: this.icons
    };
};

Slots.prototype.getImage = function(index){
    var icon = this.icons[index];
    // need to go through the
    if( !this.config || !this.config.theme ){
        return icon;
    }
    if( this.config.theme.icons[icon] ){
        return this.config.theme.base+'/'+this.config.theme.icons[icon];
    }
    // look for a custom icon
    if( this.config.custom_icons && this.config.custom_icons[icon] ){
        return this.config.custom_icons[icon];
    }
    return icon;
};

Slots.prototype.getPrizes = function(){
    var self = this;
    self.contest.prizes.forEach( function(prize, i){
        prize.result_image = self.getImage(i);
        // need to 
    });
    return self.contest.prizes;
};