var express = require('express'),
    fs = require('fs');

var Game = module.exports = function(contest){
    this.contest = contest;
    this.config = contest.game_config;
};

/**
 * Abstract Game Class
 */
Game.prototype = {
    
    name : null,
    
    process : function( outcome ){
        
    }
    
};