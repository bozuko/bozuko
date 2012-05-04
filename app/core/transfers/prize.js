var dateFormat = require('dateformat');
var s3 = Bozuko.require('util/s3');

exports.transfer_objects = {
    prize: {
        doc: "Bozuko Prize Object - state is either active, redeemed, or expired",
        def: {
            id: "String",
            game_id: "String",
            page_id: "String",
            state: "String",
            name: "String",
            shared: "Boolean",
            is_email: "Boolean",
            is_barcode: "Boolean",
            is_pdf: "Boolean",
            barcode_image: "String",
            page_name: "String",
            wrapper_message: "String",
            description: "String",
            win_time: "String",
            redemption_duration: "Number",
            redeemed_timestamp: "String",
            expiration_timestamp: "String",
            business_img: "String",
            user_img: "String",
            code: "String",
            links: {
                share: "String",
                redeem: "String",
                page: "String",
                user: "String",
                prize: "String",
                resend: "String"
            }
        },

        create : function( prize, user, callback){
            var self = this;
            this.sanitize(prize, null, user, function(error, o){
                if( error ) return callback( error );
                
                o.page_id = prize.page_id;
                o.game_id = prize.contest_id;
                o.wrapper_message = "To redeem your prize from "+prize.page.name+": "+prize.instructions+
                    " This prize expires "+dateFormat(prize.expires, 'mmmm dd yyyy hh:MM TT');
                o.win_time = prize.timestamp;
                o.business_img = prize.page.image;
                o.user_img = prize.user.image.replace(/type=large/, 'type=square');
                // what the fuck? why is this differnet?
                o.is_pdf = prize.get('is_pdf');

                if( o.is_barcode ){
                    var url = o.barcode_image;
                    if( url.match(/^https?\:\/\//) ){
                        url.replace(/^https?\:\/\//, '');
                        url = url.substr(url.indexOf('/') );
                    }
                    var expires = new Date( Date.now() + Bozuko.cfg('barcode.url_expiration',1000*60*60*24 ) );
                    o.barcode_image = s3.client.signedUrl(url, expires);
                }

                /**
                 * TODO - pull this from the contest / prize / page
                 */
                o.redemption_duration = 60;
                if( prize.redeemed ) o.redeemed_timestamp = prize.redeemed_time;
                if ( prize.verified ) o.redeemed_timestamp = prize.verified_time;
                o.expiration_timestamp = prize.expires;

                o.links = {
                    prize : '/prize/'+prize.id,
                    page: '/page/'+prize.page_id,
                    user: '/user/'+prize.user_id
                };
                if( prize.state != 'expired' && !prize.shared ){
                    o.links.share = '/prize/'+prize.id+'/share';
                }
                if( o.state == 'active' ){
                    o.links.redeem = '/prize/'+prize.id+'/redemption';
                } else if ( o.state == 'verified') {
                    o.state = 'redeemed';
                }
                
                o.links.resend = '/prize/'+prize.id+'/resend';
                return callback(null, o);
            });
        }
    },

    prizes: {
        doc: "The list of prizes",
        def: {
            "prizes" :["prize"],
            "next" : "String"
        }
    },

    redemption_object: {
        doc: "Prize Redemption Object",
        def: {
            security_image: 'String',
            prize: 'prize'
        }
    }
};

exports.links = {
    prizes: {
        get: {
        access: 'user',
            doc:  "Return a list of prizes",
            params: {
                state: {
                    type: "String",
                    values: ['active', 'redeemed', 'expired'],
                    description: "The state of the prizes to search"
                },
                query: {
                    type: "String",
                    description: "Query for prizes by name or page name"
                },
                game_id: {
                    type: "String",
                    description: "Filter the results by game_id"
                },
                page_id: {
                    type: "String",
                    description: "Filter the results by page_id"
                }
            },
            returns: "prizes"
        }
    },

    prize: {
        get: {
        access: 'user',
            doc: "Get a specific prize",
            returns: "prize"
        }
    },

    redeem: {
        post: {
            access: 'mobile',
            doc: "Redeem a prize",
            params: {
                message : {
                    type: "String",
                    description: "The user entered message"
                },
                share : {
                    type: "Boolean",
                    description: "Share this redemption."
                },
                email_prize_screen : {
                    type: "Boolean",
                    description: "Email the assets for this prize, even if it isn't an email prize."
                }
            },
            returns: "redemption_object"
        }
    },

    share : {
        post: {
            access: 'mobile',
            doc: "Share a Prize Win on Facebook",

            params: {
                message : {
                    type: "String",
                    description:"The user entered message - can be empty"
                }
            },
            returns:"success_message"
        }
    },

    resend : {
        post: {
            access: 'mobile',
            doc: "Resend an emailed prize",

            params: {
            },

            returns:"success_message"
        }
    }
};
