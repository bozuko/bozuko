var burl = Bozuko.require('util/url').create;

exports.transfer_objects = {

    page: {

        doc: "A Bozuko Page",

        def: {
            id: "String",
            name: "String",
            image: "String",
            nobranding: "Boolean",
            share_url: "String",
            like_url: "String",
            like_button_url: "String",
            like_button_url_large: "String",
            game_background: "String",
            facebook_page: "String",
            facebook_id: "String",
            category: "String",
            website: "String",
            featured: "Boolean",
            favorite: "Boolean",
            liked: "Boolean",
            registered: "Boolean",
            announcement: "String",
            distance: "String",
            is_place: "Boolean",
            is_facebook: "Boolean",
            location: {
                street: "String",
                city: "String",
                state: "String",
                country: "String",
                zip: "String",
                lat: "Number",
                lng: "Number"
            },

            phone: "String",
            checkins: "Number",
            games: ["game"],
            links: {
                recommend: "String",
                facebook_checkin: "String",
                feedback: "String",
                favorite: "String",
                page: "String",
                page_games: "String"
            }
        },

        create: function(page, user, callback){
            // this should hopefully be a Page model object
            // lets check for a contest
            var self = this;
            var createPage = function(){
                
                var fid = page.registered ? page.service('facebook').sid : page.id;
                
                page.liked = false;
                if( !(user instanceof Bozuko.models.Apikey) ){
                    page.image = page.registered ? burl('/page/'+page.id+'/image') : page.image;
                }
                page.like_url = burl('/facebook/'+fid+'/like.html');
                page.like_button_url = burl('/facebook/'+fid+'/like_button.html');
                page.links = {
                    facebook_page       :'http://facebook.com/'+fid,
                    facebook_checkin    :'/facebook/'+fid+'/checkin'
                    // facebook_like       :'/facebook/'+fid+'/like'
                };
                page.is_place = page.location && page.location.lat && page.location.lng && !(page.location.lat == 0 && page.location.lng == 0);
                if( page.registered ){
                    // page.image = burl('/page/'+page.id+'/image?version=8');
                }
                if( user && ! (user instanceof Bozuko.models.Apikey) ){
                    page.like_url +='?token='+user.token;
                    page.like_button_url += '?token='+user.token;
                    if( page.registered ){

                        // favorite
                        if( ~user.favorites.indexOf( page.id ) ) page.favorite = true;
                        page.links.favorite = '/user/favorite/'+page.id;

                        if( page.service('facebook') ){
                            try{
                                page.liked = user.likes(page);
                                if( page.liked ) delete page.links.facebook_like;
                            }catch(e){
                                page.liked = false;
                            }
                        }
                    }
                    else{
                        try{
                            page.liked = user.likes(fid);
                            if( page.liked ) delete page.links.facebook_like;
                        }catch(e){
                            page.liked = false;
                        }
                    }
                }

                page.is_facebook = ( !page.registered || page.service('facebook') );
                
                if( page.is_facebook && !page.registered ){
                    page.facebook_page = page.data.link;
                    page.facebook_id = fid;
                }
                else if(page.is_facebook && page.service && page.service('facebook') ){
                    page.facebook_page = page.service('facebook').data.link;
                    page.facebook_id = fid;
                }

                // add registered links...
                if( page.registered ){
                    page.share_url          = ('https://bozuko.com/p/'+page.id);
                    page.links.page         ='/page/'+page.id;
                    page.links.share        ='/page/'+page.id+'/share';
                    page.links.feedback     ='/page/'+page.id+'/feedback';
                }
                // non-registered links
                else{
                    page.links.recommend    ='/page/recommend/facebook/'+fid;
                }
                
                if(user instanceof Bozuko.models.Apikey){
                    page.links.page_games   ='/page/'+page.id+'/games';
                }

                page.games = [];
                
                if( page.contests ){
                    page.contests.sort(function(a,b){
                        return +b.start-a.start;
                    });
                    page.contests.forEach(function(contest){
                        page.games.push( contest.getGame() );
                    });
                }

                return self.sanitize(page, null, user, function(){
                    callback.apply(this, arguments);
                });
            };
            return createPage();
        }
    },
    
    page_save_result : {
        doc: "Result of saving a page via PUT or POST",
        def: {
            success: "Boolean",
            errors: "Object",
            error: "String",
            page: "page"
        }
    },

    pages : {
        doc: "List of pages",
        def:{
            "pages" : ['page'],
            "next" : "String",
            "offset" : "Number",
            "count" : "Number",
            "limit" : "Number"
        }
    },
    
    page_games : {
        doc: "List of page games",
        def:{
            "games" : ['game'],
            'offset' : 'Number',
            'limit' : 'Number',
            "count" : "Number"
        }
    }
};

