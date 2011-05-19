var nm = require('nodemailer');

nm.SMTP = Bozuko.config.email.smtp;

console.log(nm.EmailMessage);

var EmailMessage = module.exports = function(params){
    nm.EmailMessage.apply(this, arguments);
    if( !this.sender ){
        this.sender = Bozuko.config.email.sender;
    }
};

EmailMessage.prototype.__proto__ = nm.EmailMessage.prototype;

// static method (emulate the nodemailer send_mail)
EmailMessage.send = function(params, callback){
    var em = new EmailMessage(params);
    em.send(callback);
};