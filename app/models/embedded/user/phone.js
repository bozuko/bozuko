var Schema = require('mongoose').Schema;

var Phone = module.exports = new Schema({
    type:          {type:String},
    unique_id:     {type:String}
});