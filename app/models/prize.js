var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    s3 = Bozuko.require('util/s3'),
    burl = Bozuko.require('util/url').create,
    LastUpdatedPlugin = require('./plugins/lastupdated'),
    JSONPlugin = require('./plugins/json'),
    XRegExp = Bozuko.require('util/xregexp'),
    ObjectId = Schema.ObjectId,
    mail = Bozuko.require('util/mail'),
    Pdf = require('pdfkit'),
	dateFormat = require('dateformat'),
    async = require('async'),
    uuid = require('node-uuid'),
    http = Bozuko.require('util/http'),
    fs = require('fs')
;

var safe = {w:2, wtimeout: 5000};
var Prize = module.exports = new Schema({
    contest_id              :{type:ObjectId, index:true},
    page_id                 :{type:ObjectId, index:true},
    user_id                 :{type:ObjectId, index:true},
    prize_id                :{type:ObjectId, index:true},
    uuid                    :{type:String},
    shared					:{type:Boolean, default:false},
    code                    :{type:String, index:true},
    value                   :{type:Number},
    name                    :{type:String},
    page_name               :{type:String},
    user_name               :{type:String},
    timestamp               :{type:Date, index: true},
    image                   :{type:String},
    message                 :{type:String},
    expires                 :{type:Date},
    play_cursor             :{type:Number},
    description             :{type:String},
    details                 :{type:String},
    instructions            :{type:String},
    verified                :{type:Boolean, index: {sparse: true}},
    verified_time           :{type:Date},
    redeemed                :{type:Boolean},
    redeemed_time           :{type:Date,    index: true},
    is_email                :{type:Boolean, default:false},
    email_body              :{type:String},
    email_code              :{type:String},
    email_replyto           :{type:String},
    email_format            :{type:String,  default: 'text/plain'},
    email_subject           :{type:String},
    email_history	        :[ObjectId],
    is_barcode              :{type:Boolean, default:false},
    barcode_image           :{type:String},
    consolation             :{type:Boolean, default:false},
    bucks                   :{type:Number}
},  {safe:safe});

// setup our constants
Prize.REDEEMED = 'redeemed';
Prize.ACTIVE = 'active';
Prize.EXPIRED = 'expired';
Prize.VERIFIED = 'verified';

Prize.plugin(LastUpdatedPlugin);
Prize.plugin(JSONPlugin);

Prize.virtual('state')
    .get(function(){
        if( this.verified ) return Prize.VERIFIED;
        if( this.redeemed ) return Prize.REDEEMED;
        var now = new Date();
        if( now < this.expires ) return Prize.ACTIVE;
        return Prize.EXPIRED;
    });

Prize.method('verify', function(callback) {
    var self = this;
    if (this.verified) return callback(Bozuko.error('prize/already_verified'));
    return Bozuko.models.Prize.findAndModify(
        {_id: this._id, verfied: {$exists: false}}, [],
        {$set: {verified: true, verified_time: new Date()}},
        {new: true, safe: safe}, function(err, prize) {
            if (err) return callback(err);
            Bozuko.publish('prize/verified',
                {prize_id: self._id, contest_id: self.contest_id, page_id: self.page_id, user_id: self.user_id} );
            return callback(null, prize);
        }
    );
});

