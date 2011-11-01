Ext.define('Bozuko.view.contest.builder.card.General', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergeneral',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Ext.ux.form.field.DateTime'
    ],
    name            :"Basic Information",
    overview        :[
        "<p>It is easy to create a new Bozuko game. We will help describe each ",
        "step as you are filling out the form.</p>"
    ],

    intro           :[
        "Please enter the basic information about your game below."
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me.form, {
            items               :[{
                name                :'name',
                fieldLabel          :'Reference Name',
                emptyText           :'Enter a name to reference this game.',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter a reference name for this game.  This name will not be publicly visible.",
                    "</p>",
                    '<p>',
                        'Example: "Summer Scratch #2"',
                    '</p>'
                ]
            },{
                xtype               :'container',
                border              :false,
                arrowCt             :true,
                style               :'position: relative; overflow: visible',
                layout              :{
                    type                :'hbox'
                },
                items               :[{
                    
                    labelAlign          :'top',
                    xtype               :'fieldcontainer',
                    border              :false,
                    fieldLabel          :'Start',
                    layout              :'hbox',
                    flex                :1,
                    autoHeight          :true,
                    fieldLabel          :'Start Date',
                    helpText            :[
                        "<p>",
                            'This is the date and time your game will be available to players in the mobile application.',
                        '</p>'
                    ],
                    
                    items               :[{
                        xtype               :'datefield',
                        name                :'start',
                        allowBlank          :false,
                        format              :'m-d-Y',
                        fieldLabel          :'Start Date',
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        emptyText           :'Start Date of the Campaign',
                        
                        listeners           :{
                            scope               :me,
                            focus               :function(field){
                                if( !field.isExpanded ) field.onTriggerClick();
                            },
                            select              :me.onStartChange
                        }
                    },{xtype:'splitter'},{
                        xtype               :'timefield',
                        name                :'start_time',
                        value               :new Date(2011,1,1,12),
                        editable            :false,
                        allowBlank          :false,
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        increment           :60
                    }]
                },{xtype:'splitter', width: 20},{
                    labelAlign          :'top',
                    xtype               :'fieldcontainer',
                    border              :false,
                    fieldLabel          :'Cutoff Date',
                    layout              :'hbox',
                    flex                :1,
                    autoHeight          :true,
                    helpText            :[
                        "<p>",
                            'This is the cut-off date for your game. Your game ends when total entries are exhausted or this date hits.',
                        '</p>'
                    ],
                    
                    items               :[{
                        flex                :1,
                        xtype               :'datefield',
                        name                :'end',
                        allowBlank          :false,
                        format              :'m-d-Y',
                        fieldLabel          :'Cut Off Date',
                        hideLabel           :true,
                        autoHeight          :true,
                        listeners           :{
                            scope               :me,
                            focus               :function(field){
                                if( !field.isExpanded ) field.onTriggerClick();
                            },
                            select              :me.onEndChange
                        }
                        
                    },{xtype:'splitter'},{
                        xtype               :'timefield',
                        name                :'end_time',
                        value               :new Date(2011,1,1,12),
                        editable            :false,
                        allowBlank          :false,
                        hideLabel           :true,
                        autoHeight          :true,
                        flex                :1,
                        increment           :60
                    }]
                }]
            }]
        });
        
        me.callParent(arguments);
        me.on('render', me.onStartChange, me);
        me.on('render', me.onEndChange, me);
    },
    
    onStartChange : function(value){
        var me = this;
        
        me.down('datefield[name=end]').setMinValue(me.down('datefield[name=start]').getValue());
    },
    onEndChange : function(value){
        var me = this;
        
        me.down('datefield[name=start]').setMaxValue(me.down('datefield[name=end]').getValue());
    },
    
    loadContest : function(){
        var me = this;
        me.callParent(arguments);
        me.down('[name=start_time]').setValue(me.contest.get('start'));
        me.down('[name=end_time]').setValue(me.contest.get('end'));
    },
    
    validate : function(){
        var me = this;
        
        var valid = me.callParent();
        if( !valid ) return false;
        // else check for the date thing.
        if( me.contest.get('start') > me.contest.get('end') ){
            return 'The start date must be later than the end date';
        }
        return valid;
    },
    
    updateRecord : function(){
        var me = this;
        
        me.callParent(arguments);
        
        var start_time = me.down('[name=start_time]').getValue(),
            end_time = me.down('[name=end_time]').getValue()
            ;
        
        me.contest.get('start').setHours(start_time.getHours());
        me.contest.get('start').setMinutes(start_time.getMinutes());
        me.contest.get('start').setSeconds(start_time.getSeconds());
        
        me.contest.get('end').setHours(end_time.getHours());
        me.contest.get('end').setMinutes(end_time.getMinutes());
        me.contest.get('end').setSeconds(end_time.getSeconds());
    }
    
    
});