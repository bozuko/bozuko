var Game = Bozuko.require('core/game'),
    burl = Bozuko.require('util/url').create,
    path = require('path');
    inherits = require('util').inherits;

var Slots = module.exports = function(){
    Game.apply(this,arguments);
};
inherits( Slots, Game);

Slots.prototype.name = "Slots";

Slots.prototype.type = path.basename(__dirname);

Slots.prototype.icon = burl('/games/slots/slots_icon.png');

Slots.prototype.process = function(outcome){

    var ret = [];
    
    var icons = this.getConfig().icons;
    
    if( outcome === false ){
        // need random icons
        var icons2 = icons.slice();
        for(var i =0; i<3; i++){
            ret.push( icons2.splice( parseInt(Math.random()*icons2.length), 1)[0] );
        }
    }

    else {
        var icon;
        if( outcome === this.contest.prizes.length ){
            icon = 'free_spin';
        }
        else{
            icon = icons[outcome];
        }
        ret = [icon,icon,icon];
    }

    return ret;

};

Slots.prototype.getTheme = function(){
    
    var theme  = typeof this.config.theme == 'string'
        ? this.config.theme
        : (typeof this.config.theme == 'object'
            ? this.config.theme.name
            : 'default');
    
    var Theme = require('./themes/'+theme);
    return new Theme(this);
}

Slots.prototype.getConfig = function(){
    var theme = this.getTheme();
    return {
        theme: {
            name: theme.name,
            icons: theme.icons,
            base: theme.base
        },
        custom_icons: {},
        icons: Object.keys(theme.icons)
    };
};

Slots.prototype.getListImage = function(){
    console.log('slots::getListImage');
    return this.getTheme().getListImage();
};

Slots.prototype.getImage = function(index){
    var config = this.getConfig();
    var icon = config.icons[index];
    // need to go through the
    if( config.theme.icons[icon] ){
        return config.theme.base+'/'+config.theme.icons[icon];
    }
    // look for a custom icon
    if( config.custom_icons && config.custom_icons[icon] ){
        return config.custom_icons[icon];
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