var nm = require('nodemailer'),
    inspect = require('util').inspect;
    
var userIndex = 0;

var EmailMessage = module.exports = function(params){
    params = params || {};
    
    var smtp = Bozuko.cfg('email.smtp');
    params.server = {
        host                :smtp.host,
        port                :smtp.port,
        ssl                 :smtp.ssl,
        use_authentication  :smtp.use_authentication
    };
    
    var user;
    if( smtp.users ){
        // get the next guy...
        var count = smtp.users.length;
        if( userIndex > count-1 ) userIndex = 0;
        user = smtp.users[userIndex++];
    }
    else if( smtp.user ){
        user = {user: smtp.user, pass: smtp.pass};
    }
    params.server.user = user.user;
    params.server.pass = user.pass;
    
    nm.EmailMessage.call(this, params);
    if( !this.sender ){
        this.sender = Bozuko.cfg('email.sender', 'Bozuko Mailer');
    }
};

EmailMessage.prototype.__proto__ = nm.EmailMessage.prototype;

// static method (emulate the nodemailer send_mail)
EmailMessage.send = function(params, callback){
    
    var em = new EmailMessage(params),
        attempts = 0;
    
    var record = new Bozuko.models.Email({
        user: em.SERVER.user,
        to: params.to,
        subject: params.subject,
        body: params.body,
        html: params.html,
        status: 'pending',
        attempt: attempts+1
    });
    record.save();
    
    var attempt = function(error, success){
        
        if( !error && success){
            //console.error("Email Send: success; arguments = "+inspect(arguments));
            record.status = 'success';
            record.attempt = attempts+1;
            record.delivered = new Date();
            record.save();
            
            return callback.apply(this, arguments);
        }
        
        attempts++;
        var max = Bozuko.cfg('email.retry.attempts', 3)
        if( attempts > max ){
            //console.error("Email Send: attempts > max; arguments = "+inspect(arguments));
            record.status = 'failure';
            record.attempt = attempts+1;
            record.save();
            return callback.apply(this, arguments);
        }
        
        // retry (5,10,15 minutes)
        return setTimeout(function(){
            record.attempt = attempts+1;
            record.save();
            em.send(attempt);
        }, attempts * Bozuko.cfg('email.retry.delay', 1000 * 60 * 5) );
        
    };
    
    em.send(attempt);
};