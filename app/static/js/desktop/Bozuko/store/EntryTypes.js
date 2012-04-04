Ext.define('Bozuko.store.EntryTypes', {
    
    extend          :'Ext.data.Store',
    
    fields : ['img','title','description','type','options','hidden'],
        
    data : [{
        type: 'facebook/like',
        title: 'Facebook Like',
        hidden: false,
        img:'/images/desktop/app/builder/entry/facebook-like-fit.png',
        description: [
            '<p>A player must first Facebook "Like" your business on in order to play the game.  The Bozuko application makes Liking your business easy by presenting the user an integrated Like button on your game page.</p>'
        ].join('')
    },{
        type: 'facebook/checkin',
        title: 'Facebook Check in',
        hidden: false,
        img:'/images/desktop/app/builder/entry/facebook-checkin-fit.png',
        description: [
            '<p>A player must be present at your location and all entries post to player\'s walls.  Using the Bozuko app, players can "check in and play" with a single button.</p>'
        ].join('')
    },{
        type: 'facebook/likecheckin',
        title: 'Facebook Like + Check in',
        hidden: false,
        img:'/images/desktop/app/builder/entry/facebook-checkin-fit.png',
        description: [
            '<p>A player must like your page and be present at your location and all entries post to player\'s walls.  Using the Bozuko app, players can "check in and play" with a single button.</p>'
        ].join('')
    },{
        type: 'bozuko/checkin',
        title: 'Bozuko Check in',
        hidden: true,
        img:'/images/desktop/app/builder/entry/bozuko-checkin-fit.png',
        description: [
            "<p>A user must be at your location to play the game.</p>"
        ].join('')
    },{
        type: 'bozuko/optin',
        title: 'Newsletter Subscribe',
        hidden: true,
        img:'/images/desktop/app/builder/entry/email-subscribe.png',
        description: [
            "<p>A user must subscribe to your newsletter to play. You must specify your email privacy policy in the Official Rules.</p>"
        ].join('')
    },{
        type: 'bozuko/nothing',
        title: 'No Requirement',
        hidden: true,
        img:'/images/desktop/app/builder/entry/bozuko-play-fit.png',
        description: [
            "<p>There is no requirement on players outside of play frequency.</p>"
        ].join('')
    }]
    
}, function(){
    
    Ext.create('Bozuko.store.EntryTypes', {
        storeId: 'entry-types'
    });
    
});