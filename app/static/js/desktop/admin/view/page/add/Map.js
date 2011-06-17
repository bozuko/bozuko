Ext.define('Bozuko.view.page.add.Map' ,{
    
    extend          :'Ext.panel.Panel',
    alias           :'widget.pageaddmap',
    
    markerTpl:[
        '<div style="width: 300px">',
            '<img style="margin: 0 10px 10px 0; float:left;" src="{image}&type=square" height="50" />',
            '<div class="name" style="font-weight: bold;">{name}</div>',
            '<div class="category">{category}</div>',
            '<div style="text-align:left"><a style="font-weight: bold;" href="javascript:;">Select this Place</a></div>',
        '</div>'
    ],
    
    initComponent : function(){
        var me = this;
        
        me.addEvents({
            'centerchange': true,
            'selectplace': true
        });
        
        me.dockedItems = [{
            layout          :'anchor',
            bodyPadding     :5,
            border          :false,
            items: [{
                xtype           :'textfield',
                name            :'search',
                fieldLabel      :'Search by Location',
                labelWidth      :180,
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
        me.bufferedChange = Ext.create('Ext.util.DelayedTask', me.latLngChange, me);
        
        me.store.on('load', me.updateMap, me );
        me.callParent( arguments );
        
        me.markerTpl = new Ext.XTemplate(me.markerTpl);
        
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
                    google.maps.event.addListener(me.map, 'center_changed', function(){
                        me.bufferedChange.delay(500);
                    });
                }
                else{
                    me.map.setCenter( response[0].geometry.location );
                }
                // lets fire an event
                me.fireEvent('latlngchange', me.map.getCenter());
            }
        });
    },
    
    latLngChange : function(){
        this.fireEvent('latlngchange', this.map.getCenter());
    },
    
    getLatLng : function(){
        return this.map.getCenter();
    },
    
    updateMap : function(){
        var me = this;
        
        if( me.updatingMap ) return;
        me.updatingMap = true;
        
        if( !me.map ) return;
        if( !me.markers ) me.markers = {};
        if( !me.infoWindow ) me.infoWindow = new google.maps.InfoWindow({content:''});
        var markers = {};
        me.store.data.each( function( place ){
            if( me.markers[place.id] ){
                markers[place.id] = me.markers[place.id];
                delete me.markers[place.id];
                return;
            }
            var loc = place.get('location'),
                marker = new google.maps.Marker({
                    title: place.get('name'),
                    position: new google.maps.LatLng(loc.lat, loc.lng),
                    map: me.map
                });
            google.maps.event.addListener(marker, 'click', function(){
                
                if( !this._infoNode ){
                    this._infoNode = document.createElement('div');
                }
                var node = this._infoNode;
                node.innerHTML = me.markerTpl.apply(place.data);
                me.infoWindow.setContent(node);
                me.infoWindow.open(me.map, marker);
                var a = Ext.DomQuery.selectNode('a', node);
                Ext.fly(a).on('click', function(){
                    me.fireEvent('selectplace', place);
                });
                
            });
            markers[place.id] = marker;
        });
        
        Ext.Object.each( me.markers, function(key, marker){
            marker.setMap(null);
        });
        
        me.markers = markers;
        me.updatingMap = false;
    }
    
});