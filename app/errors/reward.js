module.exports = {
    not_enough_bucks: 'This user does not have enough bucks to claim the prize',
    no_more  : function(){
        return "Sorry, there are no more "+this.data.name+" remaining.";
    }
};