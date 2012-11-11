var inherits        = require('util').inherits
  , async           = require('async')
  , ObjectId        = require('mongoose').Types.ObjectId

/**
 * This is a super super super simple hack that is just to capture
 * unique users on contests for now...
 *
 * I do think we could use the event system to capture stats without
 * affecting plays / entries. I was thinking of storing stats in blocks.
 * 
 *  • name of stat
 *  • count
 *  • block unit (day, week, year, total)
 *  • interval ('start-end' or null if no interval)
 *
 * Then we would have a Stat Engine Singleton. It would need to run
 * on only one process. It would run a set of plugins. Plugins would
 * have the following:
 *
 *  • name - stat name key
 *  • events - hash of event name -> handler
 *  • init - function to be called on startup
 *
 * The plugins would exist in their own folder and we could accept
 * a config to the StatEngine.run function that would allow you to
 * enable, disable plugins.
 *
 * For now... this is just a skeleton of an idea.
 * 
 */

var StatsEngine = function(){
    this.plugins = [
        // this would be a loop over files in a directory maybe, just requiring the
        // and each module would be a plugin class.
        // but for now, it will just be hardcoded
        StatsPluginUnique
    ];
    this.instances = {};
    this.listeners = {};
    this.init();
    
};

StatsEngine.prototype.init = function(){
    
    var self = this;
    
    this.plugins.forEach( function(Plugin){
        var plugin = new Plugin(this);
        self.instances[plugin.name] = plugin;
        plugin.init();
        
        Object.keys( plugin.events ).forEach( function(event){
            if( !self.listeners[event] ){
                Bozuko.subscribe(event, function(data){
                    self.handler.call(self, event, data.message);
                });
                self.listeners[event] = [];
            }
            self.listeners[event].push(plugin);
        });
    });
};

StatsEngine.prototype.handler = function( event, data ){
    this.listeners[event].forEach( function(plugin){
        
        /**
         * This would return a an object that would be used
         * to update our stats collection.
         *
         * Maybe something like:
         *
         *  [{object_id: ObjectId, {incremenet: Number}]
         *
         * The object_id would be the _id of the object we are capturing stats for,
         * Page, Contest, ApiKey, etc.
         *
         * Then the stats engine would create / update the according
         * records (minute, hour, month, year, total) + key
         *
         * 
         */
        
        /**
         * In implementation, some of the plugins would need to know
         * the interval they are getting the stat for (unique users over time, etc)
         * and they would have the isInterval flag set to true.
         *
         * In this case, we would need to loop over each interval, calling
         * the handler each time and passing it the specified interval
         *
         * Otherwise, the handler is only called once and the returned operations
         * are applied for each interval
         */
        var interval  = null;
        
        
        
        plugin.events[event].call( plugin, data, interval, function(error, operations){
            
            operations.forEach(function(operation){
                // TODO:
                // perform operations
            });
        });
    });
};

StatsPlugin = function(engine){
    this.engine = engine;
};
StatsPlugin.prototype.name = 'abstract';
StatsPlugin.prototype.events = {};
StatsPlugin.prototype.isInterval = false;
StatsPlugin.prototype.init = function(){};

StatsPlugin.create = function(name, events){
    var Plugin = function(){};
    inherits(Plugin, StatsPlugin);
    Plugin.prototype.name = name;
    Plugin.prototype.events = events;
    return Plugin;
};

var StatsPluginUnique = StatsPlugin.create('unique_entries', {
    
    // Data contains contest_id, page_id, user_id, entry_id
    'contest/entry' : function( data, interval, callback ){
        
        var operations = [];
        
        return async.series([
            
            function unique_per_contest(cb){
                
                var selector = {
                    contest_id  :data.contest_id,
                    user_id     :data.user_id,
                    _id         :{$nin: [data.entry_id]}
                };
                
                Bozuko.models.Entry.findOne(selector, function(error, entry){
                    if( !entry ){
                        
                        operations.push({
                            object_id: data.contest_id,
                            inc: 1
                        });
                        
                        /**
                         * This is a shortcut on the contest itself
                         */
                        return Bozuko.models.Contest.update({
                            _id: new ObjectId(data.contest_id)
                        },{
                            $inc: {unique_users: 1}
                        }, cb);
                    }
                    return cb();
                });
            },
            
            function unique_per_page(cb){
                var selector = {
                    page_id     :data.page_id,
                    user_id     :data.user_id,
                    _id         :{$nin: [data.entry_id]}
                };
                Bozuko.models.Entry.findOne(selector, function(error, entry){
                    if( !entry ){
                        
                        operations.push({
                            object_id: data.page_id,
                            inc: 1
                        });
                        
                        /**
                         * This is a shortcut on the page itself
                         */
                        return Bozuko.models.Page.update({
                            _id: new ObjectId(data.page_id)
                        },{
                            $inc: {unique_users: 1}
                        }, cb);
                    }
                    return cb();
                });
            },
            
            function unique_per_api_key(cb){
                var selector = {
                    apikey_id   :data.apikey_id,
                    user_id     :data.user_id,
                    _id         :{$nin: [data.entry_id]}
                };
                Bozuko.models.Entry.findOne(selector, function(error, entry){
                    if( !entry){
                        
                        operations.push({
                            object_id: data.apikey_id,
                            inc: 1
                        });
                        
                        /**
                         * This is a shortcut on the page itself
                         */
                        return Bozuko.models.Apikey.update({
                            _id: new ObjectId(data.apikey_id)
                        },{
                            $inc: {unique_users: 1}
                        }, cb);
                    }
                    return cb();
                });
            }
            
        ], function return_operations(error){
            if( error ) console.log(error);
            // this is a dummy function for now...
            return callback(null, operations);
        });
    }
});

StatsPluginUnique.prototype._init = function(){
    // lets go through all of our contests and pages
    async.series([
        function update_contests(cb){
            return Bozuko.models.Contest.find({}, {_id: 1}, function(error, contests){
                return async.forEach(contests,function(contest, cb){
                    return Bozuko.models.Entry.distinct('user_id', {contest_id: contest._id}, function(error, users){
                        return Bozuko.models.Contest.update(
                            {_id: contest._id},
                            {$set:{unique_users: users.length}},
                            cb
                        );
                    })
                }, cb);
            });
        },
        
        function update_pages(cb){
            return Bozuko.models.Page.find({}, {_id: 1}, function(error, pages){
                return async.forEach(pages,function(page, cb){
                    return Bozuko.models.Entry.distinct('user_id', {page_id: page._id}, function(error, users){
                        return Bozuko.models.Page.update(
                            {_id: page._id},
                            {$set:{unique_users: users.length}},
                            cb
                        );
                    })
                }, cb);
            });
        },
        
        function update_apikeys(cb){
            return Bozuko.models.Apikey.find({}, {_id: 1}, function(error, keys){
                return async.forEach(keys,function(key, cb){
                    // get all the page ids
                    return Bozuko.models.Page.find({apikey_id: key._id},{_id:1}, function(error, pages){
                        var page_ids = [];
                        pages.forEach(function(p){ page_ids.push(p._id) });
                        return Bozuko.models.Entry.distinct('user_id', {page_id: {$in: page_ids}}, function(error, users){
                            return Bozuko.models.Apikey.update(
                                {_id: key._id},
                                {$set:{unique_users: users.length}},
                                cb
                            );
                        });
                    });
                }, cb);
            });
        }
    ]);
};

var engine;
module.exports = {
    Engine: StatsEngine,
    run: function(){
        engine = new StatsEngine();
        return engine;
    },
    getEngine : function(){
        return engine;
    }
};