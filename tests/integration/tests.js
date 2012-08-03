process.env.NODE_ENV='test';

var express         = require('express')
  , async           = require('async')
  , http            = require('http')
  , Bozuko          = require('../../app/bozuko')
  , assert          = require('assert')
  , merge           = Bozuko.require('util/object').merge
  , apikey          = null
  , private_headers = null
  , state           = {}
  , ok              = {status: 200, headers: {'Content-Type': 'application/json; charset=utf-8'}}
  ;


assert.response = function(test, server, req, res, callback){
    var client = http.createClient(Bozuko.config.server.port);

    // Issue request
    var timer,
    method = req.method || 'GET',
    status = res.status || res.statusCode,
    data = req.data || req.body,
    requestTimeout = req.timeout || 10000;
    
    if(data && !(data instanceof String) ){
        if(!req.headers) req.headers={};
        req.headers["content-type"] = 'application/json';
        data = JSON.stringify(data);
    }

    var request = client.request(method, req.url, req.headers);

    // Timeout
    if (requestTimeout) {
        timer = setTimeout(function(){
            test.fail('Request timed out after ' + requestTimeout + 'ms.');
        }, requestTimeout);
    }
    
    
    if (data) request.write(data);
    request.on('response', function(response){
        response.body = '';
        response.setEncoding('utf8');
        response.on('data', function(chunk){ response.body += chunk; });
        response.on('end', function(){
            if (timer) clearTimeout(timer);

            // Assert response body
            if (res.body !== undefined) {
                var eql = res.body instanceof RegExp
                    ? res.body.test(response.body) : res.body === response.body;
                test.ok(eql);
            }

            // Assert response status
            if (typeof status === 'number') {
                test.equal(response.statusCode, status);
            }

            // Assert response headers
            if (res.headers) {
                var keys = Object.keys(res.headers);
                for (var i = 0, len = keys.length; i < len; ++i) {
                    var name = keys[i],
                    actual = response.headers[name.toLowerCase()],
                    expected = res.headers[name],
                    eql = expected instanceof RegExp
                        ? expected.test(actual)
                        : expected == actual;
                    test.ok(eql);
                }
            }

            // Callback
            callback(response);
        });
    });
    request.end();
};

function emptyCollection(name) {
    return function(callback){
        Bozuko.models[name].remove(function(){callback(null, '');});
    };
}

function cleanup(callback) {
    var e = emptyCollection;
    async.parallel([e('User'), e('Entry'), e('Contest'), e('Page'), e('Checkin'), e('Play'), e('Prize'),
        e('Result'), e('Apikey')], callback);
}

function createKey(callback){
    
    apikey = new Bozuko.models.Apikey({name:'test'});
    apikey.save( function(error){
        if(error) throw error;
        private_headers = {
            bozuko_api_key      :apikey.key,
            bozuko_api_secret   :apikey.secret
        };
        callback();
    });
}


exports["Setup"] = function(test){
    if( !Bozuko.app ){
        Bozuko.getApp().listen(Bozuko.getConfig().server.port);
    }
    var log = console.log;
    console.log = function(){
        var e = new Error();
        //log.call(console, e.stack);
        return log.apply(console, arguments);
    };
    async.series([
        cleanup,
        createKey
    ], function(err, res) {
        if (err) throw new Error("setup error");
        test.done();
    });
};

/*********************************************************************
 * Page Tests
 *********************************************************************/

exports["Page PUT - no facebook id"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/page',
            method              :'put',
            headers             :private_headers,
            data                :{
                // facebook_id         :'223851717629478'
            }
        },
        ok,
        function(res) {
            var page_save_result = JSON.parse(res.body);
            test.equal(page_save_result.success, false, "Create page - no fb id - !success");
            test.done();
        });
};

exports["Page PUT - Valid"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/page',
            method              :'put',
            headers             :private_headers,
            data                :{
                facebook_id         :'223851717629478',
                name                :'Test'
            }
        },
        ok,
        function(res) {
            var page_save_result = JSON.parse(res.body);
            test.equal(page_save_result.success, true, "Create page - success");
            test.equal(page_save_result.page.name, "Test", "Create page - success");
            test.done();
            state.page = page_save_result.page;
        });
};

exports["Page PUT - Duplicate FB ID"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/page',
            method              :'put',
            headers             :private_headers,
            data                :{
                facebook_id         :'223851717629478'
            }
        },
        ok,
        function(res) {
            var page_save_result = JSON.parse(res.body);
            test.equal(page_save_result.success, false, "Create page fail - duplicate FB ID");
            test.done();
        });
};

exports["Page POST - Update Name"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :state.page.links.page,
            method              :'post',
            headers             :private_headers,
            data                :{
                name                :'BBBBB'
            }
        },
        ok,
        function(res) {
            var page_save_result = JSON.parse(res.body);
            test.equal(page_save_result.success, true);
            test.equal(page_save_result.page.name, 'BBBBB');
            test.done();
        });
};

