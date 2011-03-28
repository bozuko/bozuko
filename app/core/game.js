var express = require('express'),
    fs = require('fs');

var Game = module.exports = function(config, contest){
    this.config = config;
    this.contest = contest;
};

/**
 * Abstract Game Class
 */
Game.prototype = {
    
    name : null,
    
    process : function( outcome ){
        
    }
    
};