

var Profiler = module.exports = function(name){
    this.name = name;
    this.start = new Date();
    this.memory = process.memoryUsage();
};

Profiler.prototype.mark = function(message){
    var now = new Date();
    var time = (now.getTime() - this.start.getTime())/1000;
    console.log(this.name, message, time+'s');
};

Profiler.create = function(name){
    return new Profiler(name);
};