var Content     = Bozuko.require('util/content'),
    validator   = require('validator'),
    mailer      = Bozuko.require('util/mail'),
    Report      = Bozuko.require('core/report'),
    DateUtil    = Bozuko.require('util/date'),
    async       = require('async'),
    http        = Bozuko.require('util/http'),
    PDF         = require('pdfkit'),
    indexOf     = Bozuko.require('util/functions').indexOf,
    filter      = Bozuko.require('util/functions').filter,
    array_map   = Bozuko.require('util/functions').map,
    merge       = Bozuko.require('util/functions').merge,
    s3          = Bozuko.require('util/s3'),
    GD          = require('node-gd'),
    fs          = require('fs'),
    Path        = require('path'),
    ObjectId    = require('mongoose').Types.ObjectId,
    XRegExp     = Bozuko.require('util/xregexp'),
    crypto      = require('crypto'),
    reporter    = Bozuko.require('util/reporter'),
    winnersReport = Bozuko.require('util/winnersReport.js')
    ;

exports.restrictToUser = false;

exports.routes = {

    '/redemption/instructions/:id' : {
        get : {
            handler : function(req, res){
                var id = req.param('id');
                // get the page...

                if( this.restrictToUser && !~indexOf(req.session.user.manages, id) ){
                    return Bozuko.error('bozuko/auth').send(res);
                }

                return Bozuko.models.Page.findById(id, function(error, page){

                    if( error || !page ) return res.send("Page not found");

                    // we need to download the resources for this bad larry.
                    var download = function(url, path, callback){

                        // first create the directories as necessary
                        http.request({
                            url:url.replace('type=large','type=square'),
                            encoding:'binary'
                        }, function(error, result, response){

                            if( error ) return callback(error);

                            if( response.headers['content-type'] && response.headers['content-type'].match(/^image/) ){
                                path+='.'+(response.headers['content-type'].replace('image/', '').replace('jpeg','jpg'));
                            }

                            // save the result to file.
                            var file = fs.openSync( path, 'w', 0755 );
                            var err = fs.writeSync( file, result, 0, 'binary' );
                            fs.closeSync(file);

                            if( err instanceof Error ){
                                return callback(err);
                            }
                            return callback(null, path);
                        });
                    }

                    if( !Path.existsSync(Bozuko.dir+'/tmp/') ){
                        fs.mkdirSync(Bozuko.dir+'/tmp/', 0755);
                    }

                    security_img = page.security_img || 'security/sun.png';

                    var pic_file = Bozuko.dir+'/tmp/'+page._id+'-pic';
                    var security_file = Bozuko.dir+'/tmp/'+page._id+'-security';

                    return async.series([
                        function download_profile_image(cb){
                            download(page.image, pic_file, function(error, path){
                                if( error ) return cb(error);
                                pic_file = path;
                                return cb();
                            });
                        },
                        function download_security_image(cb){
                            download(s3.client.signedUrl('/'+security_img, new Date(Date.now()+1000*30)), security_file, function(error, path){
                                if( error ) return cb(error);
                                security_file = path;
                                return cb();
                            });
                        }],
                        function create_pdf(error){

                            if( error ) throw error;

                            var doc = new PDF({size:'letter',margins: {
                                top: 20,
                                left:20,
                                right:20,
                                bottom:20
                            }});

                            doc.write_lines = function(lines, x, y, options){
                                doc.x = x;
                                doc.y = y;
                                lines.forEach(function(line){
                                    doc.text(line, options);
                                });
                            };

                            var image_base = Bozuko.dir+'/resources/images',
                                logo_width = doc.page.width * .25,
                                logo_x = doc.page.width/2 - logo_width/2
                                ;

                            doc.info['Title'] = 'Bozuko Redemption Instructions';
                            doc.info['Author'] = 'Bozuko, Inc';

                            // register our font
                            doc
                                .registerFont('Heading Font',Bozuko.dir+'/resources/fonts/arvo/Arvo-Regular.ttf','ArvoRegular');

                            doc
                                .image(image_base+'/logo/logo.png', logo_x, 20, {width: logo_width})

                                .fill('#006b37')
                                .font('Heading Font')
                                .fontSize(16)
                                .text('Redemption Instructions for '+page.name,{align:'center'})
                                ;

                            // now lets get the Y coordinate and add some
                            // get block specific variables
                            var y = doc.y+20;

                            var w = doc.page.width,
                                prize_name = "Prize Name",
                                you_win_text = ['STEP 1: Redeem',
                                                'If a player wins a prize, they are presented a "YOU WIN!" screen '+
                                                'directing them to an employee. Ask them to press Redeem.'
                                               ];
                                h = (doc.page.height - doc.y),
                                src_width = 320,
                                src_height = 480,
                                block_width = w/2,
                                block_height = h*.625,
                                img_width = block_width * .6,
                                img_height = (img_width/src_width)*src_height,
                                img_x = (block_width - img_width)/2
                                ;

                            /**
                             * Block 1, you win
                             */
                            doc.image(image_base +'/redemption/you_win.png', img_x, y, {width: img_width});
                            var title_y = 0.07,
                                prize_y = 0.3,
                                desc_y = 0.39
                                ;

                            doc
                                // title
                                .fill('#ffffff')
                                .fontSize(11)
                                .font('Helvetica')
                                .text(page.name, img_x, y+(img_height*title_y), {width: img_width, align:'center'} )
                                // prize
                                .fill('#000000')
                                .fontSize(14)
                                .font('Helvetica-Bold')
                                .text(prize_name, img_x, y+(img_height*prize_y), {width: img_width, align: 'center'} )
                                ;

                            // we need to get the width of that "Prize Name" string so we can underline it.
                            var underline_w = doc.widthOfString(prize_name),
                                underline_x = img_x+(img_width-underline_w)/2
                                ;
                            doc
                                // underline
                                .moveTo(underline_x, doc.y-3 )
                                .lineTo(underline_x+underline_w, doc.y-3)
                                .stroke('#000000')

                                // description
                                .font('Helvetica-Bold')
                                .fontSize(7.5)
                                .text(
                                    "To redeem your prize from "+page.name+": [Your Instructions Here]. This prize expires August 14, 2012 04:20 PM",
                                    img_x + (img_width - img_width*.9)/2, y+(img_height*desc_y),
                                    {align: 'left', width: img_width*.9})

                                // paragraph below
                                .font('Helvetica')
                                .fontSize(11)
                                .write_lines(you_win_text, img_x, y+img_height+20, {align:'left', width:img_width})
                                ;


                            /**
                             * Block 2, redemption screen
                             */
                            doc.image(image_base+'/redemption/redemption.png', block_width+img_x, y, {width: img_width});

                            var title_width = img_width-img_width*.1,
                                title_x = block_width+img_x+img_width-title_width,
                                prize2_w = img_width * .55,
                                prize2_x = block_width+img_x+img_width*.0625,
                                prize2_y = y + img_height * .33,
                                profile_w = img_width * 85 / 320,
                                profile_x = block_width + img_x + img_width*0.0625,
                                profile_y = y + img_height * 0.7791666666666667,
                                pimg_w = img_width * 81 / 320,
                                border = img_width*2/320,
                                pimg_x = profile_x + border,
                                pimg_y = profile_y + border,
                                s_w = img_width * 180/320,
                                s_h = s_w,
                                s_x = block_width + img_x + img_width * 117/320,
                                s_y = y + img_height*277/480,
                                s_time_y = y+img_height*358/480,
                                redeemed_text = ['STEP 2: Verify',
                                                 //' ',
                                                 'Pressing "Redeem" brings up the Prize Screen. '+
                                                 'You should see the prize, your business logo, a security image and the current time.'
                                                ]
                                ;

                            doc
                                // title
                                .fill('#ffffff')
                                .fontSize(11)
                                .font('Helvetica')
                                .text(page.name, title_x, y+(img_height*title_y), {width: title_width, align:'center'} )

                                // prize
                                .fill('#000000')
                                .fontSize(12)
                                .font('Helvetica-Bold')
                                .text(prize_name, prize2_x, prize2_y, {width: prize2_w, align: 'left'})

                                // border
                                .rect(profile_x,profile_y,profile_w,profile_w)
                                .fill('#c1c1c1')

                                // profile_pic
                                .image(pic_file, pimg_x,pimg_y, {width: pimg_w, height: pimg_w})

                                // security_pic
                                .image(security_file, s_x,s_y, {width: s_w, height: s_h})

                                // time
                                .fill('#000000')
                                .fontSize(14)
                                .text('06:30:45 PM', s_x, s_time_y, {width: s_w, align: 'center'})

                                // paragraph below
                                .font('Helvetica')
                                .fontSize(11)
                                .write_lines(redeemed_text, block_width+img_x, y+img_height+20, {align:'left', width: img_width } )
                                ;

                            /**
                             * Block 3, prizes screen
                             */
                            var prizes_text = 'A player may locate all of their saved and redeemed prizes '+
                                              'in the "Prizes" screen area of the app.'

                            doc
                                .fill('#006b37')
                                .font('Heading Font')
                                .fontSize(14)
                                .text('Saved Prizes', img_x,y+block_height+15, {align:'center', width: img_width})
                                .image(image_base+'/redemption/prizes.png', img_x, y+block_height+55, {width: img_width})
                                // paragraph below
                                .font('Helvetica')
                                .fill('#000000')
                                .fontSize(11)
                                .text(prizes_text, img_x, y+block_height+block_height*.12+55, {align:'left', width: img_width} )
                                ;

                            /**
                             * Block 4, contact information
                             */
                            doc
                                .fontSize(14)
                                .font('Heading Font')
                                .write_lines(['Contact Information:',
                                    'Email:',
                                    'support@bozuko.com',
                                    'Phone:',
                                    '415-2BOZUKO',
                                    '(415) 226-9856'
                                ], block_width, y+block_height+10,{align: 'center', width: block_width} )

                            // cleanup
                            fs.unlinkSync(security_file);
                            fs.unlinkSync(pic_file);

                            var name = String(page.name)
                                .replace(/\s/gi,'_')
                                .replace(/['\*"]/,'');

                            res.contentType('application/pdf');
                            res.header('Content-Disposition', 'inline; filename='+name+'_Redemption_Instructions.pdf');
                            return res.end(doc.output(),'binary');
                        }
                    )
                });
            }
        }
    },

    '/prizes/expired' : {
        get : {
            handler : function(req, res){

                var contest_id = req.param('contest_id');

                if( !contest_id ) return res.send({});

                var now = new Date(),
                    expired = {};

                // first things first, lets get the contest
                return Bozuko.models.Contest.findById(contest_id, function(error, contest){
                    if( error ) return res.send( error );
                    if( !contest ) return res.send({});

                    // now lets go through each prize and get expired counts
                    return async.forEachSeries( contest.prizes, function(prize, callback){

                        Bozuko.models.Prize.count({
                            redeemed: false,
                            expires:{$lt: now},
                            prize_id: prize._id,
                            contest_id: contest._id
                        }, function(error, count){
                            if( error ) return callback(error);
                            expired[String(prize._id)] = count;
                            return callback();
                        });

                    }, function finish(error){
                        if( error ) return error.send(res);
                        return res.send(expired);
                    });
                });
            }
        }
    },

    '/prizes/:id/expired.txt' : {
        get : {
            handler : function(req, res){

                var prize_id = req.param('id');

                var selector = {
                    'prizes._id'        :new ObjectId(prize_id)
                };
                if( this.restrictToUser ){
                    selector.page_id = {$in: req.session.user.manages};
                }

                res.contentType('text/plain');
                res.header('Content-Disposition', 'attachment; filename="Expired_Prizes.txt";');

                return Bozuko.models.Contest.findOne(selector ,{prizes: 1}, function(error, contest){

                    if( error ) return error.send( res );
                    if( !contest ) return res.send('');

                    // first find the prize
                    var prize = contest.prizes.id(prize_id),
                        is_email = prize.is_email,
                        is_barcode = prize.is_barcode;

                    if( !is_email && !is_barcode ){
                        return res.send('');
                    }

                    var codes = [];

                    return Bozuko.models.Prize.find( {
                        prize_id        :prize._id,
                        redeemed        :false,
                        expires         :{$lt: new Date()}
                    }, function(error, prizes){
                        if( error ) return error.send(res);

                        prizes.forEach(function(expired){
                            var code;
                            if( is_barcode ){
                                var i = String(expired.barcode_image).split('/').pop();
                                code = prize.barcodes[i];
                            }
                            else{
                                code = expired.email_code;
                            }
                            codes.push(code);
                        });

                        return res.send( codes.join('\r\n') );
                    });

                });
            }
        }
    },

    '/themes/:game/:page_name?' : {
        get : {
            handler : function( req, res ){
                try{
                    var page_name = req.param('page_name');
                    var themes = [];
                    Bozuko.games[req.param('game')].themes.forEach(function(theme){
                        if( !page_name || !theme.pages ){
                            themes.push(theme);
                        }
                        else{
                            for(var i =0, found=false; i<theme.pages.length && !found ; i++){
                                var re = theme.pages[i];
                                if( re.test(page_name) ){
                                    found = true;
                                    themes.push(theme);
                                }
                            }
                        }
                    });
                    return res.send( {items: themes} );
                }catch(e){
                    console.error(e);
                    return res.send({items:[]});
                }
            }
        }
    },

    '/themes/:game/:name/image' : {
        get : {
            handler : function( req, res ){
                try{
                    var themes = Bozuko.games[req.param('game')].themes;
                    for(var i=0; i<themes.length; i++){
                        var theme = themes[i];
                        if( theme.theme == req.param('name') ){
                            return res.redirect( theme.icon );
                        }
                    }
                }catch( e ){

                }
                return res.send('Invalid Theme');
            }
        }
    },
    
    '/security/images' : {
        get : {
            handler : function( req, res ){
                return s3.ls('security/', function(error, files){
                    return res.send({items:files});
                });
            }
        }
    },

    '/winners' : {

        get : {
            handler : function(req, res){

                // check for contest or page
                var contest_id = req.param('contest_id'),
                    page_id = req.param('page_id'),
                    limit = req.param('limit') || 25,
                    offset = req.param('start') || 0,
                    search = req.param('search'),
                    updateOnly = req.param('updateOnly') || false,
                    selector = {}
                    ;

                if( contest_id ){
                    selector.contest_id = contest_id;
                }
                if( this.restrictToUser ){
                    selector.page_id = {$in: req.session.user.manages};
                }
                if( page_id && (!this.restrictToUser || ~indexOf(req.session.user.manages, page_id)) ){
                    selector.page_id = page_id;
                }

                if( search ){
                    search = new RegExp('(^|\\s)'+XRegExp.escape(search), "i")
                    selector['$or'] = [
                        {'user_name': search},
                        {'name': search}
                    ];
                }

                return Bozuko.models.Prize.getLastUpdated(selector, function(error, lastUpdated){
                    if( error ) return error.send( res );

                    return Bozuko.models.Prize.find(selector, {}, {sort: {last_updated: -1}, limit: limit, skip: offset},function(error, prizes){
                        if( error ) return error.send(res);

                        return Bozuko.models.Prize.count(selector, function(error, total){

                            if( error ) return error.send( res );

                            var user_ids = {};
                            prizes.forEach(function(prize){
                                user_ids[String(prize.user_id)] = true;
                            });
                            var page_ids = {};
                            prizes.forEach(function(prize){
                                page_ids[String(prize.page_id)] = true;
                            });
                            var contest_ids = {};
                            prizes.forEach(function(prize){
                                contest_ids[String(prize.contest_id)] = true;
                            });

                            // get the users
                            return Bozuko.models.User.find({_id: {$in: Object.keys(user_ids)}}, {'services.internal.friends':0,'services.internal.likes':0}, function(error, users){
                                if( error ) return error.send(res);
                                var user_map = {};
                                users.forEach(function(user){
                                    user_map[String(user._id)] = user;
                                });

                                // get the pages
                                return Bozuko.models.Page.find({_id: {$in: Object.keys(page_ids)}}, {name: 1, image: 1}, function(error, pages){

                                    var page_map = {};
                                    pages.forEach(function(page){
                                        page_map[String(page._id)] = page;
                                    });

                                    // get the contests
                                    return Bozuko.models.Contest.find({_id: {$in: Object.keys(contest_ids)}}, {name: 1}, function(error, contests){

                                        var contest_map = {};
                                        contests.forEach(function(contest){
                                            contest_map[String(contest._id)] = contest;
                                        });

                                        var winners = [];
                                        prizes.forEach(function(prize){

                                            var user = user_map[String(prize.user_id)],
                                                filtered_user = filter(user,'_id','name','image','email');


                                            if( user ){
                                                filtered_user.facebook_link = user.service('facebook').data.link;
                                                filtered_user.friend_count = user.service('facebook').internal.friend_count;

                                                // create a winner object
                                                winners.push({
                                                    _id: prize.id,
                                                    prize: filter(prize,'_id','timestamp','state','name','description','details','instructions','code','redeemed','redeemed_time','expires','verified','verified_time','consolation','is_barcode','is_email','email_code','barcode_image', 'last_updated'),
                                                    user: filtered_user,
                                                    page: filter(page_map[String(prize.page_id)], '_id', 'name','image'),
                                                    contest: filter(contest_map[String(prize.contest_id)], '_id', 'name')
                                                });
                                            }
                                        });
                                        return res.send({items:winners, total: total, last_updated: lastUpdated?filter(lastUpdated,'_id','last_updated'):null});
                                    });
                                });
                            });
                        });
                    });
                });
            }
        }
    },

    '/entries' : {

        alias : '/entries/:id',

        get : {
            handler: function(req, res){

                var self = this,
                    page_id = req.param('page_id'),
                    contest_id = req.param('contest_id'),
                    limit = req.param('limit') || 25,
                    skip = req.param('start') || 0,
                    search = req.param('search') || false,
                    objects = {},
                    results = [],
                    total = 0
                    ;

                return async.series({

                    entries : function(callback){

                        var selector = {};

                        if( self.restrictToUser ){
                            selector = {
                                page_id: {$in: req.session.user.manages}
                            };
                        }

                        if( page_id && (!self.restrictToUser || ~indexOf(req.session.user.manages, page_id)) ){
                            selector.page_id = page_id;
                        }
                        if( contest_id ) selector.contest_id = contest_id;

                        if( search ){
                            search = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                            if( !page_id ){
                                selector['$or'] = [
                                    {user_name: search},
                                    {page_name: search},
                                ]
                            }
                            else{
                                selector.user_name = search;
                            }
                        }

                        return Bozuko.models.Entry.find(selector, {}, {sort:{timestamp: -1}, limit: limit, skip: skip}, function(error, entries){
                            if( error ) return callback(error);
                            objects.entries = entries;
//                            return Bozuko.models.Entry.count(selector, function(error, count){
                                if( error ) return error.send(res);
 //                               total = count;
                                total = 1000;
                                return callback( null );
                            })
                    },

                    user : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.user_id ) ) ids.push(entry.user_id);
                        });
                        return Bozuko.models.User.find({_id: {$in: ids}}, {'services.internal.friends':0,'services.internal.likes':0}, {
                            phones: 0,
                            challenge: 0,
                            last_internal_update: 0,
                            manages: 0,
                            salt: 0,
                            token: 0
                        },function(error, users){
                            if( error ) return callback(error);
                            objects.users = users;
                            objects.user_map = array_map(users,'_id');
                            return callback(null);
                        });
                    },

                    contests : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.contest_id ) ) ids.push(entry.contest_id);
                        });
                        return Bozuko.models.Contest.find({_id: {$in: ids}}, {
                            name: 1
                        },function(error, contests){
                            if( error ) return callback(error);
                            objects.contests = contests;
                            objects.contest_map = array_map(contests,'_id');
                            return callback(null);
                        });
                    },

                    pages : function(callback){
                        // create a user map
                        var ids = [];
                        objects.entries.forEach(function(entry){
                            if( !~ids.indexOf( entry.page_id ) ) ids.push(entry.page_id);
                        });
                        return Bozuko.models.Page.find({_id: {$in: ids}}, {
                            name: 1
                        },function(error, pages){
                            if( error ) return callback(error);
                            objects.pages = pages;
                            objects.page_map = array_map(pages,'_id');
                            return callback(null);
                        });
                    }

                }, function finish(error){
                    if( error ) return error.send( res );
                    objects.entries.forEach(function(entry){
                        var result = filter(entry),
                            user = objects.user_map[String(entry.user_id)],
                            filtered_user = filter( user, 'name', 'image' )
                            ;

                        result.user = filtered_user;
                        result.user.facebook_link = user.service('facebook').data.link;
                        result.user.friend_count = user.service('facebook').internal.friend_count;
                        result.contest = filter( objects.contest_map[String(entry.contest_id)], 'name' );
                        result.page = filter( objects.page_map[String(entry.page_id)], 'name' );
                        results.push(result);
                    });
                    return res.send({items: results, total: total});
                });
            }
        }
    },

    '/report' : {

        get : {
            handler : function(req, res){

                var time = req.param('time') || 'week-1',
                    tzOffset = parseInt(req.param('timezoneOffset', 0), 10),
                    from = req.param('from'),
                    to = req.param('to'),
                    query = {},
                    options ={},
                    model = req.param('model') || 'Entry'
                    ;

                if( this.restrictToUser ) {
                    query.page_id = {$in: req.session.user.manages};
                }

                if( req.param('page_id') && (!this.restrictToUser || ~indexOf(req.session.user.manages, req.param('page_id'))) ){
                    query.page_id = new ObjectId(req.param('page_id'));
                }
                if( req.param('contest_id') ){
                    query.contest_id = new ObjectId(req.param('contest_id'));
                }
                
                // hey now... lets check for the times
                from = new Date(Date.parse(from));
                to = new Date(Date.parse(to));
                
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                
                to.setHours(23);
                to.setMinutes(59);
                to.setSeconds(59);
                
                var diff = +to-from;
                
                if( diff < 4 * DateUtil.DAY ){
                    options.unit = 'Hour';
                    if( diff > 2 * DateUtil.DAY ){
                        options.unitInterval = 2;
                    }
                }
                else if( diff < 1 * DateUtil.MONTH ){
                    options.unit = 'Day';
                }
                else if( diff < 6 * DateUtil.MONTH ){
                    options.unit = 'Week';
                }
                else if( diff < 2 * DateUtil.YEAR ){
                    options.unit = 'Month';
                }
                else {
                    options.unit = 'Year';
                }
                options.interval = options.unit;
                options.length = diff / DateUtil[options.unit.toUpperCase()] + 1;
                options.end = to;
                options.start = from;

                var model = req.param('model') || 'Entry';
                options.timezoneOffset = tzOffset;
                options.query = query;
                options.model = model;

                switch(model){
                    case 'Redeemed Prizes':
                        options.model = "Prize";
                        query.redeemed = true;
                        options.timeField= 'redeemed_time';
                        break;

                    case 'Share':
                        options.sumField = 'visibility';
                        break;
                    
                    case 'Game Shares':
                        options.model = 'Share';
                        query.type = 'share';
                        break;
                    
                    case 'Win Shares':
                        options.model = 'Share';
                        query.type = 'post';
                        break;
                    
                    case 'Game Share Clicks':
                        options.model = 'Pageview';
                        query.src = 'share';
                        break;
                    
                    case 'Win Share Clicks':
                        options.model = 'Pageview';
                        query.src = 'win';
                        break;
                    
                    case 'Share Clicks':
                        options.model = 'Pageview';
                        query.type = 'share';
                        break;
                    
                    case 'Share Clicks (Win)':
                        options.model = 'Pageview';
                        query.type = 'share';
                        query.src = 'win';
                        break;

                    case 'Likes':
                        options.model = 'Share';
                        query.service = 'facebook';
                        query.type = 'like';
                        break;

                    case 'Checkins':
                        options.model = 'Share';
                        query.type = 'facebook';
                        query.type = 'checkin';
                        break;

                    case 'New Users':
                        options.model = 'Entry';
                        options.distinctField = 'user_id';
                        options.distinctFilter = function(results, opts, selector, cb){
                            selector.timestamp.$lt = selector.timestamp.$gte;
                            delete selector.timestamp.$gte;
                            selector.user_id = {$in: results};
                            Bozuko.models.Entry.distinct('user_id', selector, function(error, old){
                                if( error ) return cb(error);
                                return cb(null, results.length - old.length);
                            });
                        };
                        break;

                    case 'Unique Users':
                        options.model = 'Entry';
                        options.distinctField = 'user_id';
                        break;

                    case 'Prize Cost':
                        options.model = 'Prize';
                        query.redeemed = true;
                        options.timeField= 'redeemed_time';
                        options.sumField = 'value';
                        break;

                    case 'Prize':
                    case 'Entry':
                    case 'Play':
                    case 'Optin':
                        break;

                    default:
                        throw "Invalid model";
                }
                
                
                return Report.run( 'interval', options, function(error, results){
                    if( error ){
                        console.error(require('util').inspect(error));
                        return error.send( res );
                    }
                    return res.send( {items: results, unit: options.unit} );
                });
            }
        }
    },

    '/stats' : {
        // lets get a bunch of miscellaneous stats
        get : {
            handler : function(req, res){

                var self = this,
                    reports = {},
                    selector = {},
                    uids = [],
                    contest_id = req.param('contest_id'),
                    page_id = req.param('page_id')
                    ;

                if( self.restrictToUser ){
                    selector.page_id = {$in:req.session.user.manages}
                }
                if( contest_id ) selector.contest_id = new ObjectId(contest_id);
                if( page_id && (!self.restrictToUser || ~indexOf(req.session.user.manages, page_id)) ) selector.page_id = new ObjectId(page_id);

                var total_shares = function(type, cb){
                    var sel = merge({
                        type        :type,
                        service     :'facebook'
                    }, selector);

                    Bozuko.models.Share.count(sel, function(error, count){
                        if( error ) return cb( error );
                        return cb(null, count);
                    });
                }

                return async.parallel(
                    [
                        function distinct_users(cb){
                            // very simple distinct / count function...

                            var sel = merge({}, selector);

                            return Bozuko.models.Entry.collection.distinct('user_id', sel, function(error, user_ids){
                                if( error ) return cb( error );
                                reports.users = user_ids.length;
                                
                                return async.parallel([
                                    function total_male(_cb){
                                        
                                        return Bozuko.models.User.count({gender:'male', _id:{$in:user_ids}}, function(error, count){
                                            if( error ) return _cb( error );
                                            reports.male = count;
                                            return _cb();
                                        });
                                    },
                                    
                                    function total_female(_cb){
                                        return Bozuko.models.User.count({gender:'female', _id:{$in:user_ids}}, function(error, count){
                                            if( error ) return _cb( error );
                                            reports.female = count;
                                            return _cb();
                                        });
                                    }
                                ], function(error){
                                    return cb(error);
                                });
                            });
                        },

                        function total_likes(cb){
                            return total_shares('like', function(error, count){
                                if( error ) return cb(error);
                                reports.likes = count;
                                return cb();
                            });
                        },

                        function total_checkins(cb){
                            return total_shares('checkin', function(error, count){
                                if( error ) return cb(error);
                                reports.checkins = count;
                                return cb();
                            });
                        },

                        function total_wall_posts(cb){
                            var sel = merge({}, selector),
                                split = 100;


                            return Bozuko.models.Share.collection.find(sel, {'visibility':1}, function(error, cursor){
                                if( error ) return cb(error);
                                var i=0, count=0;
                                var do_count = function(){
                                    return cursor.nextObject(function(error, doc){
                                        if( error ) return cb(error);
                                        if( !doc ){
                                            reports.wallposts = count;
                                            return cb();
                                        }
                                        count += doc.visibility;
                                        if( ++i%split === 0 ) return process.nextTick(do_count);
                                        return do_count();
                                    });
                                };
                                return do_count();
                            });
                        },

                        function total_entries(cb){
                            var sel = merge({}, selector);
                            Bozuko.models.Entry.count(sel, function(error, count){
                                if( error ) return cb( error );
                                reports.entries = count;
                                return cb();
                            });
                        },

                        function total_plays(cb){
                            var sel = merge({}, selector);
                            Bozuko.models.Play.count(sel, function(error, count){
                                if( error ) return cb( error );
                                reports.plays = count;
                                return cb();
                            });
                        },

                        function total_wins(cb){
                            var sel = merge({}, selector);
                            Bozuko.models.Prize.count(sel, function(error, count){
                                if( error ) return cb( error );
                                reports.wins = count;
                                return cb();
                            });
                        },

                        function total_redeemed(cb){
                            var sel = merge({redeemed: true}, selector);
                            Bozuko.models.Prize.count(sel, function(error, count){
                                if( error ) return cb( error );
                                reports.redeemed = count;
                                return cb();
                            });
                        },

                        function total_expired(cb){
                            var sel = merge({redeemed: false, expires:{$lt: new Date()} }, selector);
                            Bozuko.models.Prize.count(sel, function(error, count){
                                if( error ) return cb( error );
                                reports.expired = count;
                                return cb();
                            });
                        }
                    ],
                    function return_reports(error){
                        if( error ) return error.send( res );
                        reports.active = reports.wins - reports.redeemed - reports.expired;
                        return res.send( reports );
                    }
                );
            }
        }
    },

    '/pages' : {

        alias : '/pages/:id',

        get : {
            handler : function(req, res){
                // need to get all pages

                var search = req.param('search') || req.param('query');

                var selector = {};

                if( search ) {
                    selector.name = new RegExp('(^|\\s)'+XRegExp.escape(search), "i");
                }

                if( this.restrictToUser ){
                    selector._id = {$in: req.session.user.manages};
                }
                else{
                    if( !req.param('showInactive') ) {
                        selector.active = true;
                    }
                }
                if( req.param('id') && ~indexOf( req.session.user.manages, req.param('id') ) ){
                    selector._id = req.param('id');
                }
                return Bozuko.models.Page.find(selector,{},{
                    limit: req.param('limit')||25,
                    skip: req.param('start')||0,
                    sort:{name:1}
                }, function(error, pages){
                    if( error ) return error.send(res);
                    // get the count too
                    return Bozuko.models.Page.count(selector,function(error, count){
                        if( error ) return error.send(res);
                        // convert pages to json objects
                        var pages_simple = [];
                        return async.forEachSeries( pages, function(page, cb){
                            var p = page.toJSON();
                            return Bozuko.models.Contest.count({page_id: p._id}, function(error, count){
                                if( error ) return cb(error);
                                p.has_contests = count?true:false;
                                pages_simple.push(p);
                                return cb();
                            });
                        }, function(){
                            return res.send({items:pages_simple, total:count});
                        });
                    });
                });
            }
        },

        /* update */
        put : {
            handler : function(req,res){
                var self = this;
                if( this.restrictToUser && !~indexOf( req.session.user.manages, req.param('id') ) ){
                    return Bozuko.error('bozuko/auth').send(res);
                }
                return Bozuko.models.Page.findById( req.param('id'), function(error, page){
                    if( error ) return error.send( res );
                    // else, lets bind the reqest to the page
                    var data = req.body;
                    if( self.restrictToUser ){
                        delete data.active;
                    }
                    delete data.admins;
                    delete data._id;

                    if( page.location && data.location ){
                        if( data.location.lat ){
                            page.location.lat = data.location.lat;
                        }
                        if( data.location.lng ){
                            console.log(page.location.lng);
                            console.log(data.location.lng);
                            page.location.lng = data.location.lng;
                            console.log(page.location.lng);
                        }
                    }
                    delete data.location;
                    page.set( data );

                    /**
                     * need to filter out non-updatable fields
                     */
                    // filter(data)
                    return page.save( function(error){
                        if( error ) return error.send(res);
                        return res.send( {items: [page]} );
                    });
                })
            }
        },

        del : {
            handler : function(req, res){
                // need logic here
                res.send("TODO!");
            }
        }
    },
    
    '/pages/:id/subscribers.csv' : {
        get : {
            handler : function(req, res){
                res.header('Content-Type', 'text/csv');
                res.header('Content-Disposition', 'attachment; filename=Subscribers.csv');
                return Bozuko.models.Optin.getCSV(req.param('id'), res);
            }
        }
    },

    '/page/image' : {
        post : {
            handler : function(req, res){

                var self = this;

                if( !req.form ){
                    return res.sendEncoded({success:false, err:'no form'});
                }

                return req.form.processed( function(err, fields, files){

                    if( err ){
                        return res.sendEncoded({success:false,err:err});
                    }

                    var id = fields['page_id'];
                    if( !id ){
                        return res.sendEncoded({success: false,err:'no page_id'});
                    }

                    if( self.restrictToUser && !~indexOf( req.session.user.manages, id ) ){
                        return res.sendEncoded({success: false,err:'You are not allowed to do that!'});
                    }

                    if( !files['image'] ){
                        return res.sendEncoded({success: false,err:'no image uploaded'});
                    }
                    // lets just save this for now...
                    var file = files['image'];

                    // we need to do a couple things here...

                    if( !~['.png','.jpg','.jpeg','.gif'].indexOf(Path.extname( file.filename ).toLowerCase()) ){
                        return res.sendEncoded({success: false, err:'invalid image type'});
                    }

                    var ext = Path.extname( file.filename ).toLowerCase();
                    if( ext == '.jpg') ext = '.jpeg';
                    var Ext = ext.replace(/\./,'').replace(/^[a-z]/, function(m0){ return m0.toUpperCase();} );

                    // resize as necessary and crop off any extra
                    return GD['open'+Ext]( file.path, function(err, image, path){
                        if( err ){
                            return res.sendEncoded({success: false, err:'Error openning image'});
                        }
                        // lets get the size of this bad boy.
                        var w = image.width,
                            h = image.height;

                        if( w < 50 || h < 50 ){
                            return res.sendEncoded({success: false, err: 'Image is too small'});
                        }
                        // guess it can't really too big, for now...
                        if( w > 1400 || h > 1400 ){
                            return res.sendEncoded({success: false, err: 'Image is too big.'});
                        }

                        var s = Math.min( w, h, 150 ),
                            sw = w > h ? h : w,
                            sh = h > w ? w : h,
                            sx = w > h ? parseInt((w-h)/2,10) : 0,
                            sy = h > w ? parseInt((h-w)/2,10) : 0,
                            img = GD.createTrueColor(s,s);

                        var color = img.colorAllocate(255,255,255);
                        img.filledRectangle(0,0,s,s,color);
                        image.copyResampled(img, 0, 0, sx, sy, s, s, sw, sh);
                        image.saveAlpha(1);
                        var savedPath = file.path.replace(/\..*$/, '_processed.png');
                        return img.savePng(savedPath, 1, function(error){
                            if( error ){
                                return res.sendEncoded( {success: false, err: "error saving the image"} );
                            }

                            var path = '/pages/'+id+'/image/'+Path.basename(savedPath);
                            return s3.put(savedPath, path, {
                                'x-amz-acl':'public-read',
                                'Content-Type':'image/png'
                            }, function(error, url){

                                fs.unlinkSync(file.path);
                                fs.unlinkSync(savedPath);

                                return res.sendEncoded( {success: true, url: url} );
                            });
                        });
                    });


                });
            }
        }
    },

    '/contests' : {

        alias : '/contests/:id',
        /* Read */
        get : {
            handler : function(req, res){
                // need to get all pages
                var page_id = req.param('page_id'),
                    id = req.param('id'),
                    selector = {};

                if( this.restrictToUser ){
                    selector.page_id = {$in: req.session.user.manages};
                }

                if( page_id && (!this.restrictToUser || ~indexOf(req.session.user.manages, page_id)) ) selector['page_id'] = page_id;
                if( id ) selector['_id'] = id;

                return Bozuko.models.Contest.find(selector,{results:0,plays:0},{sort:{active: -1, start:-1}}, function(error, contests){
                    if( error ) return error.send(res);
                    contests.sort(function(a,b){
                        if( a.state=='active' && b.state != 'active' ) return -1;
                        if( b.state=='active' && a.state != 'active' ) return 1;
                        return +b.start-a.start;
                    });

                    var ret = [];

                    return async.forEachSeries( contests,

                        function iterator(contest, cb){
                            var contest_json = contest.toJSON();

                            ret.push(contest_json);

                            Bozuko.models.Entry.count({contest_id:contest._id}, function(error, entry_count){
                                if( error ) return cb(error);
                                contest_json.entry_count = entry_count;

                                return Bozuko.models.Play.count({contest_id:contest._id}, function(error, play_count){
                                    if( error ) return cb(error);
                                    contest_json.play_count = play_count;

                                    if (contest_json.engine_type === 'time') {
                                        var opts = contest.engine_options || {
                                            buffer: 0.001,
                                            lookback_threshold: 0.1,
                                            window_divisor: 0.1,
                                            throwahead_multiplier: 10,
                                            multiplay: true
                                        };
                                        contest_json.window_divisor = opts.window_divisor;
                                        contest_json.throwahead_multiplier = opts.throwahead_multiplier;
                                        contest_json.end_buffer = opts.buffer;
                                        contest_json.lookback_threshold = opts.lookback_threshold;
                                    }

                                    return cb();
                                });

                            });
                        },

                        function done(error){
                            if( error ) return res.send(error);
                            return res.send({items:ret});
                        }
                    );
                });
            }
        },
        /* Create */
        post : {
            handler : function(req, res){
                var data = filter(req.body),
                    prizes = data.prizes,
                    page_id = data.page_id,
                    consolation_prizes = data.consolation_prizes;

                if(this.restrictToUser && !~indexOf(req.session.user.manages, page_id)){
                    return Bozuko.error('bozuko/auth').send(res);
                }
                
                delete data._id;
                delete data.play_cursor;
                delete data.state;
                delete data.total_entries;
                delete data.total_plays;

                Object.keys(data).forEach(function(key){
                    if( data[key] === null ) delete data[key];
                });

                prizes.forEach(function(prize){
                    delete prize._id;
                });

                // weird issue - change page_ids from '' to [];
                if (data.page_ids == '') data.page_ids = [];

                // any other _id things?
                consolation_prizes.forEach(function(prize){
                    delete prize._id;
                });

                if (data.engine_type === 'time') {
                    if (data.window_divisor > 5) data.window_divisor = 5;
                    if (data.window_divisor < 0) data.window_divisor = 0;
                    data.engine_options.window_divisor = data.window_divisor;
                    data.engine_options.throwahead_multiplier = data.throwahead_multiplier;
                    data.engine_options.buffer = data.end_buffer;
                    data.engine_options.lookback_threshold = data.lookback_threshold;
                    data.total_entries = 0;
                    data.total_plays = 0;
                }
                
                if( !data.consolation_config || !data.consolation_config.length ){
                    data.consolation_config = [{enabled: false, who:null, when: null}];
                }
                
                
                // remove unused variables
                delete data.window_divisor;
                delete data.throwahead_multiplier;
                delete data.end_buffer;
                delete data.lookback_threshold;
                var contest = new Bozuko.models.Contest(data);
                return contest.save( function(error){
                    if( error ) return error.send( res );
                    return Bozuko.models.Page.setCodeInfo(page_id, function(err) {
                        if (err) return error.send(res);

                        if( Bozuko.cfg('admin.notifications', false) ) {
                            Bozuko.models.Page.findById( contest.page_id, function(error, page){
                                if( error ) return;
                                Bozuko.require('util/mail').send({
                                    to: 'info@bozuko.com',
                                    subject: 'New Contest Created',
                                    body: [
                                        'Check it out...',
                                        '',
                                        'Page:    '+page.name,
                                        'Contest: '+contest.name
                                    ].join('\n')
                                });
                            });
                        }
                        return res.send({items:[contest]});
                    });


                });
            }
        },
        /* Update */
        put : {
            handler : function(req, res){

                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);

                    var data = filter(req.body);

                    var prizes = data.prizes,
                        entry_config = data.entry_config,
                        consolation_prizes = data.consolation_prizes;

                    delete data.prizes;
                    delete data.consolation_prizes;
                    delete data.state;
                    delete data.entry_config;

                    // most definitely do not want to touch this
                    delete data.play_cursor;
                    delete data.token_cursor;

                    // don't want to update this, will throw an error
                    delete data._id;
                    
                    if( !data.consolation_config || !data.consolation_config.length ){
                        data.consolation_config = [{enabled: false, who:null, when: null}];
                    }

                    if (data.engine_type === 'time') {
                        if (data.window_divisor > 5) data.window_divisor = 5;
                        if (data.window_divisor < 0) data.window_divisor = 0;
                        data.engine_options.window_divisor = data.window_divisor;
                        data.engine_options.throwahead_multiplier = data.throwahead_multiplier;
                        data.engine_options.buffer = data.end_buffer;
                        data.engine_options.lookback_threshold = data.lookback_threshold;
                        data.total_entries = 0;
                        data.total_plays = 0;
                    }
                    // remove unused variables
                    delete data.window_divisor;
                    delete data.throwahead_multiplier;
                    delete data.end_buffer;
                    delete data.lookback_threshold;

                    // weird issue - change page_ids from '' to [];
                    if (data.page_ids == '') data.page_ids = [];

                    for( var p in data ){
                        if( data.hasOwnProperty(p) ){
                            contest.set(p, data[p] );
                        }
                    }

                    prizes.forEach(function(prize, i){
                        var old, doc;
                        if( prize._id && (old = contest.prizes.id(prize._id)) ){
                            doc = old._doc || old;
                            for( var p in prize ){
                                if( prize.hasOwnProperty(p) ){
                                    doc[p] = prize[p];
                                }
                            }
                            prizes[i] = doc;
                        }
                    });

                    consolation_prizes.forEach(function(consolation_prize, i){
                        var old, doc;
                        if( consolation_prize._id && (old = contest.consolation_prizes.id(consolation_prize._id)) ){
                            doc = old._doc;
                            for( var p in consolation_prize ){
                                if( consolation_prize.hasOwnProperty(p) ){
                                    doc[p] = consolation_prize[p];
                                }
                            }
                            consolation_prizes[i] = doc;
                        }
                    });

                    // no clue why i have to do this right now...
                    contest.prizes = [];
                    contest.consolation_prizes = [];
                    contest.entry_config = [];

                    // save existing prizes before adding and removing others
                    return contest.save(function(error){

                        if( error ) return error.send( res );
                        prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.prizes.push(prize);
                        });
                        consolation_prizes.forEach( function(prize){
                            if( !prize._id ) delete prize._id;
                            contest.consolation_prizes.push(prize);
                        });

                        entry_config.forEach( function(config){
                            contest.entry_config.push( config );
                        });

                        return contest.save( function(error){
                            if( error ){
                                console.log(error);
                                return error.send( res );
                            }
                            return Bozuko.models.Contest.findById( contest.id, function(error, contest){
                                if( error ) return error.send( res );
                                return res.send( {items: [contest]} );
                            });
                        });
                    });
                });
            }
        },
        /* Delete */
        del : {
            // delete the record
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ){
                        return res.send({success: true});
                    }
                    return contest.remove(function(error){
                        if( error ) return error.send(res);
                        // success
                        return res.send({success: true});
                    });
                });
            }
        }
    },

    '/contests/:id/winnersReport': {
        get: {
            handler: function(req, res) {
               var self = this;
               var contest_id = req.param('id');
               if (!contest_id) return Bozuko.error('contest/not_found').send(res);
               return Bozuko.models.Contest.findById(contest_id, function(err, contest) {
                   if (err) return err.send(res);
                   if (!contest) return Bozuko.error('contest/not_found', contest_id).send(res);

                   // Allow report generation if this user manages any page of this contest
                   var allowed = false;

                   if (self.restrictToUser) {
                       if(~indexOf(req.session.user.manages, contest.page_id) ){
                           allowed = true;
                       } else {
                           for (var i = 0; i < contest.page_ids.length; i++) {
                               if (~indexOf(req.session.user.manages, contest.page_id[i])) {
                                   allowed = true;
                                   break;
                               }
                           }
                       }
                   } else {
                       allowed = true;
                   }

                   if (!allowed) return Bozuko.error('bozuko/auth').send(res);
                   return winnersReport.stream(contest, res);
               });
            }
        }
    },

    '/contests/:id/report' : {
        get: {
            handler: function(req, res) {
                var self = this;
               var contest_id = req.param('id');
               if (!contest_id) return Bozuko.error('contest/not_found').send(res);
               return Bozuko.models.Contest.findById(contest_id, function(err, contest) {
                   if (err) return err.send(res);
                   if (!contest) return Bozuko.error('contest/not_found', contest_id).send(res);

                   // Allow report generation if this user manages any page of this contest
                   var allowed = false;

                   if (self.restrictToUser) {
                       if(~indexOf(req.session.user.manages, contest.page_id) ){
                           allowed = true;
                       } else {
                           for (var i = 0; i < contest.page_ids.length; i++) {
                               if (~indexOf(req.session.user.manages, contest.page_id[i])) {
                                   allowed = true;
                                   break;
                               }
                           }
                       }
                   } else {
                       allowed = true;
                   }

                   if (!allowed) return Bozuko.error('bozuko/auth').send(res);
                   return reporter.stream(contest, res);
               });
            }
        }
    },

    '/contests/:id/publish' : {
        post : {
            handler : function(req,res){
                
                // this could take a while...
                req.socket.setTimeout(0);
                
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ) return res.send({success: false});
                    return contest.publish(function(error){
                        if( error ) return error.send( res );

                        // activate page if its not active yet
                        Bozuko.models.Page.findById( contest.page_id, function(error, page){
                            if( error ) return;
                            if( !page.active && page.name != 'Admin Demo' ){
                                page.active = true;
                                page.save();
                            }

                            if( Bozuko.cfg('admin.notifications', false) ) Bozuko.require('util/mail').send({
                                to: 'info@bozuko.com',
                                subject: 'Contest Published',
                                body: [
                                    'A new contest was published:',
                                    '',
                                    'Contest Name: '+contest.name,
                                    'Page:         '+page.name
                                ].join('\n')
                            });
                        });

                        return res.send({success: true});
                    });
                });
            }
        }
    },

    '/contests/:id/cancel' : {
        post : {
            handler : function(req,res){
                return Bozuko.models.Contest.findById(req.param('id'), function(error, contest){
                    if( error ) return error.send(res);
                    if( !contest ) return res.send({success: false});
                    return contest.cancel(function(error){
                        if( error ) return error.send( res );
                        return res.send({success: true});
                    });
                });
            }
        }
    },
    
    '/contests/:id/pages' : {
        get : {
            handler : function(req, res){
                // get the contest...
                return Bozuko.models.Contest.findById(req.param('id'), {page_ids:1, page_id:1}, function(error, contest){
                    if( error || !contest ) return (error || new Error('Contest Not Found')).send(res);
                    var ar = contest.page_ids;
                    if( !ar.length ) ar = [contest.page_id];
                    if( !ar.length ) return (new Error('Contest has no Pages')).send(res);
                    return Bozuko.models.Page.find({_id: {$in: ar}}, function(error, pages){
                        if( error || !pages.length ) return (new Error('Contest has no Pages')).send(res);
                        return res.send({
                            items: pages,
                            count: pages.length
                        });
                    });
                });
            }
        }
    },

    '/contest/rules' : {
        post : {
            handler : function(req,res){
                // get the contest
                delete req.body.rules;
                var contest = new Bozuko.models.Contest(req.body);
                return res.send( contest.getOfficialRules() );
            }
        }
    },

    '/s3/*' : {
        get :{
            handler : function(req, res){
                // get the url for this...

                if( !req.params.length ) return res.send('no path specified');
                var path = '/'+req.params[0];
                if( !path ) return res.send('no path specified');
                return res.redirect( s3.client.https( path ) );
            }
        }
    },

    '/blog/feed' : {
        get : {
            handler : function(req, res){
                var url = Bozuko.cfg('blog.feed', 'http://blog.bozuko.com/feed/');
                // lets get this feed...
                return http.request({
                    url: url
                }, function(error, response){
                    if( error ) return error.send(res);
                    var json = require('xml2json').toJson(response,{object:true});
                    var result = {items: json.rss.channel.item, count: json.rss.channel.item.length};
                    return res.send( result );
                });
            }
        }
    },

    '/welcome/:page_id' : {
        get : {

            locals: { layout: false },

            handler : function(req, res){
                var page_id = req.param('page_id');
                // lets get the page

                return Bozuko.models.Page.findById( page_id, function(error, page){
                    if( error ) throw error;
                    if( !page ) throw "No Page";
                    return Bozuko.models.Contest.find({page_id: page_id},{results:0,plays:0},{sort:{active: -1, start:-1}}, function(error, contests){
                        if( error ) throw error;
                        // count active contests
                        var active = 0;
                        contests.forEach(function(contest){
                            if( contest.state == 'active' ) active++;
                        });
                        res.locals.active_count = active;
                        res.locals.contests = contests;
                        res.locals.page = page;
                        
                        var welcome = page.is_enterprise ? 'welcome-enterprise' : 'welcome';
                        
                        return res.render('beta/content/'+welcome);
                    });
                });

            }
        }
    },
    '/howto' : {
        get : {
            locals : {
                title: 'Bozuko - How To',
                layout: 'beta/howto/layout',
                home_link: '#',
                home_title: 'Bozuko How To',
                device: 'desktop',
                styles: [
                    'https://fonts.googleapis.com/css?family=Open+Sans:300italic,400italic,600italic,700italic,800italic,400,800,700,600,300',
                    '/css/desktop/typography.css',
                    '/css/desktop/beta/howto.css'
                ],
                head_scripts :[
                    '/js/jquery/jquery.tools.min-1.2.6.js',
                    '/js/desktop/beta/howto.js'
                ]
            },
            handler : function(req, res){
                return res.render('beta/howto');
            }
        }
    }
};

function getToken(session, forceNew){
    var token;
    if( !session.token || forceNew ){
        session.token = crypto.createHash('sha1')
            .update( session.id + (new Date().getTime()) )
            .digest('hex');
    }
    return session.token;
}

exports.addRoutes = function(module, prefix){

    for( var route in exports.routes ){
        // add this route
        var cfg = merge({},exports.routes[route]);
        var key = prefix+route;

        if( cfg.alias ){
            cfg.alias = prefix+cfg.alias;
        }
        if( cfg.aliases ) cfg.aliases.forEach(function(str,i){
            cfg.aliases[i] = prefix+str;
        });

        module.routes[key] = cfg;
    }
};
