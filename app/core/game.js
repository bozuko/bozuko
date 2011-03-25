var bozuko = require('bozuko'),
    express = require('express'),
    fs = require('fs');

var Game = module.exports = function(config){
    this.config = config;
};

/**
 * Abstract Game Class
 */
Game.prototype = {
    
    name : null,
    
    process : function( outcome ){
        
    }
    
};