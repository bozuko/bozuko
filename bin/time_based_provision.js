process.env.NODE_ENV='playground';
var bozuko = require('./bozuko/app/bozuko');

var start = new Date();
var end = new Date();
var day = 1000*60*60*24;
end.setTime(start.getTime()+day);
var page_id = '4e2d89fd721fd84c6c0000ca';

var contest = new Bozuko.models.Contest(
{
    page_id: page_id,
    engine_type: 'time',
    game: 'slots',
    game_config: {
        theme: 'default'
    },
    entry_config: [{
        type: "facebook/like",
        tokens: 3,
        duration: 0
    }],
    start: start,
    end: end,
    free_play_pct: 10
    
});
contest.prizes.push({
    name: 'DBC $10 giftcard',
    value: '0',
    description: 'Gonna create some sick desynes fer you',
    details: 'Don\'t worry, you won\'t make money off this',
    instructions: 'Check yer email fool!',
    total: 1000,
    won: 0,
    redeemed: 0,
    is_email: false
});

contest.save(function(err) {
    contest.generateResults(function(err) {
        console.log("results generated");
        process.exit();
    });
});