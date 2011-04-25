module.exports = {
    db:{
        name: 'bozuko',
        host: 'localhost'
    },
    facebook: {
        app:{
            id:'166078836756369',
            secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk'
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

    checkin: {
        duration: {
            // 15 minutes between any checkins per user
            user: 1000 * 60 * 15,
            // 4 hours between checkins at the same place
            page: 1000 * 60 * 60 * 4
        }
    },

    search: {
        // radius to search for "Nearby Games" in miles
        nearbyRadius: 2,
        nearbyLimit: 4
    },

    server: {
        auth: false,
        ssl: false,
        host: 'bozuko.com',
        port: 8000
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