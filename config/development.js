
var DateUtil = require('../app/util/date');
var braintree = require('braintree');

var port = 6999 + process.getuid();

// Reserve the docs port for our contractors.
if (process.env.USER === 'docs') port = 7002;

module.exports = {

    test_mode: false,
    
    db:{
        name: 'bozuko_dev'+port,
        host: '127.0.0.1'
    },

    facebook: {
        app:{
            //id:'166078836756369',
            //secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            //access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk',
            //pubsub_verify:'12kg0a8b9123kab91831laa9sb'
            
            id:'225077010865990',
            secret:'e6d03c37d46db15dacdfd8690536157f',
            access_token:'225077010865990|9pz_ejdAow5uXxnE1iK3uOGMPe0',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        }
    },
    
    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozukodev'
        }
    },
    
    server: {
        host: 'playground.bozuko.com',
        port: port
    },
    
    blog: {
        feed:'http://blog.bozuko.com/feed/'
    }
};
