var bozuko = require('bozuko'),
    express = require('express'),
    Game = bozuko.require('core/game'),
    fs = require('fs');
    
    
var Slots = module.exports = function(){
    Game.prototype.apply(this,arguments);
    this.icons = this.config.icons || this.default_icons.splice();
};

Slots.prototype.__proto__ = Game;
var proto = Slots.prototype;

proto.name = "Slots";

proto.default_icons = ['seven','bar','bell','banana','monkey','cherries'];

proto.process = function(outcome){
    
    var ret = [];
    if( !outcome ){
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