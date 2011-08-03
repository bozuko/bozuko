Ext.define('Bozuko.view.contest.Prizes', {
    
    extend              :'Ext.panel.Panel',
    alias               :'widget.contestprizes',
    
    initComponent       :function(){
        var me = this;
        
        
        Ext.apply( me, {
            
            autoScroll      :true,
            
            items           :[{
                xtype           :'dataview',
                store           :me.contest.prizes(),
                
                cls             :'prize-list bozuko-list',
                disableSelection:true,
                
                itemTpl         :new Ext.XTemplate(
                    '<div>',
                        '<div class="numbers">',
                            '<table>',
                                '<tr><th>Total:</th><td><span class="number">{total}</span></td></tr>',
                                '{[this.getWon(values)]}',
                                '{[this.getRedeemed(values)]}',
                                '{[this.getRemaining(values)]}',
                            '</table>',
                        '</div>',
                        '<div class="title">{name}</div>',
                        '<table class="info">',
                            '<tr valign="top"><th>Value:</th><td>${value}</td></tr>',
                            '<tr valign="top"><th>Description:</th><td>{description}</td></tr>',
                            '<tr valign="top"><th>Instructions:</th><td>{instructions}</td></tr>',
                        '</table>',
                    '</div>',
                    {
                        getWon : function(values){
                            return this.getNumberString(values.total, values.won, 'Won');
                        },
                        getRedeemed : function(values){
                            return this.getNumberString(values.total, values.redeemed, 'Redeemed');
                        },
                        getRemaining : function(values){
                            return this.getNumberString(values.total, values.total-values.won, 'Remaining');
                        },
                        getNumberString : function(total, number, string){
                            var percent = (number/total*100).toFixed(2);
                            return '<tr><th>'+string+': </th><td><span class="number">'+number+'</span> <span class="percent">'+percent+'%</span></td></tr>';
                        }
                    }
                )
            }]
        });
        
        me.callParent( arguments );
        me.dataview = me.down('dataview');
        
        me.contest.on('update', me.dataview.refresh, me.dataview);
    }
    
});