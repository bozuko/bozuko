var Bozuko = require('../../app/bozuko');

exports['30 mails'] = function(test){
    var mailer = Bozuko.require('util/mail'),
        total = 30,
        finished = 0;
    for( var i=0; i<total; i++){
        mailer.send({
            to: 'mark.fabrizio@gmail.com',
            subject: 'Bozuko Mail Test '+i,
            body: 'Just a test - do not freak'
        }, function(){
            if( ++finished === total ){
                test.done();
            }
        })
    }
};