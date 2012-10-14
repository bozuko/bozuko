module.exports = {

    test_mode: false,

    controllers: {
        except: [
        ]
    },

    db:{
        name: 'bozuko_production',
	    host: 'localhost'
    },

    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozuko'
        }
    },
	
    server: {
        ssl_config:{
            key : Bozuko.dir+'/ssl/bozuko.com/bozuko.com.key',
			ca : Bozuko.dir+'/ssl/bozuko.com/gd_bundle.crt',
			cert: Bozuko.dir+'/ssl/bozuko.com/bozuko.com.crt'
		},
        host: 'api.bozuko.com'
    },

    defaultService:'facebook',

    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf'
};
