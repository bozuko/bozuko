module.exports = function() {
    var week = 1000*60*60*24*7;
    var start = new Date();
    var end = new Date(start.getTime()+20*week);

    var contest = new Bozuko.models.Contest({
        engine_type: 'time',
        game: 'slots',
        engine_options: {
            multiplay: false
        },
        game_config: {
            theme: 'default'
        },
        entry_config: [{
            type: "facebook/checkin",
            tokens: 1,
            duration: 0
        }],
        start: start,
        end: end,
        free_play_pct: 0,
        prizes: [{
            name: 'stuff',
            value: 1,
            total: 20, 
            distribution: 'interval' 
        }]
    });
    return contest;
};
