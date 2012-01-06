module.exports = {

    test_mode: false,

    controllers: {
        only: [
            'beta',
            'admin',
			'bozuko',
            'mycroft'
        ]
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
        name: 'bozuko_production',
        replicaSet: true,
        hosts: ['192.168.175.159', '192.168.175.161'],
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
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
            business:"email,manage_pages,offline_access"
        }
    },

    bozuko :{
        facebook_id: '223851717629478'
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
            bucket: 'bozuko'
        }
    },
	
	mailchimp : {
        // mark's dev
        /* client_id: '881062973290',
        client_secret: 'b0514f25bc9fb67c9e9b38e825fd0528'*/
        
		// production
        client_id: '698686499893',
        client_secret: '6f818ad58ebd5f783772e4ffeee36178'
		/*
		// playground
		client_id: '376554353069',
		client_secret: 'd4eb929905f0cd51b8dfb31d9c257d21'
		*/
    },
    
    constant_contact : {
        /* mark's dev
        client_id: 'e3ddf0de-b876-4493-a0b6-b0eb2daea0de',
        client_secret: '0173052058004408bda0b6089a8acc00'*/
        
        // production
        client_id: '4834f665-2168-4508-a1f8-1de2f51f506a',
        client_secret: '6736a9a76cd742bca2927572a3a38fd3'
    },

    checkin: {
        duration: {
            // 15 minutes between any checkins per user
            user: 1000 * 60 * 15,
            // 4 hours between checkins at the same place
            page: 1000 * 60 * 60 * 4
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
        nearbyLimit: 10,
        featuredResults: 1,
        featuredRadius: 200
    },

    server: {
        auth: false,
        ssl: true,
		ssl_config:{
            key : '/ssl/wildcard/wildcard.bozuko.com.key',
			ca : '/ssl/wildcard/gd_bundle.crt',
			cert: '/ssl/wildcard/bozuko.com.crt'
		},
        host: 'dashboard.bozuko.com',
        port: 443
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

    defaultService:'facebook',

    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf',

    /**
     * These are basic authenticated users...
     */
    auth: {
        'bozuko'        :'cracksmack',
        'developer'     :'bluebeard',
        'guest'         :'virgil'
    }
};
