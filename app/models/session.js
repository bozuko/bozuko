var Schema = require('mongoose').Schema;

var Session = module.exports = new Schema({
    sid                     :{type:String, index:true},
    lastAccess              :{type:Date},
    data                    :{}
});