exports["Page POST - Update Facebook Page"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :state.page.links.page,
            method              :'post',
            headers             :private_headers,
            data                :{
                facebook_id         :'196706993784692'
            }
        },
        ok,
        function(res) {
            var page_save_result = JSON.parse(res.body);
            //console.log(page_save_result);
            test.equal(page_save_result.success, true);
            test.equal(page_save_result.page.facebook_page, 'http://www.facebook.com/BozukoTestPage');
            test.done();
        });
};

exports["Pages GET - Test getting the page"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/pages',
            method              :'get',
            headers             :private_headers
        },
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            test.equal(result.pages instanceof Array && result.pages.length === 1, true);
            test.done();
        });
};

/*********************************************************************
 * Game Tests
 *********************************************************************/

exports["Game PUT - Missing fields"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/game',
            method              :'put',
            headers             :private_headers,
            data                :{
                page_id             :state.page.id
            }
        },
        ok,
        function(res) {
            var game_save_result = JSON.parse(res.body);
            test.equal(game_save_result.success, false, "Create game - failure");
            ['start','end','prizes'].forEach(function(k){
                test.equal(game_save_result.errors[k], 'This field is required', "Expected required error - "+k);
            });
            test.done();
        });
};

exports["Game PUT - Valid"] = function(test) {
    token = assert.token;
    assert.response(test, Bozuko.app,
        {
            url                 :'/game',
            method              :'put',
            headers             :private_headers,
            data                :{
                start               :new Date().toISOString(),
                end                 :new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
                page_id             :state.page.id,
                prizes              :[{
                    name                :'Prize 1',
                    quantity            :20
                }]
            }
        },
        ok,
        function(res) {
            var game_save_result = JSON.parse(res.body);
            test.equal(game_save_result.success, true, "Create game - success");
            state.game = game_save_result.game;
            test.done();
        });
};

exports["Game POST - Valid"] = function(test) {
    var prizes = state.game.prizes;
    prizes[0].description = 'Cool prize!';
    prizes[1] = {
        name                :'Prize 2',
        quantity            :30
    };
    prizes = prizes.reverse();
    assert.response(test, Bozuko.app,
        {
            url                 :state.game.links.game,
            method              :'post',
            headers             :private_headers,
            data                :{
                name                :'Updated Name',
                prizes              :prizes
            }
        },
        ok,
        function(res) {
            var game_save_result = JSON.parse(res.body);
            test.equal(game_save_result.success, true, "Update game - success");
            test.equal(game_save_result.game.name,'Updated Name');
            state.game = game_save_result.game;
            test.done();
        });
};

exports["Game POST - Error, new prize missing required field"] = function(test) {
    var prizes = state.game.prizes.slice(0);
    prizes[0].description = 'Cool prize!';
    prizes[1] = {
        name                :'Prize 2'
    };
    prizes[2] = {
        name                :'Prize 3',
        quantity            :30
    };
    prizes = prizes.reverse();
    assert.response(test, Bozuko.app,
        {
            url                 :state.game.links.game,
            method              :'post',
            headers             :private_headers,
            data                :{
                name                :'Updated Name',
                prizes              :prizes
            }
        },
        ok,
        function(res) {
            var game_save_result = JSON.parse(res.body);
            test.equal(game_save_result.success, false, "Update game - error");
            test.equal(game_save_result.errors.prizes[0], null,'no errors for prize 0');
            test.equal(!!game_save_result.errors.prizes[1].quantity, true,'error for prize 1 - no quantity');
            test.equal(game_save_result.errors.prizes[2], null,'no errors for prize 2');
            test.done();
        });
};

exports["Game POST - Remove Prize"] = function(test) {
    
    var prizes = state.game.prizes.slice(0);
    prizes.shift();
    prizes[0].name = "new name";
    
    assert.response(test, Bozuko.app,
        {
            url                 :state.game.links.game,
            method              :'post',
            headers             :private_headers,
            data                :{
                name                :'Updated Name',
                prizes              :prizes
            }
        },
        ok,
        function(res) {
            var game_save_result = JSON.parse(res.body);
            test.equal(game_save_result.success, true, "Update game - success");
            test.equal(game_save_result.game.name,'Updated Name');
            test.done();
        });
};


exports["Page Games GET - Test getting games"] = function(test) {
    
    assert.response(test, Bozuko.app,
        {
            url                 :state.page.links.page_games,
            method              :'get',
            headers             :private_headers
        },
        ok,
        function(res) {
            var result = JSON.parse(res.body);
            test.equal(result.games instanceof Array, true, "Get list of games");
            test.done();
        });
};

exports["Destroy"] = function(test){
    Bozuko.app.close();
    test.done();
    setTimeout(function(){ process.exit(0); }, 10);
};