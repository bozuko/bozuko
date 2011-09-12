Ext.define('Bozuko.view.page.Resources' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pageresources',
    
    autoScroll      :true,
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            
            bodyPadding         :10,
            layout              :'anchor',
            defaults            :{
                anchor              :'0',
                labelWidth          :180
            },
            
            items : [{
                xtype               :'component',
                autoEl              :{tag:'h3', cls:'page-h3'},
                html                :'Resources'
            },{
                xtype               :'container',
                items               :[{
                    icon                :'/images/icons/24/print24.gif',
                    scale               :'medium',
                    xtype               :'button',
                    text                :'Print Your Redemption Instructions',
                    handler             :me.printInstructions,
                    scope               :me
                }]
            },{
                xtype               :'fieldcontainer',
                fieldLabel          :'Your Bozuko Page',
                layout              :'hbox',
                style               :'margin: 10px 0;',
                items               :[{
                    xtype               :'component',
                    autoEl              :{
                        style               :{'line-height': '18px'},
                        tag                 :'a',
                        href                :me.sharePage(),
                        target              :'_blank'
                    },
                    html                :me.sharePage()
                }]
            },{
                xtype               :'fieldset',
                title               :'Website Stamps',
                autoHeight          :true,
                items               :[{
                    xtype               :'dataview',
                    ref                 :'stamp-view',
                    
                    itemSelector        :'.item',
                    
                    trackOver           :true,
                    itemOverCls         :'item-over',
                    
                    itemTpl             :new Ext.XTemplate(
                        '<div class="item" style="clear: both;padding: 10px;">',
                            '<img src="{src}" style="float: left; margin-right: 10px;" />',
                            '<div style="margin-left: 210px;">',
                                '<div>',
                                    'URL: <a href="{src}" target="_blank">',
                                        '{src}',
                                    '</a>',
                                '</div>',
                                '<div>',
                                    '<div style="margin-top: 8px; color: #666;">Code for your site:</div>',
                                    '<textarea style="font-family: \'courier new\'; color: #666; width: 98%; height: 38px; padding: 4px;" onclick="this.select()">',
                                        '<a href="{[this.sharePage()]}" target="_blank">',
                                        '<img src="{src}" alt="Play Bozuko!" />',
                                        '</a>',
                                    '</textarea>',
                                '</div>',
                            '</div>',
                        '</div>',
                        {
                            sharePage : function(){
                                return me.sharePage();
                            }
                        }
                    ),
                    
                    store               :Ext.create('Ext.data.Store',{
                        autoLoad            :true,
                        fields              :['src'],
                        data                :[
                            {src:'https://s3.amazonaws.com/bozuko/public/stamps/stamp_white.jpg'},
                            {src:'https://s3.amazonaws.com/bozuko/public/stamps/stamp_charcoal.jpg'},
                            {src:'https://s3.amazonaws.com/bozuko/public/stamps/stamp_gray.jpg'}
                        ]
                    })
                    
                }]
            }]
            
        });
        
        me.callParent( arguments );
    },
    
    sharePage : function(){
        return 'https://bozuko.com/p/'+this.page.get('_id');
    },
    
    printInstructions : function(){
        var id = this.page.get('_id'),
            win = window.open(
                Bozuko.Router.route('redemption/instructions/'+id),
                'inst_'+id
            );
    }
    
});