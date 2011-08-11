Ext.define('Bozuko.view.contest.builder.card.Prizes', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuilderprizes',
    
    requires : [
        'Bozuko.view.contest.builder.card.prize.Form',
        'Bozuko.model.Prize'
    ],
    
    name            :"Prizes",
    overview        :[
        "<p>Add your prizes</p>"
    ],
    
    initComponent : function(){
        var me = this;
        me.prizes = me.contest.prizes();
        me.prizes.sort('value', 'DESC');
        
        Ext.apply( me.form, {
            
            layout      :'card',
            cls         :null,
            bodyCls     :null,
            autoScroll  :false,
            
            activeItem  : me.prizes.getCount() ? 0 : 1,

            defaults :{
                border          :false,
                cls             :'builder-card',
                bodyCls         :'builder-card-body',
                autoScroll      :true,
                listeners       :{
                    scope               :me,
                    activate            :me.onActiveCard
                }
            },
            
            listeners : {
                
            },
            
            items : [{
                xtype           :'panel',
                items :[{
                    xtype           :'component',
                    autoEl          :{tag:'h3',cls:'card-title'},
                    html            :'Prizes'
                },{
                    xtype           :'dataview',
                
                    cls             :'builder-prize-list',
                    
                    emptyText       :'<p>This contest has no prizes. Please add one.</p>',
                    deferEmptyText  :false,
                    
                    disableSelection:true,
                    
                    itemTpl         :new Ext.XTemplate(
                        '<div class="prize">',
                            '<div class="meta">',
                                '<div class="name">{name}</div>',
                                '<div class="value">{total} prizes valued at ${value} each</div>',
                            '</div>',
                            '<ul class="app-buttons">',
                                '<li><a href="javascript:;" class="edit">Edit</a></li>',
                                '<li><a href="javascript:;" class="delete">Delete</a></li>',
                            '</ul>',
                        '</div>'
                    ),
                    
                    store : me.prizes,
                    
                    listeners : {
                        scope           :me,
                        itemclick       :me.onItemClick
                    }
                },{
                    xtype           :'container',
                    style           :'text-align:center',
                    items :[{
                        xtype           :'button',
                        text            :'Add a Prize',
                        scale           :'medium',
                        icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-plus-24.png',
                        handler         :me.addPrize,
                        scope           :me
                    }]
                }]
            },{
                xtype : 'contestbuilderprizeform',
                prize : me.prizes.getCount() ? me.prizes.getAt(0) : new Bozuko.model.Prize()
            }]
        });
        
        me.callParent(arguments);
        me.dataview = me.down('dataview');
        me.prizeForm = me.down('contestbuilderprizeform');
        me.navbar = me.down('[ref=nav-bar]');
        me.form.addDocked({
            hidden          :true,
            ref             :'prize-nav',
            dock            :'bottom',
            xtype           :'toolbar',
            cls             :'x-toolbar card-nav-toolbar',
            defaults        :{
                scale           :'medium'
            },
            items           :[{
                ref             :'back',
                text            :'Back',
                icon: '/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-direction-left-24.png',
                listeners       :{
                    scope           :me,
                    click           :me.onPrizeBack
                }
            }, '->', {
                ref             :'save',
                text            :'Update Prize',
                style           :'margin-right: 0',
                icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-check-24.png',
                listeners       :{
                    scope           :me,
                    click           :me.onPrizeNext
                }
            },{
                ref             :'add',
                text            :'Add Prize',
                style           :'margin-right: 0',
                icon            :'/images/icons/SweetiePlus-v2-SublinkInteractive/with-shadows/badge-circle-plus-24.png',
                listeners       :{
                    scope           :me,
                    click           :me.onPrizeNext
                }
            }]
        });
        
        me.prizeNav = me.down('[ref=prize-nav]');
        me.on('render', me.dataview.refresh, me.dataview);
    },
    
    addPrize : function(){
        var me = this;
        me.prizeForm.loadForm(new Bozuko.model.Prize());
        me.form.getLayout().setActiveItem(1);
    },
    
    updateRecord : function(){
        var me = this;
        
        if( me.form.getLayout().getActiveItem() !== me.prizeForm ) return;
        me.prizeForm.prize.set(me.prizeForm.getValues());
    },
    
    onActiveCard : function(panel){
        var me = this,
            pf = panel.isXType('contestbuilderprizeform');
        
        // set the navigation for the form
        me.prizeNav[pf?'show':'hide']();
        me.navbar[!pf?'show':'hide']();
        if( !me.prizeForm.prize.get('name') ){
            me.prizeNav.down('[ref=save]').hide();
            me.prizeNav.down('[ref=add]').show();
        }
        else{
            me.prizeNav.down('[ref=save]').show();
            me.prizeNav.down('[ref=add]').hide();
        }
        
        me.form.doLayout();
        me.form.doComponentLayout();
    },
    
    onItemClick :function(view, record, node, index, e){
        var me = this;
        // get the target
        var target = e.getTarget();
        if( target.tagName.toLowerCase() != 'a' ) return;
        switch( target.className ){
            case 'edit':
                me.prizeForm.loadForm(record);
                me.form.getLayout().setActiveItem(1);
                break;
            case 'delete':
                Ext.Msg.confirm(
                    'Are you sure?',
                    'Are you sure you would like to remove this prize?',
                    function(btn){
                        if(btn=='yes'||btn=='ok'){
                            me.prizes.remove(record);
                        }
                    }
                )
                
                break;
        }
    },
    
    validate : function(){
        var me = this;
        
        return me.prizes.getCount() ? true : {
            title : 'No Prizes',
            message: 'You must add at least one prize'
        };
    },
    
    onPrizeBack : function(){
        var me = this;
        
        if( me.prizes.getCount() == 0 ){
            me.fireEvent('back', me );
        }
        else{
            me.form.getLayout().setActiveItem(0);
        }
    },
    
    onPrizeNext : function(){
        var me = this;
        // this will need to validate the prize and add it to our prizes if its not there yet.
        if( me.prizeForm.validate() ){
            me.prizeForm.updateRecord();
            // add it to our prizes if its not in there already
            if( !~me.prizes.indexOf(me.prizeForm.prize) ){
                me.prizes.add( me.prizeForm.prize );
            }
            me.form.getLayout().setActiveItem(0);
            me.prizes.sort('value', 'DESC');
        }
        else{
            // show an alert
            Ext.Msg.alert('Form Errors', 'Please correct the errors noted on the form before going to the next step.');
        }
    }
});