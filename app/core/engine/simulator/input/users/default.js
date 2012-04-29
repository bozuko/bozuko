module.exports = function() {
    var user = new Bozuko.models.User(
    {
        name: 'Charlie Sheen',
        first_name: 'Charlie',
        last_name: 'Sheen',
        email: 'bozukob@gmail.com',
        token: 'dfasaa33345353453543',
        gender: 'male'
    });
    return user;
};
