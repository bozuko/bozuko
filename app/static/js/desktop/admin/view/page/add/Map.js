Ext.define('Bozuko.view.page.add.Map' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddmap',
    
    initComponent : function(){
        var me = this;
        
        me.addEvents({
            'centerchange': true
        });
        
        me.dockedItems = [{
            layout          :'anchor',
            bodyPadding     :5,
            border          :false,
            items: [{
                xtype           :'textfield',
                name            :'search',
                fieldLabel      :'Find a Facebook Place',
                labelWidth      :160,
                enableKeyEvents :true,
                border          :'0 0 1 0',
                anchor          :'0',
                listeners       :{
                    keyup           :me.onKeyUp,
                    scope           :me
                }
            }]
        }];
        
        me.bufferedSearch = Ext.create('Ext.util.DelayedTask', me.search, me);
        me.callParent( arguments );
    },
    
    // we need to add a google map after this fires
    afterRender : function(){
        var me = this;
        
        me.callParent( arguments );
        me.searchField = this.down('textfield');
        me.geocoder = new google.maps.Geocoder();
        
        me.searchField.setValue('boston, ma');
        me.search();
    },
    
    onKeyUp : function(){
        this.bufferedSearch.delay(500);
    },
    
    search : function(){
        
        var me = this,
            v = this.searchField.getValue();
            
        if( v ) me.geocoder.geocode({address:v}, function(response, status){
            if( response && response.length ){
                if( !me.map ){
                    var options = {
                        center: response[0].geometry.location,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoom: 16
                    };
                    me.map = new google.maps.Map(me.body.dom, options);
                }
                else{
                    me.map.setCenter( response[0].geometry.location );
                }
                // lets fire an event
                me.fireEvent('latlngchange', me.map.getCenter());
            }
        });
    },
    
    getLatLng : function(){
        return this.map.getCenter();
    }
    
});