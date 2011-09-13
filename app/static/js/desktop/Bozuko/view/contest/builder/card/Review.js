Ext.define('Bozuko.view.contest.builder.card.Review', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderreview',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Bozuko.view.contest.Review',
    ],
    name            :"Review and Publish",
    overview        :'Please review your campaign to make sure everything is entered correctly.',
    
    initComponent : function(){
        var me = this;
        if( me.contest && me.contest.get('active') ) me.name = 'Review';
        Ext.apply( me.form, {
            xtype               :'contestreview',
            contest             :me.contest
        });
        me.callParent();
        me.on('activate', me.refresh, me);
    },
    refresh : function(){
        var me = this;
        me.form.refresh();
    },
    loadContest : function(){},
    updateRecord: function(){}
});