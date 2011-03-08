var port = 6000 + process.getuid();

module.exports = {
    db:{
        host:'mongodb://localhost/bozuko'
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
    server: {
        host: 'bonobo.bozuko.com',
        port: port
    },
    
    /**
     * These are basic authenticated users...
     */
    auth: {
        'bozuko'        :'cracksmack',
        'developer'     :'bluebeard',
        'guest'         :'virgil'
    }
};
