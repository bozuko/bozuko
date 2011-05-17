module.exports = function locals(){
    return function locals(req, res, next){
        console.log('');
        console.log('******* DEBUG **********');
        console.log('Query:', req.query);
        console.log('Body:', req.body);
        console.log('***** END DEBUG ********')
        console.log('');
        next();
    }
};