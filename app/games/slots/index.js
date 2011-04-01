var Game = Bozuko.require('core/game');

var Slots = module.exports = function(){
    Game.apply(this,arguments);
    this.config = this.config || {};
    this.icons = this.config.icons || this.default_icons.slice();
};

Slots.prototype.__proto__ = Game.prototype;
var proto = Slots.prototype;

proto.name = "Slots";

proto.default_icons = ['seven','bar','bell','banana','monkey','cherries'];

proto.process = function(outcome){

    var ret = [];
    if( outcome === false ){
        // need random icons
        var icons = this.icons.slice();
        for(var i =0; i<3; i++){
            ret.push( icons.splice( parseInt(Math.random()*icons.length), 1)[0] );
        }
    }

    else {
        var icon = this.icons[outcome];
        ret = [icon,icon,icon];
    }

    return ret;

};