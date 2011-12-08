var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Services = require('./plugins/services'),
    Native = require('./plugins/native'),
    crypto = require('crypto'),
    Phone = require('./embedded/user/phone'),
    Reward = require('./embedded/user/reward'),
    XRegExp = Bozuko.require('util/xregexp'),
    async = require('async'),
    merge = Bozuko.require('util/object').merge,
    indexOf = Bozuko.require('util/object').indexOf,
    httpsUrl = Bozuko.require('util/functions').httpsUrl,
    DateUtil = Bozuko.require('util/date')
    ;

var safe = {w:2, wtimeout: 5000};
var User = module.exports = new Schema({
    name                :{type:String, index: true},
    phones              :[Phone],
    token               :{type:String, index: true},
    salt                :{type:Number},
    challenge           :{type:Number},
    first_name          :{type:String, index: true},
    last_name           :{type:String, index: true},
    image               :{type:String, get: httpsUrl},
    gender              :{type:String},
    suspect             :{type:Boolean},
    blocked             :{type:Boolean, default: false},
    allowed             :{type:Boolean, default: false},
    email               :{type:String, index: true},
    user_email          :{type:Boolean, default: false},
    sign_up_date        :{type:Date, default: Date.now},
    favorites           :[ObjectId],
    last_internal_update:{type:Date},
    can_manage_pages    :{type:Boolean},
    last_viewed_page    :{type:ObjectId},
    manages             :[ObjectId],
    bucks               :{type:Number, default: 0},
    rewards             :[Reward]
}, {safe: safe});

User.plugin(Services);
User.plugin(Native);

User.pre('save', function(next) {
    if (!this.challenge) {
        this.challenge = Math.floor(Math.random()*100000);
    }
    if (!this.token) {
        return create_token(this, 1, next);
    }
    return next();
});

User.method('claimReward', function(reward, callback) {
    var self = this;
    return reward.claim(this, function(err) {
        if (err) return callback(err);

        var embedded_reward = {
            name: reward.name,
            reward_id: reward._id,
            bucks: reward.bucks,
            timestamp: new Date()
        };

        return Bozuko.models.User.findAndModify(
            {_id: self._id, bucks: {$gte: reward.bucks}}, [],
            {$inc: {bucks: -1*reward.bucks}, $push: {rewards: embedded_reward}},
            {new: true, safe: safe},
            function(err, user) {
                if (err) return callback(err);
                if (!user) return callback(Bozuko.error('reward/not_enough_bucks'));
                return callback(null, user);
            }
        );
    });
});

User.method('isBlocked', function(){
    return this.blocked && !this.allowed;
});

User.method('canManage', function(page, callback){
    var self = this;
    if( typeof page === 'object' && page.isAdmin && typeof page.isAdmin === 'function' ){
        return page.isAdmin( this, callback );
    }
    if( typeof page === 'string' ){
        return Bozuko.models.Page.findOne({admins: self._id, _id: page}, function(error, page){
            if( error ) return callback( error );
            return callback( null, page ? true : false );
        });
    }
    return callback( new Error('page parameter is invalid - must be a Page model, or a string id'));
});

User.method('like', function(page, callback){
    var self = this;
    if( typeof page != 'string' ){
        try{
            page = page.service('facebook').sid;
        }catch(e){
            callback( Bozuko.error('user/like_bad_page') );
        }
    }
    // okay, this should be a facebook string
    Bozuko.service('facebook').like({user: self, object_id: page}, callback);
});

User.method('likes', function(page){
    // check to see if the user already likes a page
    var self = this;
    if( typeof page != 'string' ){
        try{
            page = page.service('facebook').sid;
        }catch(e){
            console.log(e);
            throw new Error('where is this bad page coming from');
        }
    }
    var fb = self.service('facebook');
    if( !fb || !fb.internal ){
        return false;
    }
    var likes = fb.internal.likes || [];
    return !!~likes.indexOf( page );
});

