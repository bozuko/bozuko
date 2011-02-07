var express = require('express'),
    fs = require('fs');

var Game = module.exports = function(dir){
    this.dir = dir;
    this.name = this.dir.split('/').pop();
    this.config = require(dir).config;
};

/**
 * Class Methods
 */
Game.prototype = {
    
    run : function(config){
        return require(this.dir+'/server').run(config);
    },
    
    startServer : function(app){
        app.use('/game/'+this.name, express.staticProvider(this.dir+'/resources'));
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