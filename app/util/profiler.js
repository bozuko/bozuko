var profiles = {};

var Profiler = module.exports = function(name){
    this.name = name;
    this.start_time = new Date();
    this.start_memory = process.memoryUsage();
    this.ticks = 0;
};

Profiler.prototype.stop = function() {
    this.end_time = new Date();
    this.end_memory = process.memoryUsage();

    var time_delta = this.end_time - this.start_time;
    var mem_delta = this.end_memory.rss - this.start_memory.rss;

    var profile = profiles[this.name];
    if (!profile) {
        profiles[this.name] = {
            ticks: 1,
            total_time: time_delta,
            max_time: time_delta,
            avg_time: time_delta,
            total_mem_rss: mem_delta,
            max_mem_rss: mem_delta
        };
    } else {
        profile.ticks++;
        profile.total_time += time_delta;
        profile.max_time = time_delta > profile.max_time ? time_delta : profile.max_time;
        profile.avg_time = profile.total_time/profile.ticks;
        profile.total_mem_rss += mem_delta;
        profile.max_mem_rss = mem_delta > profile.max_mem_rss ? mem_delta : profile.max_mem_rss;
    }

    return this;
};

Profiler.deleteProfiles = function() {
    profiles = {};
};

Profiler.getProfileStrings = function(sortProperty) {
    var names = Object.keys(profiles);
    var i = 0;
    var profs = [];
    for (i = 0; i < names.length; i++) {
        var p = profiles[names[i]];
        p.name = names[i];
        profs[i] = p;
    }

    function sort(a, b) {
        return b[sortProperty] - a[sortProperty];
    }

    profs.sort(sort);

    var str = header();
    for (i = 0; i < profs.length; i ++) {
        str += profileString(profs[i]);
    }
    str += footer();
    return str;
};

function profileString(profile) {
    return '<tr><td>'+profile.name+'</td>'+
        '<td>'+profile.ticks+'</td>/'+
        '<td>'+profile.total_time/1000+' s</td>'+
        '<td>'+profile.max_time+' ms</td>'+
        '<td>'+profile.avg_time+' ms</td>'+
        '<td>'+formatBytes(profile.total_mem_rss)+'</td>'+
        '<td>'+formatBytes(profile.max_mem_rss)+'</td></tr>';
};

function header() {
    return '<html><table border="1"><tr><td>name</td><td>ticks</td><td>total time</td>'
           + '<td>max time</td><td>avg time</td><td>total memory (rss)</td>'
           + '<td>max memory (rss)</td></tr>';
};

function footer() {
    return '</table></html>';
};

function formatBytes(bytes) {
  var kb = 1024
    , mb = 1024 * kb
    , gb = 1024 * mb;
  if (bytes < kb) return bytes + ' b';
  if (bytes < mb) return (bytes / kb).toFixed(2) + ' kb';
  if (bytes < gb) return (bytes / mb).toFixed(2) + ' mb';
  return (bytes / gb).toFixed(2) + ' gb';
};

Profiler.prototype.mark = function(message){
    var now = new Date();
    var time = (now.getTime() - this.start_time.getTime())/1000;
    console.log(this.name+': '+ message+': '+time+'s');
};

Profiler.create = function(name){
    return new Profiler(name);
};