module.exports = function poweredby(){
    return function locals(req, res, next){
        res.header('P3P', 'CP="NOI ADM DEV COM NAV OUR STP"');
        res.header('X-Powered-By', 'Bozuko, Express, Connect, Node, Javascript, v8, Punk Rock Fridays, Coffee, Cigarettes, Blood, Sweat, Tears...');
        next();
    }
};