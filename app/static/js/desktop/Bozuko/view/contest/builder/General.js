Ext.define('Bozuko.view.contest.builder.General', {
    
    extend          :'Bozuko.view.contest.builder.Card',
    alias           :'widget.contestbuildergeneral',
    
    requires        :[
        'Bozuko.view.contest.builder.Card',
        'Ext.ux.form.field.DateTime'
    ],
    
    overview         :"It is easy to create a new Bozuko campaign. We will help describe each step as you are filling out the form.",
    
    initComponent : function(){
        var me = this;
        
        Ext.apply(me.form, {
            bodyPadding         :10,
            items               :[{
                name                :'name',
                fieldLabel          :'Campaign Name',
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
                fieldLabel          :'Campaign Start Date',
                helpText            :[
                    "<p>",
                        "The start date for your campaign. Once this date and time is reached, the contest will appear ",
                        "in the mobile application.",
                    '</p>'
                ]
            },{
                xtype               :'datetimefield',
                name                :'end',
                fieldLabel          :'Campaign End Date',
                helpText            :[
                    "<p>",
                        "The date you're campaign will end.",
                    '</p>',
                    '<p>',
                        'Please note, campaigns may end prior to this date if all the entries are distributed.',
                    '</p>'
                ]
            }]
        });
        
        me.callParent(arguments);
    }
    
    
});