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
                            var count = 0;
                            Ext.each( values.user.services, function(service){
                                if( service.name === 'facebook'){
                                    count = service.internal.friends.length;
                                    return false;
                                }
                                return true;
                            });
                            return count;
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
                        if( values.user.services ) Ext.each(values.user.services,function(service){
                            if( service.name == 'facebook' && service.data && service.data.link ){
                                name ='<a href="'+service.data.link+'" target="_blank">'+name+'</a>';
                                return false;
                            }
                            return true;
                        });
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
    }
    
});