Prize.method('redeem', function(user, email_prize_screen, callback){
    var self = this;
    if( self.redeemed ){
        // not sure if we should throw an error...
        return callback( Bozuko.error('prize/already_redeemed') );
    }
    var now = new Date();
    if( self.state == Prize.EXPIRED ){
        // ruh-roh.
        return callback( Bozuko.error('prize/expired') );
    }
    if( String(user._id) != String(this.user_id) ){
        return callback( Bozuko.error('prize/redeem_bad_user') );
    }
    // looks like we got past all the error conditions....
    self.redeemed = true;
    self.redeemed_time = now;
    return self.save( function(error){
        if( error ) return callback( error );
        if (self.is_email) self.sendEmail(user);

        // this 'if' is for backwards compatability
        if( self.prize_id ) Bozuko.models.Contest.collection.update(
            {'prizes._id':self.prize_id},
            {$inc: {'prizes.$.redeemed':1}},
	    {safe: {w:2, wtimeout: 5000}},
            function(error){
                if( error ) console.error( error );
                else console.log('updated redeemed');
            }
        );

        // okay, lets get the page and get its security image
        return Bozuko.models.Page.findById(self.page_id, function(error, page){
            if( error ) return callback( error );
            self.user = user;
            self.page = page;

            var security_img;
            if( page.security_img ){
                security_img = s3.client.signedUrl('/'+page.security_img, new Date(Date.now()+(1000*60*2)) );
            }
            else{
                security_img = burl('/images/security_image.png');
            }

            if (email_prize_screen && !self.is_email) {
                self.emailPrizeScreen(user, security_img);
            }

            Bozuko.publish('prize/redeemed', {prize_id: self._id, contest_id: self.contest_id, page_id: self.page_id, user_id: self.user_id} );
            return callback(null, {
                security_image: security_img,
                prize: self
            });
        });
    });
});


