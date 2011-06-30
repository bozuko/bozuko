Ext.define('Admin.view.contest.report.Details' ,{
    
    extend: 'Ext.panel.Panel',
    alias : 'widget.contestdetails',
    
    bodyCls: 'campaign-details',
    
    initComponent : function(){
        var me = this;
        
        me.tpl = new Ext.XTemplate(
            '<div class="details">{[this.getDetails(values)]}</div>',
            {
                
                canEdit : function(values){
                    return true || ~['draft', 'published'].indexOf(values.state);
                },
                
                canPublish : function(values){
                    return ~['draft'].indexOf(values.state);
                },
                
                canDelete : function(values){
                    return ~['draft','published'].indexOf(values.state);
                },
                
                canCancel : function(values){
                    return ~['active'].indexOf(values.state);
                },
                
                canReport : function(values){
                    return ~['active','complete','cancelled'].indexOf(values.state);
                },
                
                getTitle : function(name){
                    return name || 'Untitled Campaign';
                },
                
                getDetails: function(values){
                    return [
                        '<table cellpadding="0" cellspacing="0">',
                            '<tbody>',
                                '<tr>',
                                    '<th>Game:</th>',
                                    '<td>',
                                    values.game ? values.game.substr(0,1).toUpperCase()+values.game.substr(1) : 'Unknown',
                                    '<td>',
                                '<tr>',
                                '<tr>',
                                    '<th>Timeline:</th>',
                                    '<td>',
                                    Ext.isDate(values.start) && Ext.isDate(values.end)
                                        ? Ext.Date.format(values.start,'m/d/Y')+' - '+Ext.Date.format(values.end,'m/d/Y')
                                        : 'Unknown',
                                    '<td>',
                                '<tr>',
                                '<tr>',
                                    '<th>Number of Entries:</th>',
                                    '<td>',values.total_entries,'</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>'
                    ].join('');
                },
                
                getState : function( values ){
                    return values.state.substr(0,1).toUpperCase()+values.state.substr(1);
                }
            }
        );
        
        me.callParent();
    }
});