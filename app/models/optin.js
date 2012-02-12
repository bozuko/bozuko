var mongoose = require('mongoose'),
    dateFormat = require('dateformat'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId
;

var Optin = module.exports = new Schema({
    user_id                 :{type:ObjectId,    index: true},
    page_id                 :{type:ObjectId,    index: true},
    contest_id              :{type:ObjectId,    index: true},
    first_name              :{type:String},
    last_name               :{type:String},
    email                   :{type:String},
    timestamp               :{type:Date,        index: true,    default: Date.now}
}, {safe: {j:true}});

Optin.method('notifyMailchimp', function(user, page){
    var api = page.getMailChimpApi();
    // notify list...
    if( page.mailchimp_activelists && page.mailchimp_activelists.length ) page.mailchimp_activelists.forEach(function(id){
        api.execute('listSubscribe', {
            id: id,
            email_address: user.email,
            merge_vars: {
                'FNAME':user.first_name,
                'LNAME':user.last_name
            },
            double_optin: false,
            send_welcome: true
        }, function(error, result){
            if( error ) console.error( error.message );
        });
    });
    
});

Optin.method('notifyConstantContact', function(user, page){
    var api = page.getConstantContactApi(),
        lists = page.constantcontact_activelists;
        
    // first thing, lets see if this user exists in their db already
    return api.execute('/contacts?email='+encodeURIComponent(user.email), 'GET', function(error, response){
        
        var contact_id = null;
        if( !error && response && response.feed && response.feed.entry && response.feed.entry.id ){
            contact_id = response.feed.entry.id;
        }
        if( lists && lists.length ) lists.forEach(function(id){
            var _id = contact_id || 'data:,none',
                body = [
    '<entry xmlns="http://www.w3.org/2005/Atom">',
      '<title type="text">'+ (contact_id ? ('Contact: '+user.email) : '') +'</title>',
      '<updated>'+dateFormat(new Date(), 'isoUtcDateTime')+'</updated>',
      '<author></author>',
      '<id>'+(contact_id || 'data:,none')+'</id>',
      '<summary type="text">Contact</summary>',
      '<content type="application/vnd.ctct+xml">',
        '<Contact xmlns="http://ws.constantcontact.com/ns/1.0/">',
          '<EmailAddress>'+user.email+'</EmailAddress>',
          '<FirstName>'+user.first_name+'</FirstName>',
          '<LastName>'+user.last_name+'</LastName>',
          '<OptInSource>ACTION_BY_CONTACT</OptInSource>',
          '<ContactLists>',
            '<ContactList id="'+id+'" />',
          '</ContactLists>',
        '</Contact>',
      '</content>',
    '</entry>'
            ].join('\n');
            api.execute('/contacts'+(contact_id?'/'+contact_id.split('/').pop():''), contact_id?'PUT':'POST', body, function(error, response){
                if(error) console.error(error);
            });
        });
    });
    
});

Optin.static('create', function(user, page, contest, callback){
    Bozuko.models.Optin.findOne({user_id: user._id, page_id: page._id}, function(error, _optin){
        
        if( error ) return callback(error);
        if( _optin ) return callback(null, _optin);
        
        // create a new optin
        var optin = new Bozuko.models.Optin({
            user_id: user._id,
            page_id: page._id,
            contest_id: contest._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        });
        
        return optin.save(function(error){
            if( error ) return callback(error);
            
            if( page.mailchimp_token ) optin.notifyMailchimp(user, page);
            if( page.constantcontact_token ) optin.notifyConstantContact(user, page);
            return callback();
            
        });
        
    });
});

Optin.static('getCSV', function(page_id, contest_id, out){
    
    if( out == undefined ){
        out = contest_id;
        contest_id = false;
    }
    
    var callback = typeof out == 'function' ? out : false;
    
    var q = {page_id: page_id}, data=[];
    if( contest_id ) q.contest_id = contest_id;
    
    var stream = Bozuko.models.Optin.find(q).stream();
    
    stream.on('data', function(row){
        var line = [
            row.email,
            row.first_name,
            row.last_name
        ];
        for(var i=0; i<line.length; i++) line[i] = '"'+line[i].replace(/"/g, '\"')+'"';
        if( !callback ) out.write(line.join(',')+'\n'); 
        else data.push(line.join(','));
    });
    
    stream.on('close', function(){
        if(!callback) out.end();
        else callback(data.join('\n'));
    });
});