exports.links = {
    pages: {
        get: {
            doc: "Return a list of pages. The center (user) latitude is always required.",

            params: {
                ll : {
                    required: true,
                    type: "String",
                    description: 'The user\'s latitude / longitude separated by a comma (example 42.1234121,-71.2423423). This is always required.'
                },
                bounds : {
                    type: "String",
                    description: 'The bounding geographic box to search within. '+
                                 'This should be passed as 2 points - the bottom left (p1) and top right (p2). '+
                                 'Each points should be passed the same as the ll parameter and also separated by a comma. '+
                                 'An example, where p1=lat1,lng1 and p2=lat2,lng2 would be passed as lat1,lng1,lat2,lng2'
                },
                favorites: {
                    type: "Boolean",
                    description: 'Pass this parameter as true to get a list of user favorites. '
                },
                query: {
                    type:"String",
                    description: "A string to search for"
                },
                limit: {
                    type: "Number",
                    description: "The number of search results to return"
                },
                offset: {
                    type: "Number",
                    description: "The starting result number"
                }
            },

            returns: "pages"

        }
    },

    page: {
        get: {
            doc: "Return a specific page",
            returns: "page"
        },
        
        put: {
            access: 'developer_private',
            returns: 'page_save_result',
            params: {
                facebook_id: {
                    type: "String",
                    description: "The Facebook Page ID (must be unique)",
                    required: true
                },
                name : {
                    type: "String",
                    description: "The name of the page"
                },
                location : {
                    type: "Object",
                    description: "A location description - see <a href=\"#/objects/page\">Page Object</a> for location properties"
                },
                image : {
                    type: "String",
                    description: "The URL of an image for the page - should be square and at least 200 x 200"
                },
                background: {
                    type : "String",
                    description : "Background for the page (value for the css `background` shorthand property)."
                }
            }
        },
        
        post: {
            access: 'developer_private',
            returns: 'page_save_result',
            params: {
                facebook_id: {
                    type: "String",
                    description: "The Facebook Page ID (must be unique)"
                },
                name : {
                    type: "String",
                    description: "The name of the page - defaults to Facebook Page"
                },
                location : {
                    type: "Object",
                    description: "A location description - see <a href=\"#/objects/page\">Page Object</a> for location properties"
                },
                image : {
                    type: "String",
                    description: "The URL of an image for the page - should be square and at least 200 x 200"
                },
                background: {
                    type : "String",
                    description : "Background for the page (value for the css `background` shorthand property)."
                }
            }
        }
    },
    
    page_games : {
        get : {
            access: 'developer_public',
            returns: 'page_games',
            params: {
                limit : {
                    type: "Number",
                    description: "How many records to retrieve at once"
                },
                offset : {
                    type: "Number",
                    description: "Which record to start retrieving at"
                }
            }
        }
    },

    feedback: {
        put: {
            access: 'user',
            doc: "Send feedback to Bozuko and the Page owner",
            params: {
                message:{
                    required: true,
                    type: "String",
                    description: "The message to send to the Business / Bozuko"
                }
            },

            returns: "success_message"
        }
    },

    recommend: {
        post: {
            access: 'user',
            doc: 'Allow a user to recommend Bozuko to a place',
            params: {
                message:{
                    required: true,
                    type: "String",
                    description: "The message to send to the Business / Bozuko"
                }
            },
            returns: 'success_message'
        }
    }
};
