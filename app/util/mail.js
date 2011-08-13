var nm = require('nodemailer');

nm.SMTP = Bozuko.config.email.smtp;

var EmailMessage = module.exports = function(params){
    nm.EmailMessage.apply(this, arguments);
    if( !this.sender ){
        this.sender = Bozuko.config.email.sender;
    }
};

EmailMessage.prototype.__proto__ = nm.EmailMessage.prototype;

// static method (emulate the nodemailer send_mail)
EmailMessage.send = function(params, callback){
    
    var em = new EmailMessage(params),
        attempts = 0;
        
    var attempt = function(error){
        
        if( !error ){
            return callback.apply(arguments);
        }
        
        attempts++;
        if( error && attempts > 3 ){
            return callback.apply(arguments);
        }
        
        // retry (wait 10 seconds the first time, 20 seconds the second time, 30 seconds the third time)
        return setTimeout(function(){
            em.send(attempt);
        }, attempts * 10000);
        
    };
    
    em.send(attempt);
};