User.method('updateInternals', function(force, callback){

    if( typeof force === 'function' ){
        callback = force;
        force = false;
    }
    if (Bozuko.config.test_mode) return callback(null);
    var self = this;

    var now = new Date();
    if( !force && self.last_internal_update && +now -self.last_internal_update < (1000 * 60 * 60) ){
        return callback(null);
    }
    if( !self.service('facebook')) return callback( );
    return Bozuko.service('facebook').user({user:self, fields:'likes,friends'}, function(error, result){
        if( error ) return callback( error );
        var likes = [], friends = [];
        try{
            var data = result.data.likes.data;
            data.forEach(function(object){
                likes.push(object.id);
            });
        }catch(e){
            likes = [];
        }
        try{
            var data = result.data.friends.data;
            data.forEach(function(object){
                friends.push(object);
            });
        }catch(e){
            friends = [];
        }
        if( !self.service('facebook').internal ){
            self.service('facebook').internal = {};
        }

        self.service('facebook').internal.likes = likes;
        self.service('facebook').internal.friends = friends;
        self.service('facebook').internal.friend_count = friends.length;
        self.service('facebook').commit('internal');
        self.last_internal_update = new Date();

        // Block users with less than configured min friends
        var min_friends = Bozuko.cfg('user.block.min_friends',4);
        if (self.service('facebook').internal.friend_count < min_friends && !self.allowed) {
            self.blocked = true;
        }
        return self.save(function(err) {
            if (err) {
                console.error("Error saving user: "+self.name+" "+self._id);
                return callback(err);
            }
            if (self.blocked && !self.allowed) {
                console.error("Fraudulent user blocked: "+self.name+" "+self._id);
                return callback(Bozuko.error('user/blocked'));
            }

            return callback(null);
        });
    });
});

User.method('updateLikes', function(callback){
    var self = this;
    if( !self.service('facebook')) return callback( Bozuko.error('user/no_facebook') );
    return Bozuko.service('facebook').user_favorites({user:self}, function(error, result){
        if( error ) return callback( error );
        var likes = [];
        try{
            var data = result.data.likes.data;
            data.forEach(function(object){
                likes.push(object.id);
            });
        }catch(e){
            likes = [];
        }
        var commit = true;
        if( !self.service('facebook').internal ){
            self.service('facebook').internal = {};
            commit = false;
        }
        self.service('facebook').internal.likes = likes;
        if( commit ) self.commit('services');
        return self.save(callback);
    });
});

User.method('getManagedPages', function(){
    // callback is the last argument
    var self = this,
        args = [].slice.apply(arguments),
        fnArgs = [], arg,
        param, params = ['selector', 'fields', 'options'],
        callback = args.pop(),
        selector = {admins:self._id}
        ;

    while( args.length && (arg = args.shift()) && params.length && (param = params.shift()) ){

        switch( param ){
            case 'selector':
                fnArgs.push( merge( selector, arg ) );
                console.log(fnArgs);
                break;
            default:
                fnArgs.push( arg );
        }
    }

    fnArgs.push( callback );
    Bozuko.models.Page.find.apply( Bozuko.models.Page, fnArgs );
});

