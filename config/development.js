var port = 6999 + process.getuid();

// Reserve the docs port for our contractors.
if (process.env.USER === 'docs') port = 7002;

module.exports = {

    db:{
        name: 'bozuko_dev'+port,
        host: 'localhost'
    },

    facebook: {
        app:{
            id:'215589698455936',
            secret:'659158dbd9a51f02bb9fffcf39804434',
            access_token:'215589698455936|Ino_wd7UTm9e9Tpr34LzNM_-Zl8',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
            business:"email,manage_pages"
        }
    },

    foursquare: {
        app:{
            id:'E43N3RJPOS2ULW0KTUSICZRFXB21VJWH55WEXTGMJPOQLL2K',
            secret:'GXYMXF3HPXTNAQSBRJLAZVOGC25SKX4MBKYW0OQ40GW5IGYJ'
        }
    },

    checkin: {
        duration: {
            // 15 minutes between any checkins per user
            user: 1000 * 60 * 15,
            // 4 hours between checkins at the same place
            page: 1000 * 60 * 60 * 4
        }
    },
    
    entry : {
        token_expiration: 1000 * 60 * 60 * 24 * 1 // one day.
    },
    
    search: {
        // radius to search for "Nearby Games" in miles
        nearbyRadius: 2,
        nearbyLimit: 4
    },

    server: {
        auth: false,
        ssl: true,
        host: 'bonobo.bozuko.com',
        port: port
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
