Ext.define('Bozuko.view.winners.List' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.winnerslist',
    
    requires: [
        'Bozuko.store.Winners'
    ],
    
    layout: {
        type        :'fit'
    },
    
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
            
            trackOver: true,
            
            itemSelector: '.list-item',
            overItemCls : 'list-item-over',
            selectedItemCls : 'list-item-selected',
            
            emptyText: '<p>No Winners yet!</p>',
            
            autoScroll: true,
            
            store: me.store,
            tpl: new Ext.XTemplate(
                '<ul class="bozuko-list winners-list">',
                    '<tpl for=".">',
                        '<li class="list-item prize-{prize.state}">',
                            '<tpl if="!this.isPageSpecific()">',
                                '<div class="page-name">',
                                    '{page.name}',
                                '</div>',
                            '</tpl>',
                            '<tpl if="!this.isContestSpecific()">',
                                '<div class="contest-name">',
                                    '{contest.name}',
                                '</div>',
                            '</tpl>',
                            '<div class="winner-body">',
                                '<img src="{[this.getImage(values.user.image)]}" />',
                                '<div class="user-name">{user.name}</div>',
                                '<div class="prize-name">{prize.name}</div>',
                                '<div class="prize-timestamp">{[this.getFormattedDate(values.prize.timestamp)]}</div>',
                            '</div>',
                        '</li>',
                    '</tpl>',
                '</ul>',
                {
                    
                    isPageSpecific : function(){
                        return !!me.store.page_id;
                    },
                    
                    isContestSpecific : function(){
                        return !!me.store.contest_id;
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