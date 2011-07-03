Ext.define('Beta.view.contests.Panel', {
    
    alias: 'widget.contestspanel',
    extend: 'Ext.panel.Panel',
    
    requires: [
        'Bozuko.lib.PubSub'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me, {
            bodyPadding: 10,
            items : [{
                xtype       :'dataview',
                store       :me.store,
                autoScroll  :true,
                itemSelector:'campaign-row',
                cls         :'campaign-list',
                
                tpl: new Ext.XTemplate(
                    '<table>',
                        '<thead>',
                            '<th>',
                                'Campaign Name',
                            '</th>',
                            '<th>',
                                'Entries',
                            '</th>',
                        '</thead>',
                        '<tbody>',
                            '<tpl for=".">',
                                '<tr class="campaign-row">',
                                    '<td>',
                                        '<h3 class="title">',
                                            '{[this.getTitle(values.name)]}',
                                        '</h3>',
                                        '<div class="state">',
                                            '{[this.getState(values)]}',
                                        '</div>',
                                    '</td>',
                                    '<td>',
                                        '{[this.getEntries(xindex)]}',
                                    '</td>',
                                '</tr>',
                            '</tpl>',
                        '</tbody>',
                    '</table>',
                    /* Template methods */
                    {
                        getTitle : function( name ){
                            return name || 'Untitled Campaign';
                        },
                        getState : function( values ){
                            return values.state.substr(0,1).toUpperCase()+values.state.substr(1);
                        },
                        getEntries : function( xindex ){
                            var contest = me.store.getAt(xindex-1),
                                qty = 0
                                ;
                            contest.prizes().each(function(prize){
                                qty += prize.get('total');
                            });
                            var entries = qty * contest.get('win_frequency');
                            return (contest.get('token_cursor') || '0') + ' / '+ (entries||'0');
                        }
                    }
                )
            }]
        });
        
        me.callParent(arguments);
    }
});