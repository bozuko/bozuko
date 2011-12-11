var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    codify = require('codify')
;

var safe = {w:2, wtimeout: 5000};

var CodePrefix = module.exports = new Schema({
    count          :{type:Number, index: true, default: 1}
}, {safe: safe});

var prefix_size = 3;

// There should be ONLY ONE CodePrefix document
CodePrefix.static('increment', function(callback) {
    return Bozuko.models.CodePrefix.findAndModify(
        {}, [], {$inc: {count: 1}}, {new: true, safe: safe},
        function(err, codePrefix) {
            if (err) return callback(err);
            if (!codePrefix) {
                return Bozuko.models.CodePrefix.create(function(err) {
                    if (err) return callback(err);
                    return callback(null, codify.toCode(1, prefix_size));
                });
            }
            return callback(null, codify.toCode(codePrefix.count, prefix_size));
        }
    );
});

CodePrefix.static('create', function(callback) {
    var cp = new Bozuko.models.CodePrefix({count: 1});
    return cp.save(function(err) {
        if (err) return callback(err);
        return callback();
    });
});
