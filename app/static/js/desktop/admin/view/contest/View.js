Ext.define('Bozuko.view.contest.View' ,{
    
    extend: 'Ext.view.View',
    alias : 'widget.contestsview',
    
    emptyText: 'No active campaigns.',
    deferEmptyText: false,
    cls: 'campaigns-body',
    
    itemSelector: '.list-item',
    itemOverCls : 'list-item-over',
    itemSelectedCls : 'list-item-selected',
    
    initComponent : function(){
        var me = this;
        
        me.tpl = new Ext.XTemplate(
            '<ul class="campaign-list">',
                '<tpl for=".">',
                    '<li class="list-item">',
                        '<h3 class="title">',
                            '<span class="state">',
                                '{[this.getState(values)]}',
                            '</span>',
                            '{[this.getTitle(values.name)]}',
                        '</h3>',
                        '<div class="details">',
                            '{[this.getDetails(values)]}',
                        '</div>',
                        '<ul class="buttons">',
                            '<li><a href="javascript:;" class="edit">Edit</a></li>',
                            '<li><a href="javascript:;" class="copy">Copy</a></li>',
                            '<tpl if="this.canPublish(values)">',
                                '<li><a href="javascript:;" class="publish">Publish</a></li>',
                            '</tpl>',
                            '<tpl if="this.canDelete(values)">',
                                '<li><a href="javascript:;" class="delete">Delete</a></li>',
                            '</tpl>',
                            '<tpl if="this.canCancel(values)">',
                                '<li><a href="javascript:;" class="cancel">Cancel</a></li>',
                            '</tpl>',
                        '</ul>',
                    '</li>',
                '</tpl>',
            '</ul>',
            {
                
                canPublish : function(values){
                    return ~['draft'].indexOf(values.state);
                },
                
                canDelete : function(values){
                    return ~['draft','published'].indexOf(values.state);
                },
                
                canCancel : function(values){
                    return ~['active'].indexOf(values.state);
                },
                
                getTitle : function(name){
                    return name || 'Untitled Campaign';
                },
                
                getDetails: function(values){
                    return [
                        '<table cellpadding="0" cellspacing="0">',
                            '<tbody>',
                                '<tr>',
                                    '<th>Timeline:</th>',
                                    '<td>',
                                    Ext.Date.format(values.start,'m/d/Y')+' - '+Ext.Date.format(values.end,'m/d/Y'),
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