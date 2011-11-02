Ext.define('Bozuko.view.page.Welcome' ,{
    
    extend          :'Ext.form.Panel',
    alias           :'widget.pagewelcome',
    
    requires        :[
        'Bozuko.lib.Util'
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply( me, {
            
            layout              :'border',
            border              :false,
            
            items : [{
                xtype               :'panel',
                region              :'center',
                bodyPadding         :10,
                border              :false,
                autoScroll          :true,
                listeners           :{
                    'added'             :function(panel){
                        // lets get the content for this page...
                        /*
                        panel.addDocked({
                            dock            :'bottom',
                            xtype           :'toolbar',
                            items           :[{
                                text            :'Reload',
                                handler         :function(){
                                    panel.loadPage();
                                }
                            }]
                        })
                        */
                        panel.loadPage(panel);
                    }
                },
                loadPage : function(panel){
                
                    panel.setLoading(true);
                    Ext.Ajax.request({
                        url             :Bozuko.Router.route('/welcome/'+me.page.get('_id')),
                        method          :'GET',
                        success         :function(response){
                            panel.setLoading(false);
                            panel.update(response.responseText);
                            var deferredEvent = Ext.Function.createDelayed(function(){
                                me.fireEvent('welcomeloaded', panel);
                            }, 0);
                            if( panel.rendered && panel.isVisible(true) ) deferredEvent();
                            else panel.up('pagewelcome').on('activate', deferredEvent);
                        }
                    });
                }
            },{
                xtype               :'panel',
                region              :'east',
                title               :'Need a hand?',
                cls                 :'need-a-hand',
                width               :320,
                autoScroll          :true,
                bodyPadding         :10,
                html                :[
                    '<ul>',
                        '<li><a class="howto" data-article="create-a-game" href="javascript:;">How to Create a Game</a></li>',
                        '<li><a class="howto" data-article="prize-tips" href="javascript:;">Prizes Tips and Concepts</a></li>',
                        '<li><a class="howto" data-article="redeem-prizes" href="javascript:;">How to Redeem Prizes</a></li>',
                        '<li><a class="howto" data-article="contact" href="javascript:;">Contact Us</a></li>',
                    '</ul>'
                ],
                listeners           :{
                    render              :function(panel){
                        setTimeout(function(){
                            panel.getEl().select('.howto').on('click', function(e, el){
                                e.stopEvent();
                                Bozuko.lib.Util.howto(el.getAttribute('data-article'));
                            });
                        }, 100);
                    }
                }
            }/*,{
                xtype               :'panel',
                region              :'east',
                title               :'From the Bozuko Blog...',
                cls                 :'blog-panel',
                border              :false,
                width               :320,
                autoScroll          :true,
                bodyPadding         :10,
                items               :[{
                    xtype               :'dataview',
                    store               :Ext.create('Ext.data.Store',{
                        fields              :['title','link','pubDate','category','description'],
                        proxy               :{
                            type                :'ajax',
                            url                 :Bozuko.Router.route('/blog/feed'),
                            reader              :{
                                type                :'json',
                                root                :'items'
                            }
                        },
                        autoLoad            :true
                    }),
                    
                    autoHeight          :true,
                    
                    itemSelector        :'.blog-entry',
                    
                    tpl                 :Ext.create('Ext.XTemplate',
                        '<tpl for=".">',
                            '<div class="blog-entry" style="margin-bottom: 1.5em;" >',
                                '<h3 style="font-size: 15px;"><a style=" text-decoration: none;" href="{link}" target="_blank">{title}</a></h3>',
                                '<p>{[this.getDescription(values.description)]}</p>',
                                '<p style="text-align:right;"><a class="small-button" href="{link}" target="_blank">Read More...</a>',
                                '</p>',
                            '</div>',
                        '</tpl>',
                        {
                            getDescription : function(desc){
                                return desc.replace(/\[\.+\]/i, '...');
                            }
                        }
                    )
                }]
            }*/]
        });
        
        me.callParent( arguments );
    }
    
});