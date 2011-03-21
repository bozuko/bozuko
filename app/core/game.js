var bozuko = require('bozuko'),
    express = require('express'),
    fs = require('fs');

var Game = module.exports = function(dir){
    this.dir = dir;
    this.name = this.dir.split('/').pop();
    this.config = require(dir).config;
    //this.options = require(dir+'/options');
};

/**
 * Abstract Game Class
 */
Game.prototype = {
    
    name : null,
    
    options : {},
    
    startServer : function(app){
        app.use('/game/'+this.name, express.static(this.dir+'/resources'));
    },
    
    /**
     * 
     */
    process : function( contest, tokens ){
        
    }
    
};

/**
 * Static Methods
 */
Game.create = function(path, app){
    var game = new Game(path);
    game.startServer(app);
    return game;
};