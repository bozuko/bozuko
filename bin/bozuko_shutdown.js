var fs = require('fs');
var async = require('async');

var bozuko_dir = process.env.HOME+'/bozuko';

(function run() {
     var user = process.env.USER;
     if (user === 'root') {
         user = process.env.SUDO_USER;
     }
     if (user === 'api' || user === 'playground' || user === 'stats' || user === 'load') {
         shutdown(user);
     } else {
         shutdown('development');
     }
})();

function shutdown(user) {
    var dir = bozuko_dir+'/pids/'+user;
    console.log("pid dir = "+dir);
    fs.readdir(dir, function(err, files) {
        console.log("err = "+err+", files = "+files);
        async.forEach(files, function(file, cb) {
            if (file === '.gitignore') return cb(null);
            var path = dir+'/'+file;
            fs.readFile(path, function(err, pid) {
                if (err) cb(err);
                try {
                    process.kill(pid, 'SIGKILL');
                } catch(e) {
                }
                fs.unlink(path, function(err) {
                    cb(err);
                });
            });
        }, function(err) {
            if (err) throw err;
            console.log("bozuko stopped for "+user+" user");
        });
    });
}