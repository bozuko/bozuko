module.exports = {

    test_mode: false,

    controllers: {
        except: [
            'site',
            'business',
			'beta',
			'admin'
        ]
    },

    db:{
        name: 'bozuko_production',
	    host: 'db2'
    },

    amazon : {
        s3:{
            key:'AKIAJD7BVQJST2HCCPGA',
            secret: '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',
            bucket: 'bozuko'
        }
    },
	
    server: {
        host: 'api.bozuko.com'
    },

    defaultService:'facebook',

    key: '7ndfde983xg&*4dp11Lcdcrn111+@adf'
};