// Don't bother waiting for this. Just fire and forget. We should have a way for the user
// to request the email to be resent.
Prize.method('sendEmail', function(user) {
    var self = this;
	if( !this.is_email ){
		// get the page
		return Bozuko.models.Page.findById(this.page_id, function(error, page){
			if( error || !page ) return;
			if( page.security_img ){
                security_img = s3.client.signedUrl('/'+page.security_img, new Date(Date.now()+(1000*60*2)) );
            }
            else{
                security_img = burl('/images/security_image.png');
            }
			self.page = page;
			self.user = user;
			self.emailPrizeScreen(user, security_img);
		});
	}
    else if( self.email_format != 'text/html') {
        return mail.send({
				user_id: user._id,
				to: user.email,
				subject: 'You just won a Bozuko prize!',
				body: 'Gift Code: '+self.email_code+"\n\n\n"+self.email_body
			}, function(err, success, record) {
				if (err) console.error("Email Err = "+err);
				if (err || !success) {
					console.error("Error sending mail to "+user.email+" for prize_id "+self._id);
				}
			if( success && record._id ){
				self.email_history.push(record._id);
			}
        });
    }
    // do some substitutions
    var subject = self.email_subject,
        body = self.email_body,
        subs = {
            '{name}':user.name,
            '{email}':user.email,
            '{prize}':self.name,
            '{code}':self.email_code
        };

    Object.keys(subs).forEach(function(key){
        var re = new RegExp(XRegExp.escape(key), "gi");
        subject = subject.replace(re, subs[key] );
        body = body.replace(re, subs[key] );
    });

    var text = body
        .replace(/<br>/gi, "\n")
        .replace(/<p.*>/gi, "\n")
        .replace(/<a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 ($1) ")
        .replace(/<(?:.|\s)*?>/g, "");

	var config = {
        to: user.email,
        subject: subject,
        html: body,
        body: text
    };

	if( self.email_replyto && self.email_replyto != '' ){
		config.reply_to = self.email_replyto;
	}

    return mail.send(config, function(err, success) {
        if (err) console.error("Email Err = "+err);
        if (err || !success) {
            console.error("Error sending mail to "+user.email+" for prize_id "+self._id);
        }
    });
});

Prize.method('loadTransferObject', function(callback){
    var self = this;
    return Bozuko.models.Page.findById(self.page_id, function(error, page){
        if( error ) return callback( error );
        self.page = page;
        return Bozuko.models.User.findById(self.user_id, function(error, user){
            if( error )  return callback( error );
            self.user = user;
            return callback( null, self );
        });
    });
});

/*
 * This is potentially memory and cpu intensive. Use sparingly.
 */
Prize.static('countBucks', function(opts, callback) {
    return Bozuko.models.Prize.find(
        {user_id: opts.user_id, bucks: {$gt: 0}},
        {bucks: 1, _id: 0},
        function(err, prizes) {
            if (err) return callback(err);
            var bucks = 0;
            return async.forEach(prizes, function(prize, cb) {
                bucks += prize.bucks;
                process.nextTick(cb);
            }, function(err) {
                return callback(null, bucks);
            });
        }
    );
});

Prize.static('getLastUpdated', function(selector, callback){
    var s = {};
    selector = selector || {};
    Object.keys(selector).forEach(function(key){
        s[key] = selector[key];
    });
    s.last_updated = {$exists: true};
    options = {sort: {last_updated:-1}, limit: 1};
    Bozuko.models.Prize.find(s, {}, options, function(error, prizes){
        if( error ) return callback(error);
        if( !prizes.length ) return callback(null, null);
        return callback( null, prizes[0] );
    });
});

Prize.static('search', function(){
    var callback = arguments[arguments.length-1];
    arguments[arguments.length-1] = function(error, prizes){

        if( error ) return callback( error );

        // no prizes, just send back the empty array then
        if( prizes.length == 0 ){
            return callback(null, prizes);
        }

        // else, lets go through each page and load users and pages
        var page_ids = [],
            user_ids = [],
            page_map = {},
            user_map = {};

        prizes.forEach(function(prize){

            page_ids.push(prize.page_id);
            if( !page_map[prize.page_id] ) page_map[prize.page_id] = [];
            page_map[prize.page_id].push( prize );

            user_ids.push(prize.user_id);
            if( !user_map[prize.user_id] ) user_map[prize.user_id] = [];
            user_map[prize.user_id].push( prize );

        });



        return Bozuko.models.Page.find({_id: {$in: page_ids}}, function(error, pages){
            if( error ) return callback( error );
            pages.forEach( function(page){
                var _prizes = page_map[page.id];
                _prizes.forEach( function(_prize){
                    _prize.page = page;
                });
            });
            return Bozuko.models.User.find({_id: {$in: user_ids}}, function(error, users){
                if( error )  return callback( error );
                users.forEach( function(user){
                    var _prizes = user_map[user.id];
                    _prizes.forEach( function(_prize){
                        _prize.user = user;
                    });
                });
                return callback( null, prizes );
            });
        });
    };
    this.find.apply( this, arguments );
});

Prize.method('emailPrizeScreen', function(user, security_img) {
    var self = this;
	
	return this.getImages(user, security_img, function(err, images) {
		if (err) {
			return console.error('emailPrizeScreen: failed to retrieve images for prize: '+self._id);
		}
		var pdf = self.createPdf(user, images);
		var attachments = [{
			filename: 'bozuko_prize.pdf',
			contents: new Buffer(pdf, 'binary')
		}];
		// lets get the page name...
		
		return mail.send({
			user_id: user._id,
			to: user.email,
			subject: 'Congratulations! You won a prize from '+self.page_name,
			body: [
				'Hi '+self.user_name+',',
				'',
				'Please see the attachment for your prize',
			].join('\n'),
			attachments: attachments
		}, function(err, success, record) {
			if (err || !success) {
				console.error('Error emailing prize screen: '+err);
			}
		});
	});
});

Prize.method('getImages', function(user, security_img, callback) {
    var _uuid = uuid();
    var imgs = {
        user: {
            url: this.user.image.replace(/type=large/, 'type=square'),
            path: '/tmp/user-'+user._id+'-image.'+_uuid+'.jpg'
        },
        security: {
            url: security_img,
            path: '/tmp/page-'+this.page._id+'-security.'+_uuid+'.png'
        },
        business: {
            url: this.page.image,
            path: '/tmp/page-'+this.page._id+'-image.'+_uuid+'.png'
        }
    };
    var expires = new Date( Date.now() + Bozuko.cfg('barcode.url_expiration',1000*60*60*24 ) );
    if (this.is_barcode) imgs.barcode = {
        url: s3.client.signedUrl(this.barcode_image, expires),
        path: '/tmp/barcode-'+this._id+'-image.'+_uuid+'.png'
    };

    async.forEach(Object.keys(imgs), function(key, cb) {
        var img = imgs[key];
        download(img.url, img.path, cb);
    }, function(err) {
        if (err) return callback(err);
        return callback(null, imgs);
    });
});

Prize.method('share', function(args, callback){
	var prize = this,
		user = args.user || false,
		page = args.page || false,
		contest = args.contest || false;

	if( prize.shared ){
		return callback(Bozuko.error('prize/already_shared'));
	}

	return async.series([

		function getUser(cb){
			if( user && user._id == prize.user_id ) return cb();
			return Bozuko.models.User.findById(prize.user_id, function(error, _user){
				if( error ) return cb(error);
				user = _user;
				return cb();
			});

		},

		function getPage(cb){
			if( page && page._id == prize.page_id ) return cb();
			return Bozuko.models.Page.findById(prize.page_id, function(error, _page){
				if( error ) return cb(error);
				if( !_page ){
					return cb(Bozuko.error('prize/share_no_page'));
				}
				page = _page;
				return cb();
			});
		},

		function getContest(cb){
			if( contest && contest._id == prize.contest_id ) return cb();
			return Bozuko.models.Contest.findById(prize.contest_id, function(error, _contest){
				if( error ) return cb(error);
				if( !_contest ){
					return cb(Bozuko.error('prize/share_no_contest'));
				}
				contest = _contest;
				return cb();
			});
		},

		function doShare(cb){

			if( contest.post_to_wall !== true ){
				return cb();
			}
			
			var link = burl( contest.web_only ?
				(contest.alias||('/client/game/'+contest._id)) :
				'https://bozuko.com/p/'+prize.page_id
			);
			
			if( contest.share_url ) link = contest.share_url;
			
			link = link.replace(/api\./, '').replace(/:(443|80)\//, '/');

			var options = {
				user: user,
				message: args.message || '',
				link: link,
				picture: burl('/page/'+prize.page_id+'/image')
			};

			var gameName = contest.getGame().getName();

			var a = /^([0-9\$]|a|an|the)\s/i.test(String(prize.name)) ? '' : (String(prize.name).match(/^[aeiou]/i) ? 'an ' : 'a '),
				at = 'at';

			options.name = user.name+' just won '+a+prize.name+'!';

			// fix this in the case of Bozuko
			if( page.name.match(/^bozuko$/i) ) at='with';
			
			var game_type = contest.game=='scratch'? 'scratch ticket':'slot machine';
			options.description = 'You could too! Play '+page.name+' '+game_type+' for your chance to win!';
			if( contest.share_description ) {
				options.description = options.share_description;
			}

			return Bozuko.service('facebook').post(options, function(error){

				if( error ) return cb(error);

				// lets save this share...
				var share = new Bozuko.models.Share({
					service         :'facebook',
					type            :'post',
					contest_id      :prize.contest_id,
					page_id         :prize.page_id,
					user_id         :prize.user_id,
					visibility      :0,
					message			:options.message
				});

				try{
					share.visibility = user.service('facebook').internal.friends.length;
				}catch(e){
					share.visibility = 0;
				}

				return share.save(function(err){
					// send the redemption object
					if( error ) return cb(error);

					// we also want to set a flag that this prize has been shared.
					prize.shared = true;
					return prize.save(cb);
				});

			});

		}

	], function finish(error){
		if( error ) return callback(error);
		return callback();
	});

});

Prize.method('createPrizeScreenPdf', function(user, images) {
    var doc = new Pdf({size: 'letter', margins: {top: 20, left: 20, right: 20, bottom: 20}});
    var image_base = Bozuko.dir+'/resources/images',
        logo_width = doc.page.width * .25;

    doc.info.Title = 'Bozuko Prize';
    doc.info.Author = 'Bozuko, Inc';
    doc.registerFont('Bozuko',Bozuko.dir+'/resources/fonts/arvo/Arvo-Regular.ttf','ArvoRegular');

    // Bozuko logo
    doc.image(image_base+'/logo/logo.png', 20, 20, {width: logo_width});

    // // Horizontal line
    // doc.moveTo(doc.x, doc.y)
    //    .fill('black')
    //    .lineTo(doc.page.width, doc.y)
    //    .stroke()
    // ;


    // prize name
    doc.fill('#D3D3D3')
       .font('Bozuko')
       .fontSize(16)
       .text('Prize:', doc.x, doc.y+20)
       .fontSize(20)
       .fill('black')
       .text(this.name)
    ;

    // prize code
    doc.fill('#D3D3D3')
       .fontSize(16)
       .text('Code:', doc.x, doc.y+20)
       .fill('black')
       .text(this.code)
    ;

    // TODO: Horizontal line

    var user_img_y = doc.y;
    // User and Business Images
    doc.image(images.user.path, doc.x, doc.y+20, {width: logo_width})
       .image(images.business.path, doc.x, doc.y+logo_width+40, {width: logo_width})
    ;

    // Message and Timestamp
    var ts = this.timestamp;
        ampm = ts.getHours() > 11 ? 'pm' : 'am',
        hrs = ts.getHours() > 12 ? ts.getHours() - 12 : ts.getHours(),
        minstr = ts.getMinutes() < 10 ? '0'+ts.getMinutes() : ts.getMinutes(),
        timestr = ts.toDateString()+' '+hrs+':'+minstr+' '+ampm,
        xpos = logo_width + 80;
    ;

    doc.fontSize(24)
       .fill('blue')
       .font('Bozuko')
       .text('REDEEMED', xpos, doc.y +logo_width*.5)
       .text(timestr)
    ;

    // Security or Barcode Image
    var path = images.barcode ? images.barcode.path : images.security.path;
    doc.image(path, doc.x, user_img_y + logo_width + 40, {width: logo_width})
    ;

    doc.x = 0;
    // Thank You message
    doc.fontSize(16)
       .fill('white')
       .text('junk', doc.x, user_img_y+2*logo_width+100)
       .fill('gray')
       .text('This prize has been redeemed', {align: 'center'})
       .fontSize(20)
       .text('THANK YOU', {align: 'center'})
    ;

    return doc.output();
});

Prize.method('createPdf', function(user, images, callback){
	var doc = new Pdf({size: 'letter', margins: {top: 20, left: 20, right: 20, bottom: 20}});
    var image_base = Bozuko.dir+'/resources/images',
        logo_width = doc.page.width * .25;

    doc.info.Title = 'Bozuko Prize';
    doc.info.Author = 'Bozuko, Inc';
	
    doc.registerFont('Light',Bozuko.dir+'/resources/fonts/open-sans/OpenSans-Light.ttf','OpenSansLight')
	doc.registerFont('Regular',Bozuko.dir+'/resources/fonts/open-sans/OpenSans-Regular.ttf','OpenSansRegular');
	doc.registerFont('Bold',Bozuko.dir+'/resources/fonts/open-sans/OpenSans-Bold.ttf','OpenSansBold');
	doc.registerFont('ExtraBold',Bozuko.dir+'/resources/fonts/open-sans/OpenSans-ExtraBold.ttf','OpenSansExtraBold');
	
    // Bozuko logo
    // doc.image(image_base+'/logo/logo.png', 20, 20, {width: logo_width});
	
	var margin = 40, x, y,
		width = doc.page.width-margin*2,
		box_margin = 6,
		box_padding = 6,
		box_width = width - box_margin*2 - box_padding*2,
		box_x = margin + box_margin + box_padding,
		col1 = .4 * box_width, col1_y,
		col2_x = col1 + (box_width * .05),
		col2 = .55 * box_width, col2_y,
		image_size = 40,
		logo_width = 150
		;
	
	
	/**
	 * Top box
	 */
	doc.y = box_x; // This is a hack to capture the y after we add the image
	doc
		.image(image_base+'/logo/logo.png',box_x, box_x, {width: logo_width})
		;
		
	y = doc.y;
	
	doc
		.fill('#333')
		.font('Regular')
		.fontSize(20)
		.text('Code: '+this.code, box_x, box_x+10, {width: box_width, align: 'right'})
		;
		
	y = Math.max(y, doc.y)+5;
	
	doc
		.moveTo(box_x-box_padding, y)
		.lineTo(box_x-box_padding + box_width+box_padding*2, y)
		.stroke('#999')
		;
	
	
	var col_y = doc.y = y+10;
	/**
	 * First Column
	 */
	doc
		.image(images.business.path, box_x, y+10, {width: image_size})
		;
	
	var top = y;
	x=doc.x;
	y=doc.y;
	
	doc.y = top+15;
	
	doc
		.font('Bold')
		.fontSize(14)
		.fill('#333')
		.text(this.page.name, x+image_size+5, top+15, {width: col1-image_size-5, align: 'left'});
	
	doc.y = Math.max(y, doc.y)+5;
	doc.x = box_x;
	
	doc
		.fontSize(12)
		.font('Bold')
		.fill('#333')
		.text('User:')
		
		.font('Regular')
		.fill('#000')
		.text(user.name)
		;
		
	doc.y+=4;
	
	doc
		.font('Bold')
		.fill('#333')
		.text('Won:')
		
		.font('Regular')
		.fill('#000')
		.text(dateFormat(this.timestamp, 'mediumDate')+' '+dateFormat(this.timestamp, 'shortTime'))
		;
	
	doc.y+=4;
	
	doc
		.font('Bold')
		.fill('#333')
		.text('Expires:')
		
		.font('Regular')
		.fill('#000')
		.text(dateFormat(this.expires, 'mediumDate')+' '+dateFormat(this.expires, 'shortTime'))
		;
	
	doc.y+= 4;
	
	// do we have a barcode?
	if( images.barcode ){
		// lets pump this bad boy in...
		doc.image(images.barcode.path, {fit:[col1, 80]});
	}
	// save bottom of the first column
	col1_y = doc.y;
	
	// start the second column...
	doc.x = box_x+col2_x;
	doc.y = col_y;
	
	doc
		.font('Bold')
		.fill('#369d4e')
		.fontSize(20)
		.text('YOU WIN!', {width: col2})
		
		.fill('#000')
		.fontSize(24)
		.text(this.name, {width: col2})
		;
		
	if( this.description ){
		doc
			.fontSize(12)
			.moveDown()
			.font('Bold')
			.fill('#333')
			.text('Description:', {width: col2})
			
			.font('Regular')
			.fill('#000')
			.text(this.description, {width: col2})
			;
	}
	
	doc
		.moveDown()
		.fontSize(9)
		.font('Regular')
		.fill('#666')
		.text('This prize has no cash value and can only be redeemed a single time.', {width: col2})
	
	// lets get the bottom
	col2_y = doc.y;
	y = Math.max(col1_y, col2_y)+4;
	
	// draw that inside box.
	doc
		.rect(margin+box_margin, margin+box_margin, box_width+box_padding*2, y - margin+box_margin)
		.stroke('#999')
		;
	
	// ok, move down below
	doc.x = margin + box_margin;
	doc.y = y+20;
	
	doc
		.fontSize(14)
		.font('Bold')
		.fill('#333')
		.text('Instructions:', {width: width})
		;
	// stupid numbers
	doc.moveDown();
	
	var left = doc.x, inst_left = doc.x+ 14, inst_width = width-14;
	
	y =doc.y
	doc.font('Regular').fontSize(12).fill('#000');
	doc.text('1)');
	
	doc.y = y;
	doc.x = inst_left;
	doc.text('Print this Bozuko prize voucher or pull up the prize using the mobile application.', {width: inst_width});
	
	
	doc.x = left;
	y = doc.y;
	doc.text('2)');
	
	doc.y = y;
	doc.x = inst_left;
	doc.text('Present your Bozuko prize voucher or mobile application prize screen to an employee.', {width: inst_width});
	
	doc.x = left;
	y = doc.y;
	doc.text('3)');
	
	doc.y = y;
	doc.x = inst_left;
	doc.text('Enjoy your prize you big winner!', {width: inst_width});
	
	doc.x = left;
	doc.moveDown();
	doc.fontSize(9);
	doc.fill('#333');
	doc.text('Remember to tip on the full amount, when applicable :)', {width:width});
	
	doc.moveDown();
	
	doc.text('Thanks for playing Bozuko! Have any issues? Contact support@bozuko.com. This prize may be redeemed one time. XOXO.', {width: width});
	
	// get the bottom..
	y = doc.y +5;
	doc
		.rect(margin, margin, width, y-margin)
		.stroke('#999')
	
	return doc.output();
	
});

function download(url, path, callback) {
    return http.request({
        url:url.replace('type=large','type=square'),
        encoding:'binary'
    }, function(error, result, response){
        if( error ) return callback(error);
        fs.writeFile(path, result, 'binary', callback);
    });
}
