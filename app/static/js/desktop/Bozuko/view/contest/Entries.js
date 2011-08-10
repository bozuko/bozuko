Ext.define( 'Bozuko.view.contest.Entries', {
    
    alias : 'widget.contestentries',
    extend : 'Ext.panel.Panel',
    
    requires : [
        'Bozuko.model.User',
        'Bozuko.store.Entries'
    ],
    
    autoScroll :true,
    
    initComponent : function(){
        var me = this;
        
        me.store = Ext.create('Bozuko.store.Entries', {
            autoLoad        :true,
            page_id         :me.page_id || (me.page ? me.page.get('_id') : null),
            contest_id      :me.contest_id|| (me.contest? me.contest.get('_id') : null)
        });
        
        me.bufferedSearch = Ext.Function.createBuffered(function(){
            me.store.load();
        }, 250);
        
        me.store.on('beforeload', me.onBeforeLoad, me);
        
        me.dockedItems = [{
            xtype           :'toolbar',
            dock            :'top',
            items           :[{
                xtype           :'textfield',
                inputType       :'search',
                emptyText       :'Search...',
                ref             :'search',
                enableKeyEvents :true,
                listeners       :{
                    change          :me.bufferedSearch
                }
            }]
        },{
            xtype           :'pagingtoolbar',
            dock            :'bottom',
            displayMsg      :'{0} - {1} of {2}',
            store           :me.store,
            displayInfo     :true
        }];
        
        me.items = [{
            xtype           :'dataview',
            cls             :'bozuko-list entry-list',
            
            deferEmptyText  :false,
            emptyText       :'<div style="padding: 10px;">No Players yet!</div>',
            
            trackOver       :true,
            overItemCls     :'entry-item-over',
            
            store           :me.store,
            
            itemTpl: new Ext.XTemplate(
                '<div class="entry-item">',
                    '<tpl if="!this.isContestSpecific()">',
                        '<div class="contest-name">',
                            '<tpl if="this.showPageTitle()">',
                                '<strong>{page.name}</strong> - ',
                            '</tpl>',
                            '{contest.name}',
                        '</div>',
                    '</tpl>',
                    '<div class="entry-body">',
                        '<img src="{[this.getImage(values.user.image)]}" />',
                        '<div class="user-name">{[this.getUserName(values)]}</div>',
                        '<div class="user-friend-count">{[this.getFriendCount(values)]} Friends</div>',
                        '<div class="entry-type">{[this.getEntryType(xindex)]}</div>',
                        '<div class="entry-timestamp">{[this.getFormattedDate(values.timestamp)]}</div>',
                    '</div>',
                '</div>',
                {
                    
                    isPageSpecific : function(){
                        return !!me.store.page_id;
                    },
                    
                    isContestSpecific : function(){
                        return !!me.store.contest_id;
                    },
                    
                    getEntryType : function(index){
                        return me.store.getAt(index-1).getEntryType();
                    },
                    
                    getFriendCount : function(values){
                        try{
                            return values.user.friend_count;
                        }catch(e){
                            return 0;
                        }
                    },
                    
                    getImage: function(image){
                        if( /facebook\.com/.test(image) ){
                            image = image.replace(/type=large/, 'type=square');
                        }
                        return image;
                    },
                    
                    getFormattedDate : function(str){
                        var date = new Date();
                        date.setTime( Date.parse(str) );
                        return Ext.Date.format(date, 'm/d/Y h:i a');
                    },
                    
                    showPageTitle : function(){
                        return !this.isContestSpecific() && !this.isPageSpecific();
                    },
                    
                    getUserName : function(values){
                        var name = values.user.name;
                        
                        if( values.user.facebook_link ){
                            name ='<a href="'+values.user.facebook_link+'" target="_blank">'+name+'</a>';
                        }
                        return name;
                    }
                }
            ),
            
            onDestroy : function(){
                if( this.loadMask === true ) this.loadMask = false;
                this.callParent(arguments);
            }
        }];
        me.callParent(arguments);
    },
    
    onBeforeLoad : function(){
        var me = this,
            search = this.down('[ref=search]');
        me.store.getProxy().extraParams['search'] = search.getValue();
    }
    
});