User.method('getPrizes', function(options, callback){

    options = options || {};

    var self    = this,
        skip    = options.skip || options.start || options.offset || 0,
        limit   = options.limit || 25,
        state   = options.state || null,
        sort    = options.sort || 'timestamp',
        dir     = parseInt(options.dir || -1, 10),
        search  = options.search || false,
        query   = options.query || {}
        ;

    query.user_id = self._id;

    if( state ){

        var states = Array.isArray(state) ? state : state.split(','),
            $or = [];

        states.forEach(function(state){ switch(state){
            case 'active':
                $or.push({
                    redeemed: false,
                    expires: {$gt: new Date}
                });
                break;
            case 'redeemed':
                $or.push({
                    redeemed: true
                });
                break;
            case 'expired':
                $or.push({
                    redeemed: false,
                    expires: {$lte: new Date}
                });
                break;
        }});

        if( $or.length ){
            query.$or = $or;
        }
    }

    if( search ) {
        var searcher = [{
            name : new RegExp('(^|\\s)'+XRegExp.escape(search), "i")
        },{
            page_name: new RegExp('(^|\\s)'+XRegExp.escape(search), "i")
        }];
        if( query.$or ){

            var $or = query.$or,
                $newOr = [];

            $or.forEach(function(conditions){
                searcher.forEach(function(searchConditions){
                    var o = {};
                    for( var i in conditions ){
                        if( conditions.hasOwnProperty(i)) o[i] = conditions[i];
                    }
                    for( var i in searchConditions ){
                        if( searchConditions.hasOwnProperty(i)) o[i] = searchConditions[i];
                    }
                    $newOr.push(o);
                });
            });
            query.$or = $newOr;
        }
        else{
            query.$or = searcher;
        }

    }

    var opts = {
        skip            :skip,
        limit           :limit
    };

    opts.sort = {};
    opts.sort[sort] = dir;

    console.log(query);

    // first lets get the count
    return Bozuko.models.Prize.count( query, function(error, total){
        if( error ) return callback( error );
        if( options.countOnly ){
            return callback( null, total );
        }
        return Bozuko.models.Prize.find( query, options.fields || {}, opts, function(error, prizes){
            if( error ) return callback( error );
            if( !options.loadPage ) return callback( null, prizes, total, opts );
            // we want to load all the page information as well
            var page_ids = [];
            prizes.forEach(function(prize){
                page_ids.push(prize.page_id);
            });
            return Bozuko.models.Page.find({_id: {$in: page_ids}}, function(error, pages){
                if( error ) return callback( error );
                // setup pages to be a map
                var page_map={};
                return async.forEach(pages, function(page, cb){
                    page_map[String(page._id)] = page;
                    return cb();
                }, function(error){
                    if( error ) return callback( error );
                    prizes.forEach(function(prize,i){
                        prizes[i].page = page_map[String(prize.page_id)];
                    });
                    return callback( null, prizes, total, opts );
                });
            });
        });
    });
});

User.method('getFriendsOnBozuko', function(options, callback){

    options = merge({
        start       :0,
        limit       :2,
        random      :false,
        sort        :'name',
        search      :false,
        full        :false,
        dir         :-1
    },options);

    var self        = this,
        friend_ids  = [],
        total       = 0,
        opts        = {sort:{}},
        fb_friends  = self.service('facebook').internal.friends;

    opts.sort[options.sort] = options.dir;
    if( !options.random ){
        opts.limit = options.limit;
        opts.skip = options.start;
    }

    if( !fb_friends.length ){
        return callback(null, [], 0);
    }

    var tmp = [];
    fb_friends.forEach(function(fb_friend){
        tmp.push(String(fb_friend.id));
    });

    var query = {
        'services.name':'facebook',
        'services.sid':{$in: tmp},
        $or: [{blocked: {$exists:false}, allowed:{$exists:false}}, {blocked: false}, {allowed: true}]
    };

    if( options.search ){
        query['name'] = new RegExp('(^|\\s)'+XRegExp.escape(options.search), "i");
    }

    // lets get the total
    return Bozuko.models.User.count(query, function(error, total){

        if( error ) return callback( error );

        // now we need to get the ids that are in our db
        return Bozuko.models.User.find(query, {'_id':1}, opts, function(error, friends){

            if( error ) return callback(error);

            if( options.random ) while( friends.length > 0 && friend_ids.length < options.limit){
                var i = Math.round(Math.random()*(friends.length-1));
                friend_ids.push(friends.splice(i,1)[0]._id);
            }

            else{
                friends.foreEach(function(friend){
                    friend_ids.push(friend._id);
                });
            }

            var fields = {};
            if( !options.full ) fields = {
                'services.internal.friends':0,
                'services.internal.likes':0,
                'services.auth':0,
                'services.data':0,
                'phones': 0,
                'token': 0,
                'salt' :0,
                'challenge':0,
                'can_manage_pages':0,
                'allowed':0,
                'blocked':0
            };

            return Bozuko.models.User.find({_id:{$in:friend_ids}}, fields, function(error, friends){
                if( error ) return callback(error);
                if( options.random ){
                    friends.sort(function(){ return -1 + (Math.random()*2) });
                }
                else{
                    friends.sort(function(a,b){
                        return indexOf(a._id, friend_ids) - indexOf(b._id, friend_ids);
                    });
                }
                return callback(null, friends, total);
            });
        });
    });
});

