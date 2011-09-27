var DateUtil = require('../app/util/date');
var braintree = require('braintree');

var port = 6999 + process.getuid();

// Reserve the docs port for our contractors.
if (process.env.USER === 'docs') port = 7002;

module.exports = {

    test_mode: false,

    controllers: {
        except: [
        ]
    },
	
	user : {
		block: {
			min_friends: 4
		}
	},

    client: {
        mobile:{
            iphone:{
                link: 'http://itunes.com/app/bozuko',
                app_link: 'http://itunes.com/app/bozuko',
                min_version: '1.0'
            },
            android:{
                link: 'https://market.android.com/details?id=com.bozuko.bozuko',
                app_link: 'market://details?id=com.bozuko.bozuko',
                min_version: '1.0'
            }
        }
    },

    admin : {
        winners_list:{
            poll_interval: 1000
        }
    },

    db:{
        name: 'bozuko_dev'+port,
        replicaSet: true,
        hosts: ['pgdb1', 'pgdb2'],
        options: {
            server: {poolSize: 25},
            replset: {},
            db: {}
        }
    },

    facebook: {
        app:{
            id:'166078836756369',
            secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
            
            //id:'225077010865990',
            //secret:'e6d03c37d46db15dacdfd8690536157f',
            //access_token:'225077010865990|9pz_ejdAow5uXxnE1iK3uOGMPe0',
            //pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
            business:"email,manage_pages"
        }
    },

    bozuko :{
        facebook_id: '177515562277757'
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
        nearbyLimit: 10,
        featuredResults: 2
    },

    server: {
        auth: false,
        ssl: true,
		ssl_config:{
			key : '/ssl/wildcard/wildcard.bozuko.com.key',
			ca : '/ssl/wildcard/gd_bundle.crt',
			cert: '/ssl/wildcard/bozuko.com.crt'
		},
        host: 'playground.bozuko.com',
        port: port
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
            host: "smtp.gmail.com",
            port: 465,
            ssl: true,
            use_authentication: true,
            user: "mailer@bozuko.com",
            pass: "7axxn7d8"
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
        'bozuko'        :'cracksmack',
        'developer'     :'bluebeard',
        'guest'         :'virgil'
    },

    admins: [
        'mark.fabrizio@bozuko.com',
        'andrew.stone@bozuko.com',
        'jacob.epstein@bozuko.com',
        'pinbo.tsai@bozuko.com'
    ]
};
