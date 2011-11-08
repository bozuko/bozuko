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
            items :[{
                ref             :'add-container',
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
        });
        
        me.callParent(arguments);
        me.on('activate', me.onActivate, me);
        me.addContainer = me.down('[ref=add-container]');
    },
    
    onActivate : function(){
        var me = this;
        if( !me.prizes.getCount() ){
            me.addPrize();
        }
    },
    
    addPrize : function(){
        var me = this;
        var prize = new Bozuko.model.Prize({
            email_format:'text/html',
            duration: 1000 * 60 * 60 * 24 * 7
        });
        me.prizes.add( prize );
        me.addPrizeForm(prize).focusFirstField();
        
    },
    
    addPrizeForm : function(prize, mode){
        var me = this,
            index = me.form.items.indexOf(me.addContainer);
            
        return me.form.insert( index, {
            xtype               :'contestbuilderprizeform',
            prize               :prize,
            card                :me,
            mode                :mode||'form',
            listeners           :{
                sizechange          :me.onSizeChange,
                deleteme            :me.deletePrize,
                scope               :me
            }
        });
    },
    
    deletePrize : function(form, prize){
        var me = this;
        // confirm the deletion
        Ext.Msg.confirm(
            'Delete Prize',
            'Are you sure you would like to delete this prize?',
            function(btn){
                if(btn!='yes') return;
                me.form.remove(form);
                me.prizes.remove(prize);
            }
        );
    },
    
    onSizeChange : function(){
        var me = this;
        me.form.doLayout();
    },
    
    loadContest : function(){
        var me = this;
        // add each  prize.
        if( !me.rendered ) me.on('render', me.addPrizeForms, me );
        else me.addPrizeForms();
    },
    
    addPrizeForms : function(){
        var me = this;
        me.prizes.each(function(prize){
            me.addPrizeForm(prize, 'summary');
        });
    },
    
    updateRecord : function(){
        
    },
    
    focusFirstField : function(){
        return;
    },
    
    validate : function(){
        var me = this,
            isValid=true;
        
        Ext.Array.each( me.query('contestbuilderprizeform'), function(form){
            isValid = form.validate();
            if( isValid === true) form.save();
            return isValid === true;
        });
        
        if( isValid !== true){
            return {
                title: 'Prize Errors',
                message: 'Please correct the errors noted on the form'
            }
        }
        
        return me.prizes.getCount() ? true : {
            title : 'No Prizes',
            message: 'You must add at least one prize'
        };
    }
});