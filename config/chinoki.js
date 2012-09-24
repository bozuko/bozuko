
var DateUtil = require('../app/util/date');

module.exports = {

    
    db:{
        name: 'bozuko_chinoki',
        host: '127.0.0.1'
    },

    facebook: {
        app:{
            //id:'166078836756369',
            //secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            //access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk',
            //pubsub_verify:'12kg0a8b9123kab91831laa9sb'
            
            id:'447323665299320',
            secret:'c67ce34abd0ff66e4e22b4249fc5e8a1',
            access_token:'447323665299320|RnovJUX24ngBsygcVR54gwDYnuE',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
            web:"email,publish_stream,user_likes,publish_checkins",
            business:"email,manage_pages,offline_access"
        }
    },

    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'chinoki'
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

        distance : 5000 /* feet */
    },

    server: {
        enable_redirect: true,
        host: 'chinoki.bozuko.com'
    },

    pubsub: {
        poll: {
            interval: 2000
        },
        cleanup: {
            threshold: 1000 * 60 * 60 * 2,
            interval: 1000 * 60 * 10
        }
    },

    email : {
        smtp:{
            host: "email-smtp.us-east-1.amazonaws.com",
            port: 465,
            ssl: true,
            use_authentication: true,
            users: [
                {user: 'AKIAJBO4JDTBEHQM2M2Q',     pass: 'AtTBtmkjqvWOsNaTEmAex3N2Fj8X8mntA9aXkc7Xd6iw'}
            ]
        },
        retry:{
            attempts: 3,
            delay: 1000*60*1 // every minute
        },
        sender: 'Chinoki <mailer@bozuko.com>'
    },

    braintree : {
        environment: braintree.Environment.Sandbox,
        merchantId: 'dpvm2srq5sxw662q',
        publicKey: 'yb7fntb8zhjrk28z',
        privateKey: 'd9r3ph7jjvfn47ft'
    },

    defaultService:'facebook',

    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf',

    blog: {
        feed:'http://blog.bozuko.com/feed/'
    }
};
