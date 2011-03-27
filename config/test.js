var port = 8000 + process.getuid();

module.exports = {
    db:{
        host:'mongodb://localhost/Bozuko.test'+port
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

    server: {
        host: 'bonobo.Bozuko.com',
        port: port
    },

    defaultService:'facebook',

    /**
     * These are basic authenticated users...
     */
    auth: {
        'Bozuko.        :'cracksmack',
        'developer'     :'bluebeard',
        'guest'         :'virgil'
    }
};