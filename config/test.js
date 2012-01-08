var port = 8000 + process.getuid();
var braintree = require('braintree');

module.exports = {

    test_mode: true,

    client: {
        mobile:{
            iphone:{
                min_version: '1.0'
            },
            android:{
                min_version: '1.0'
            }
        }
    },

    controllers : {
        except: [
        ]
    },

    admin : {
        winners_list:{
            poll_interval: 1000
        }
    },

    db:{
        name: 'bozuko_test'+port,
        replicaSet: true,
        hosts: ['127.0.0.1:27018', '127.0.0.1:27019'],
        options: {
            server: {poolSize: 25},
            replset: {},
            db: {}
        }
    },

    facebook: {

        app:{
            id:'225077010865990',
            secret:'e6d03c37d46db15dacdfd8690536157f',
            access_token:'225077010865990|9pz_ejdAow5uXxnE1iK3uOGMPe0',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access",
            business:"email,publish_checkins,publish_stream,offline_access,manage_pages"
        }
    },

    foursquare: {
        app:{
            id:'E43N3RJPOS2ULW0KTUSICZRFXB21VJWH55WEXTGMJPOQLL2K',
            secret:'GXYMXF3HPXTNAQSBRJLAZVOGC25SKX4MBKYW0OQ40GW5IGYJ'
        }
    },

    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozuko_dev'
        }
    },

    bozuko :{
        facebook_id: '177515562277757'
    },

    checkin: {
        /**
         * IMPORTANT
         *
         * These are intentially super low for Test Purposes
         */
        duration: {
            // 5 seconds
            user: 1000 * 5,
            // 5 seconds
            page: 1000 * 10
        },
        distance : 400 /* feet */
    },

    entry : {
        token_expiration: 1000 * 60 * 60 * 24 * 1 // one day.
    },

    contest : {
        engine : {
            order: {
                chunk_size: 2
            }
        }
    },

    search: {
        // radius to search for "Nearby Games" in miles
        nearbyRadius: 2,
        nearbyLimit: 4,
        featuredResults: 1,
        featuredRadius: 200
    },

    server: {
        ssl: false,
        auth: false,
        host: 'playground.bozuko.com',
        port: port
    },

    pubsub: {
        enabled: false,
        poll: {
            interval: 500
        },
        cleanup: {
            threshold: 1000 * 60 * 60 * 2,
            interval: 1000 * 60 * 10
        }
    },

    email : {
        smtp:{
            host: "smtp.gmail.com",
            port: 465,
            ssl: true,
            use_authentication: true,
            users: [
                {user: 'mailer@bozuko.com',     pass: '7axxn7d8'},
                {user: 'mailer2@bozuko.com',    pass: '7zscpk94'},
                {user: 'mailer3@bozuko.com',    pass: '43zbbpu9'},
                {user: 'mailer4@bozuko.com',    pass: 'fwdaz3v4'}
            ]
        },
        retry:{
            attempts: 3,
            delay: 1000*60*5 // every 5 minutes
        },
        sender: 'Bozuko Mailer <mailer@bozuko.com>'
    },

    braintree : {
        environment: braintree.Environment.Sandbox,
        merchantId: 'dpvm2srq5sxw662q',
        publicKey: 'yb7fntb8zhjrk28z',
        privateKey: 'd9r3ph7jjvfn47ft'
    },

    defaultService:'facebook',

    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf',

    /**
     * These are basic authenticated users...
     */
    auth: {
        'Bozuko'        :'cracksmack',
        'developer'     :'bluebeard',
        'guest'         :'virgil'
    }
};