User.method('getStatistics', function(options, callback){

    if( !callback ){
        callback = options;
        options = {};
    }

    options = options || {};
    // lets stat this dude up.
    var stats={},
        self=this;

    async.series([

        function total_entries(cb){
            if( options.entries === false ) return cb();
            return Bozuko.models.Entry.count({user_id: self._id}, function(error, count){
                if( error ) return cb(error);
                stats.entries = count;
                return cb();
            });
        },

        function total_plays(cb){
            if( options.plays === false ) return cb();
            return Bozuko.models.Play.count({user_id: self._id}, function(error, count){
                if( error ) return cb(error);
                stats.plays = count;
                return cb();
            });
        },

        function total_wins(cb){
            if( options.wins === false ) return cb();
            return Bozuko.models.Prize.count({user_id: self._id}, function(error, count){
                if( error ) return cb(error);
                stats.wins = count;
                return cb();
            });
        },

        function total_redeemed(cb){
            if( options.redeemed === false ) return cb();
            return Bozuko.models.Prize.count({user_id: self._id, redeemed: true}, function(error, count){
                if( error ) return cb(error);
                stats.redeemed = count;
                return cb();
            });
        }

    ],  function finish(error){
        if( error ) return callback(error);
        return callback(null, stats);
    });
});

User.static('updateFacebookLikes', function(ids, callback){
    if( !Array.isArray(ids) ) ids = [ids];
    Bozuko.models.User.findByService('facebook', ids, function(error, users){
        if( error ) callback(error);
        async.forEachSeries( users, function(user, cb){
            // grab their likes
            return user.updateLikes( cb );
        }, function(error){
            if(error) return callback(error);
            return callback(null, true);
        });
    });
});

User.static('createFromServiceObject', function(user, callback){
    var id = user.id;
    var service = user.service;
    var data = user.data;
    delete user.data;
    delete user.id;
    delete user.service;
    var u = new Bozuko.models.User();
    Object.keys(user).forEach(function(prop){
        u.set(prop, user[prop]);
    });
    u.service( service, id, null, data);
    u.save( function(error){
        if( error ){
            return callback( error );
        }
        return Bozuko.models.User.findById(u.id, callback);
    });
});

User.static('addOrModify', function(user, phone, callback) {
    var q;
    var service_id = {'services.name':user.service,'services.sid':user.id};
    q = {
        $or:[
            {email:user.email},
            service_id
        ]
    };

    Bozuko.models.User.findOne(q, function(err, u){
        if (err) return callback(err);

        var isNew = false;

        if( !u ){
            u = new Bozuko.models.User();
            isNew = true;
        }

        u.name = user.name;
        u.first_name = user.first_name;
        u.last_name = user.last_name;
        u.image = user.image;
        // do not overwrite a user specified email
        if( !user.user_email ) u.email = user.email;
        u.gender = user.gender;

        if (phone) {
            var result = u.verify_phone(phone);
            if (result === 'new') {
                console.log("New Phone added: "+JSON.stringify(phone)+" for facebook id: "+service_id);
                u.phones.push(phone);
            } else if (result === 'mismatch') {
                return callback(Bozuko.error('auth/mobile'));
            }
        }

        u.service(user.service, user.id, user.token, user.data);
        return u.save(function(err) {
            if (err) return callback(err);
            return callback(null, u);
        });
    });
});

User.method('verify_phone', function(phone) {
        var self = this, found = false, mismatch=false;
        for(var i=0; i<this.phones.length && !found && !mismatch; i++){
            var p = this.phones[i];
            if (p.type === phone.type && p.unique_id === phone.unique_id) {
                found =true;
            } else if (p.type !== phone.type && p.unique_id === phone.unique_id) {
                // udid does not match the saved phone type
                mismatch = true;
            }
        }
        if(mismatch) return 'mismatch';
        if(found) return 'match';
        return 'new';
});

function create_token(user, salt, next) {
    var hmac = crypto.createHmac('sha512', Bozuko.config.key);
    var token = hmac.update(user.name+salt).digest('hex');
    Bozuko.models.User.findOne({token: token}, function(err, u) {
        if (err) return next(err);
        if (!u) {
            user.token = token;
            user.salt = salt;
            return next();
        }
        // We've got a collision.
        return create_token(user, salt+1, next);
    });
};
