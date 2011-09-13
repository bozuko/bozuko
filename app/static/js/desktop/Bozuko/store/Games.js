Ext.define('Bozuko.store.Games', {
    
    extend          :'Ext.data.Store',
    
    fields : ['img','title','description','game'],
    
    data : [{
        game: 'slots',
        title: 'Slot Machine',
        img:'/games/slots/slots_icon3.png',
        description: [
            "<p>Players spin a slot machine to win prizes. Three icons in a row and they win!</p>"
        ].join('')
    },{
        game: 'scratch',
        title: 'Scratch Ticket',
        img:'/games/scratch/themes/default/scratch.png',
        description: [
            "<p>Players scratch six positions on a scratch ticket to win prizes. ",
            "If any three positions match they win! </p>"
        ].join('')
    }]
    
}, function(){
    
    Ext.create('Bozuko.store.Games', {
        storeId: 'games'
    });
    
});