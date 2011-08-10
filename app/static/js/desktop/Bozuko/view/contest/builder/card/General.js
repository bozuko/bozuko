Ext.define('Bozuko.view.contest.builder.card.General', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergeneral',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Ext.ux.form.field.DateTime'
    ],
    name            :"Basic Information",
    overview        :[
        "<p>It is easy to create a new Bozuko campaign. We will help describe each ",
        "step as you are filling out the form.</p>"
    ],

    intro           :[
        "Please enter the basic information about your campaign below."
    ],
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me.form, {
            items               :[{
                name                :'name',
                fieldLabel          :'Campaign Name',
                emptyText           :'Your Campaign Name',
                allowBlank          :false,
                helpText            :[
                    "<p>",
                        "Enter a name for you to track your campaign internally. ",
                        "This will not be visible in the app - only you (and any other page admins) will see this.",
                    "</p>",
                    '<p>',
                        'An example might be "Summer Scratch 2012" if you plan on running a long campaign, or ',
                        '"St. Paddy\'s 2012" for a short one day campaign.',
                    '</p>'
                ]
            },{
                xtype               :'datetimefield',
                name                :'start',
                allowBlank          :false,
                format              :'m-d-Y h:i a',
                fieldLabel          :'Campaign Start Date',
                emptyText           :'Start Date of the Campaign',
                helpText            :[
                    "<p>",
                        "The start date for your campaign. Once this date and time is reached, the contest will appear ",
                        "in the mobile application.",
                    '</p>'
                ],
                listeners           :{
                    focus               :function(){
                        if( !this.isExpanded ) this.onTriggerClick();
                    },
                    select              :function(value){
                        me.down('datetimefield[name=end]').setMinValue(this.getValue());
                    }
                }
            },{
                xtype               :'datetimefield',
                name                :'end',
                allowBlank          :false,
                format              :'m-d-Y h:i a',
                fieldLabel          :'Campaign End Date',
                emptyText           :'End Date of the Campaign',
                helpText            :[
                    "<p>",
                        "The date you're campaign will end.",
                    '</p>',
                    '<p>',
                        'Please note, campaigns may end prior to this date if all the entries are distributed.',
                    '</p>'
                ],
                listeners           :{
                    focus               :function(){
                        if( !this.isExpanded ) this.onTriggerClick();
                    },
                    select              :function(value){
                        me.down('datetimefield[name=start]').setMaxValue(this.getValue());
                    }
                }
            }]
        });
        
        me.callParent(arguments);
    }
    
    
});