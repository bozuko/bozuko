var braintree = require('braintree');

module.exports = {

    controllers: {
        except: [
            'business'
        ]
    },

    admin : {
        winners_list:{
            poll_interval: 1000
        },
		allowed_domains: [
			'bozuko.com',
			'fuzzproductions.com'
		]
    },

    db:{
        name: 'bozuko_playground'
    },

    facebook: {
		/*
        app:{
            id:'225077010865990',
            secret:'e6d03c37d46db15dacdfd8690536157f',
            access_token:'225077010865990|9pz_ejdAow5uXxnE1iK3uOGMPe0',
            pubsub_verify:'12kg0a8b9123kab91831laa9sb'
        },
        perms:{
            user:"email,publish_checkins,publish_stream,offline_access,user_likes",
			web:"email,publish_stream,user_likes",
            business:"email,manage_pages,offline_access"
        }
		*/
		app:{
            id:'166078836756369',
            secret:'df03acad0cda5e6f2ec2161c00cf5bf3',
            access_token:'166078836756369|5PhifMaZ8cZzgdlY4ZhfFPvGtOk',
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
            bucket: 'bozukopg'
        }
    },
	
    checkin: {
        duration: {
            // 15 minutes between any checkins per user
            user: 1000 * 5,
            // 4 hours between checkins at the same place
            page: 1000 * 6
        },

		distance: 5280
    },
	
    server: {
        host: 'playground.bozuko.com'
    }
};
