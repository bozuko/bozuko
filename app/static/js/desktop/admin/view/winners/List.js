Ext.define('Bozuko.view.winners.List' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.winnerslist',
    
    requires: [
        'Bozuko.store.Winners'
    ],
    
    layout: {
        type        :'fit'
    },
    
    autoScroll: true,
    
    initComponent : function(){
        var me = this;
        me.store = Ext.create('Bozuko.store.Winners');
        
        me.tbar = ['->',{
            text: 'Refresh',
            icon: '/images/icons/famfamfam/icons/arrow_refresh.png',
            handler: function(){
                if( me.store ) me.store.load();
            }
        }];
        
        // going to create a view within this panel.
        me.items = [{
            xtype: 'dataview',
            
            itemSelector: '.list-item',
            itemOverCls : 'list-item-over',
            itemSelectedCls : 'list-item-selected',
            
            emptyText: '<p>No Winners yet!</p>',
            deferEmptyText: false,
            
            store: me.store,
            tpl: new Ext.XTemplate(
                '<ul class="bozuko-list winners-list">',
                    '<tpl for=".">',
                        '<li class="list-item">',
                            '<img src="{[this.getImage(values.user.image)]}" />',
                            '<div class="user-name">{user.name}</div>',
                            '<div class="prize-name">{prize.name}</div>',
                            '<div class="prize-timestamp">{[this.getFormattedDate(values.prize.timestamp)]}</div>',
                        '</li>',
                    '</tpl>',
                '</ul>',
                {
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
                    }
                }
            )
        }];
        
        me.callParent(arguments);
    },
    
    setContest : function(contest){
        var me = this;
        me.contest = contest;
        me.store.contest_id = contest.get('_id');
        me.store.load();
    },
    
    setPage : function(page){
        var me = this;
        me.page = page;
        me.store.page_id = page.get('_id');
        me.store.load();
    }
});