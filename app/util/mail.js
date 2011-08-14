var nm = require('nodemailer');
var inspect = require('util').inspect;

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
        
    var attempt = function(error, success){
        
        if( !error && success){
            console.error("Email Send: success; arguments = "+inspect(arguments));
            return callback.apply(arguments);
        }
        
        attempts++;
        if( attempts > 3 ){
            console.error("Email Send: attempts > 3; arguments = "+inspect(arguments));
            return callback.apply(arguments);
        }
        
        // retry (5,10,15 minutes)
        return setTimeout(function(){
            em.send(attempt);
        }, attempts * 1000 * 60 * 5);
        
    };
    
    em.send(attempt);
};