var port = 6000 + process.getuid()+2;

module.exports = {
    db:{
        host:'mongodb://localhost/bozuko_test'+port
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
        host: 'bozuko.com',
        port: port
    }
};