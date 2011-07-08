var express = require('express'),
    fs = require('fs');

var Game = module.exports = function(contest){
    this.contest = contest;
    this.prizes = contest.prizes.slice();
    this.prizes.sort(function(a,b){return b.value-a.value});
    this.config = contest.game_config;
};

/**
 * Abstract Game Class
 */
Game.prototype = {
    
    name : "Game",
    
    theme: 'default',
    
    process : function( outcome ){
        
    },
    
    getPrizes : function(){
        return this.prizes;
    },
    
    getConfig : function(){
        return this.config;
    },
    
    getListImage: function(){
        return this.icon;
    },
    
    getType : function(){
        return this.type;
    },
    
    getName : function(){
        return this.config && this.config.name ? this.config.name : this.name;
    }
    
};
