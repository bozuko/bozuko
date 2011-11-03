var testsuite = require('./config/testsuite');
var Oid = require('mongoose').Types.ObjectId;
var Prize = require('../prize');

// Mock User
var user = {};

// Mock Page
var page = {
    name: 'Jimmy\'s Hats'
};

var prize = new Bozuko.models.Prize({
    page_id: new Oid(),
    code: 'ABCDE',
    timestamp: new Date(),
    name: 'Fedora'
});

prize.page = page;

var img_base = Bozuko.dir+'/app/models/test/images';

exports['createPrizeScreenPdf'] = function(test) {
    var images = {
        user: {
            path: img_base+'/user_image.jpg'
        },
        business: {
            path: img_base+'/business_image.png'
        },
        security: {
            path: img_base+'/security_image.png'
        }
    };
    prize.createPrizeScreenPdf(user, images);
    test.done();
};

