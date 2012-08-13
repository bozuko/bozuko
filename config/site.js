module.exports = {

    db:{
        name: 'bozuko_production',
	    host: '192.168.175.161'
    },
	
    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozuko'
        }
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
	
    server: {
        ssl_config:{
            key : Bozuko.dir+'/ssl/bozuko.com/bozuko.com.key',
			ca : Bozuko.dir+'/ssl/bozuko.com/gd_bundle.crt',
			cert: Bozuko.dir+'/ssl/bozuko.com/bozuko.com.crt'
		},
        host: 'bozuko.com'
    }
	
};
