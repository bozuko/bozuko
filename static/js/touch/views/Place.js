Bozuko.view.Place = Ext.extend( Ext.Panel, {
    
    cls: 'place',
    
    layout : 'fit',
    
    scroll : true,
    
    tpl : [
        '<div class="place-info">',
            '<img class="profile-pic" src="https://graph.facebook.com/{id}/picture" />',
            '<h2>{name}</h2>',
            '<tpl if="location.street">',
                '<p class="address">{location.street}<br />{location.city}, {location.state}</p>',
            '</tpl>',
        '</div>',
        '<tpl if="games.length &gt; 0">',
            '<div class="games">',
                '<h2>Available Games</h2>',
                '<div class="game-list">',
                    '<tpl for="games">',
                        '<div class="game game-{id}">',
                            '<img src="{icon}" class="game-icon" />',
                            '<div class="game-body">',
                                '<p class="name">{name}</p>',
                                '<p class="prize-label">You could win:</p>',
                                '<p class="prize">{prize}</p>',
                                '<div class="checkin-and-play-button"></div>',
                            '</div>',
                        '</div>',
                    '</tpl>',
                '</div>',
            '</div>',
        '</tpl>',
        '<tpl if="games.length == 0">',
            '<div class="no-games">',
                '<p>Bummer... this place is not currently registered with Bozuko... ',
                'You should let them know about it!</p>',
                '<div class="send-bozuko-request-button"></div>',
            '</div>',
        '</tpl>'
    ],
    
    
    updatePlace : function(place){
        this.place = place;
        this.update(place);
        this.createButton();
    },
    
    createButton : function(){
        // lets grab the button and make a... button.
        if( this.place.games.length ){
            Ext.each( this.place.games, function(game){
                var btn = this.el.down('.game-'+game.id+' .checkin-and-play-button');
                this.playBtn = new Ext.Button({
                    ui : 'confirm',
                    text : 'Checkin and Play',
                    renderTo: btn,
                    handler : function(){
                        this.playGame(game, this.place);
                    },
                    scope: this
                });
            }, this);
        }
        else{
            this.bozukoRequestButton = new Ext.Button({
                ui : 'decline',
                text : 'Request Bozuko Here',
                renderTo : this.el.down('.send-bozuko-request-button')
            });
        }
    },
    
    playGame : function(game){
        this.fireEvent('playgame', game, this.place);
    }
    
});