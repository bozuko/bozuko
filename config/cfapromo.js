var DateUtil = require('../app/util/date');

module.exports = {

    db:{
        name: 'bozuko_cfa',
        host: '127.0.0.1'
    },

    facebook: {
        app:{
            //id:'166078836756369',
            //secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            //access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk',
            //pubsub_verify:'12kg0a8b9123kab91831laa9sb'
            
            id:'376278735739867',
            secret:'23599283df810997379547c93dd8bc4e',
            access_token:'376278735739867|8VmoS3bNGqPh_5lSKgP4qShtz8A',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
            web:"email,publish_stream,user_likes",
            business:"email,manage_pages,offline_access"
        }
    },
    
    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozukodev'
        }
    },

    checkin: {
        
        duration: {
            // 15 minutes between any checkins per user
            user: DateUtil.SECOND * 30,
            // 4 hours between checkins at the same place
            page: DateUtil.SECOND * 10
        },
        
        travel : {
            speed: 60, /* mph */
            reset: DateUtil.HOUR * 10
        },
        
        distance : 1000 /* feet */
    },

    server: {
        host: 'cfa.bozuko.com'
    },
    
    email : {
        sender: 'CFA Promo <mailer@bozuko.com>'
    },
    
    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf'
};
