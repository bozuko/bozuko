Ext.define('Bozuko.view.contest.View' ,{
    
    extend: 'Ext.view.View',
    alias : 'widget.contestsview',
    
    emptyText: 'You do not have any active campaigns.',
    cls: 'campaigns-body',
    
    itemSelector: '.list-item',
    itemOverCls : 'list-item-over',
    itemSelectedCls : 'list-item-selected',
    
    initComponent : function(){
        var me = this;
        
        me.tpl = new Ext.XTemplate(
            '<h1>Your Campaigns</h1>',
            '<ul class="campaign-list">',
                '<tpl for=".">',
                    '<li class="list-item">',
                        '<h3 class="title">{[this.getTitle(values.name)]}</h1>',
                        '<div class="details">',
                            '{[this.getDetails(values)]}',
                        '</div>',
                        '<ul class="buttons">',
                            '<li><a href="javascript:;" class="edit">Edit</a></li>',
                            '<li><a href="javascript:;" class="copy">Copy</a></li>',
                            '<li><a href="javascript:;" class="publish">Publish</a></li>',
                            '<li><a href="javascript:;" class="delete">Delete</a></li>',
                        '</ul>',
                    '</li>',
                '</tpl>',
            '</ul>',
            {
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
                }
            }
        );
        
        me.callParent();
        
    }
});