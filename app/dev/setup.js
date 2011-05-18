var burl = Bozuko.require('util/url').create;

var start = new Date();
var end = new Date();
end.setTime(start.getTime() + 1000 * 60 * 60 * 24 * 30);

var dev = {
    places : {
        fbid:{
            tea_room: '120407357970698',
            bozuko: '177515562277757'
        },
        tea_room: false,
        bozuko: false
    },
    users: {
        fbid:{
            mark: '557924168'
        },
        mark: null
    },
    contests:{
        slots:{
            game:'slots',
            game_config: {
                theme: {
                    name: 'default',
                    base: burl('/games/slots/themes/default/default_theme'),
                    icons: {

                        'bell'      :'bell.png',
                        'bar'       :'bar.png',
                        'cherry'    :'cherry.png',
                        'coins'     :'coins.png',
                        'dollar'    :'dollar.png',
                        'doublebar' :'doublebar.png',
                        'gold'      :'gold.png',
                        'horseshoe' :'horseshoe.png',
                        'lemon'     :'lemon.png',
                        'raygun'    :'raygun.png',
                        'rocket'    :'rocket.png',
                        'seven'     :'seven.png',
                        'shamrock'  :'shamrock.png',
                        'strawberry':'strawberry.png',
                        'watermelon':'watermelon.png'
                    }
                },
                custom_icons: [

                ],
                icons: [
                    'shamrock',
                    'seven',
                    'bell',
                    'rocket',
                    'raygun',
                    'bar',
                    'watermelon',
                    'dollar',
                    'cherries',
                    'coins',
                    'horseshoe',
                    'lemon',
                    'gold',
                    'strawberry',
                    'doublebar'
                ]
            },
            entry_config:[{
                type: 'facebook/checkin',
                tokens: 3,
                duration: 1000 * 60 * 1
            }],
            consolation_config:[{
                who: 'all',
                when: 'always'
            }],
            prizes: [{
                name: 'a Free iPhone4',
                value: '20',
                description: "An brand spankin' new Verizon iPhone4",
                instructions: "Show this screen to an employee",
                total: 20
            },{
                name: 'a kick-ass T-shirt',
                value: '20',
                description: "A Bozuko T-Shirt",
                instructions: "Show this screen to an employee",
                total: 100
            },{
                name: 'a coosy',
                value: '20',
                description: "Keep your beer cold with this Bozuko coosy",
                instructions: "Show this screen to an employee",
                total: 1500
            }],
            consolation_prizes: [{
                name: 'Log',
                value: '5',
                description: 'Log, Log everyone loves a Log!',
                details: 'A beautiful gift for all ages',
                instructions: 'Show this screen to an employee',
                duration: 1000*60*60*24,
                total: 1000
            }],
            rules: 'Official Rules\nTerms, Conditions and Rules (the "Rules") for Online Sweepstakes (the "Promotion")\n  \nNO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT IMPROVE YOUR CHANCE OF WINNING.\n\nThis Promotion is governed by the laws of the New York, and all claims must be resolved in the federal or state courts located in New York. You are not authorized to participate in the Promotion if you are not located within the United States.\n\n1. Eligibility. Entrant must be a legal resident of the United States  who have reached the age of majority (as defined by the law of the state in which entrant resides) as of 4/26/2011. Employees of Same Company ("Sponsor"), its parents, subsidiaries, affiliates, advertising and promotion agencies and their family/household members (defined as parents, spouse, children, and siblings) are not eligible to enter. VOID OUTSIDE THE UNITED STATES AND WHERE PROHIBITED.  All federal, state, and/or local rules and regulations apply. \n\n2. Start/End Dates. The Promotion begins at 1:30 PM on 04/13/2011, \n  and ends at 12:00 PM on 05/13/2011. \n  \n3. How to Enter. Fill out the required entry form, limit one entry per person and per e-mail address. Entrants must have a valid e-mail address. More than one entry from any person or e-mail address will void all entries from that person or e-mail address. No automated entry devices and/or programs permitted. Sponsor is not responsible for lost, late, illegible, stolen, incomplete, invalid, unintelligible, misdirected, technically corrupted or garbled entries, which will be disqualified, or for any failure to receive entries due to transmission errors or technical failures of any kind, including but not limited to malfunction of any network, hardware, or software, whether originating with entrant or Sponsor. Proof of submission will not be deemed to be proof of receipt by Sponsor.\n  \n4. How to Win; Odds of Winning. Winners will be selected in a random drawing from all eligible entries received on or about 4/26/2011, by Sponsor, whose decisions are final and binding in all matters relating to the Promotion. Odds of winning depend on the number of eligible entries received. Potential winners will be notified by email on or about 4/26/2011. Each entrant selected as a potential winner must comply with all terms and conditions set forth in these Official Rules, and winning is contingent upon fulfilling all these requirements. \n  \n5. Prizes. The following prizes will be awarded:\n  \nGrand Prize: Trip to vegas All expenses paid vacation to beautiful Las Vegas Approximate retail value: $1000. \n \n\n\nTotal Approximate Retail Value of All Prizes Combined: $1000. Sponsor makes no warranties with regard to the prizes. Prizes are not transferable.No substitution of prizes is allowed by winner(s), but Sponsor reserves the right to substitute a prize of equal or greater value. Prizes are not redeemable by winner for cash value. All taxes, fees and surcharges on prizes are the sole responsibility of winner.\n\n6. Affidavit of Eligibility/Release. Each winner will be required to execute an Affidavit of Eligibility, a Liability Release, and, where lawful, a Publicity Release within fourteen (14) days of prize notification. If the winner cannot be contacted within five (5) calendar days of first notification attempt, if prize or prize notification is returned as undeliverable, if winner rejects the prize or in the event of noncompliance with these Rules, the prize will be forfeited and an alternate winner will be selected from the remaining eligible entries. . If a prize is forfeited, no compensation will be given. Limit one prize per household.\n\n7. Conditions. By participating, entrants and winner(s) agree to release and hold harmless Sponsor, and its parent companies, subsidiaries, affiliates, advertising and promotion agencies, partners, representatives, agents, successors, assigns, employees, officers and directors, from any and all liability for loss, harm, damage, injury, cost or expense whatsoever, including without limitation property damage, personal injury and/or death which may occur in connection with, preparation for, travel to, or participation in the Promotion, or possession, acceptance and/or use or misuse of prize or participation in any Promotion-related activity and for any claims based on publicity rights, defamation or invasion of privacy and merchandise delivery. Sponsor is not responsible if the Promotion cannot take place or if any prize cannot be awarded due to travel cancellations, delays or interruptions due to acts of God, acts of war, natural disasters, weather, or acts of terrorism.\n\n8. Miscellaneous. All entries become the sole property of Sponsor and none will be acknowledged or returned under any circumstances.\n\nIn the event of a dispute, entries will be deemed made by the authorized account holder of the e-mail address submitted at the time of entry. The "authorized account holder" is deemed the natural person who is assigned to an e-mail address by an Internet service provider or other online organization responsible for assigning e-mail addresses for the domain associated with the submitted e-mail address. A potential winner may be requested to provide proof that he/she is the authorized account holder of the e-mail address associated with the winning entry.\n\nIf for any reason the Promotiois not capable of proceeding as planned, including due to computer virus, bugs, tampering, unauthorized intervention, fraud, technical failure, human error, or any other causes that affect the security or proper conduct of the Promotion, Sponsor reserves the right in its sole discretion, to disqualify any individual who tampers with the entry process, and to cancel, terminate, modify or suspend the Promotion.\n\nSponsor is not responsible for any error, interruption, deletion, defect, delay in operation or transmission; communications failure; loss, theft or destruction of entries; unauthorized access to or alteration of entries; any technical malfunction or problem with any telephone network or lines, computer or online systems, computer equipment or software; failure of any e-mail or entry to be received by Sponsor (including due to technical problems or traffic congestion on the Internet or at any website); or any injury or damage to entrant\'s or any person\'s computer related to or resulting from participation or downloading any materials in the Promotion. \n\nSponsor may prohibit an entrant from participating in the Promotion or winning a prize if, in its sole discretion, it determines that the entrant is attempting or likely to undermine the legitimate operation of the Promotion, including by cheating, hacking, deception, use of automated quick entry programs or other unfair playing practices, or intends or is likely to annoy, abuse, threaten, or harass any other entrants or Sponsor representatives.\n\nCaution: Any attempt by an entrant to deliberately damage any website or undermine the legitimate operation of the Promotion may violate criminal or civil laws and should such an attempt be made, Sponsor reserves the right to seek damages from that person to the fullest extent permitted by law, in addition to any other legal and/or equitable remedies that are or may be available.\n\n9. Use of Data. Sponsor will be collecting personal data about entrants online, in accordance with its privacy policy. Please review Sponsor\'s privacy policy at http://bozuko.com/privacy. By participating in the Promotion, entrants hereby agree to Sponsor\'s collection and usage of their personal information in accordance with Sponsor\'s privacy policy, and entrants acknowledge that they have read and accepted Sponsor\'s privacy policy.\n\n10. List of Winners. To obtain a list of winners, visit http://bozuko.com, or send a self-addressed, stamped envelope to \nSame Company, 1 Main St,  New York, New York, 10006.\n\n11. Sponsor. The Sponsor of this Promotion is Same Company, 1 Main St,  New York, New York, 10006.',
            total_entries: 1000,
            start: start,
            end: end
        },

        'scratch':{
            game:'scratch',
            game_config: {
                theme: {
                    name: 'default',
                    base: burl('/games/scratch/themes/default/default_theme'),
                    images: {
                        'background' : 'background.png'
                    }
                }
            },
            entry_config:[{
                type: 'facebook/checkin',
                tokens: 3,
                duration: 1000 * 60 * 2
            }],
            prizes: [{
                name: 'a trip to Jamaica mon',
                value: '2000',
                description: "Dude - you're going to Jamaica to get Irie!",
                instructions: "Show this screen to the top dog of the establishment",
                total: 20
            },{
                name: 'a trapper keeper',
                value: '20',
                description: "An awesome neon green trapper keeper straight from the 80s.",
                instructions: "Show this screen to an employee",
                total: 100
            },{
                name: 'a twinkie',
                value: '20',
                description: "An unexpiringly delicious treat",
                instructions: "Show this screen to an employee",
                total: 1500
            }],
            rules: 'Official Rules\nTerms, Conditions and Rules (the "Rules") for Online Sweepstakes (the "Promotion")\n  \nNO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE DOES NOT IMPROVE YOUR CHANCE OF WINNING.\n\nThis Promotion is governed by the laws of the New York, and all claims must be resolved in the federal or state courts located in New York. You are not authorized to participate in the Promotion if you are not located within the United States.\n\n1. Eligibility. Entrant must be a legal resident of the United States  who have reached the age of majority (as defined by the law of the state in which entrant resides) as of 4/26/2011. Employees of Same Company ("Sponsor"), its parents, subsidiaries, affiliates, advertising and promotion agencies and their family/household members (defined as parents, spouse, children, and siblings) are not eligible to enter. VOID OUTSIDE THE UNITED STATES AND WHERE PROHIBITED.  All federal, state, and/or local rules and regulations apply. \n\n2. Start/End Dates. The Promotion begins at 1:30 PM on 04/13/2011, \n  and ends at 12:00 PM on 05/13/2011. \n  \n3. How to Enter. Fill out the required entry form, limit one entry per person and per e-mail address. Entrants must have a valid e-mail address. More than one entry from any person or e-mail address will void all entries from that person or e-mail address. No automated entry devices and/or programs permitted. Sponsor is not responsible for lost, late, illegible, stolen, incomplete, invalid, unintelligible, misdirected, technically corrupted or garbled entries, which will be disqualified, or for any failure to receive entries due to transmission errors or technical failures of any kind, including but not limited to malfunction of any network, hardware, or software, whether originating with entrant or Sponsor. Proof of submission will not be deemed to be proof of receipt by Sponsor.\n  \n4. How to Win; Odds of Winning. Winners will be selected in a random drawing from all eligible entries received on or about 4/26/2011, by Sponsor, whose decisions are final and binding in all matters relating to the Promotion. Odds of winning depend on the number of eligible entries received. Potential winners will be notified by email on or about 4/26/2011. Each entrant selected as a potential winner must comply with all terms and conditions set forth in these Official Rules, and winning is contingent upon fulfilling all these requirements. \n  \n5. Prizes. The following prizes will be awarded:\n  \nGrand Prize: Trip to vegas All expenses paid vacation to beautiful Las Vegas Approximate retail value: $1000. \n \n\n\nTotal Approximate Retail Value of All Prizes Combined: $1000. Sponsor makes no warranties with regard to the prizes. Prizes are not transferable.No substitution of prizes is allowed by winner(s), but Sponsor reserves the right to substitute a prize of equal or greater value. Prizes are not redeemable by winner for cash value. All taxes, fees and surcharges on prizes are the sole responsibility of winner.\n\n6. Affidavit of Eligibility/Release. Each winner will be required to execute an Affidavit of Eligibility, a Liability Release, and, where lawful, a Publicity Release within fourteen (14) days of prize notification. If the winner cannot be contacted within five (5) calendar days of first notification attempt, if prize or prize notification is returned as undeliverable, if winner rejects the prize or in the event of noncompliance with these Rules, the prize will be forfeited and an alternate winner will be selected from the remaining eligible entries. . If a prize is forfeited, no compensation will be given. Limit one prize per household.\n\n7. Conditions. By participating, entrants and winner(s) agree to release and hold harmless Sponsor, and its parent companies, subsidiaries, affiliates, advertising and promotion agencies, partners, representatives, agents, successors, assigns, employees, officers and directors, from any and all liability for loss, harm, damage, injury, cost or expense whatsoever, including without limitation property damage, personal injury and/or death which may occur in connection with, preparation for, travel to, or participation in the Promotion, or possession, acceptance and/or use or misuse of prize or participation in any Promotion-related activity and for any claims based on publicity rights, defamation or invasion of privacy and merchandise delivery. Sponsor is not responsible if the Promotion cannot take place or if any prize cannot be awarded due to travel cancellations, delays or interruptions due to acts of God, acts of war, natural disasters, weather, or acts of terrorism.\n\n8. Miscellaneous. All entries become the sole property of Sponsor and none will be acknowledged or returned under any circumstances.\n\nIn the event of a dispute, entries will be deemed made by the authorized account holder of the e-mail address submitted at the time of entry. The "authorized account holder" is deemed the natural person who is assigned to an e-mail address by an Internet service provider or other online organization responsible for assigning e-mail addresses for the domain associated with the submitted e-mail address. A potential winner may be requested to provide proof that he/she is the authorized account holder of the e-mail address associated with the winning entry.\n\nIf for any reason the Promotiois not capable of proceeding as planned, including due to computer virus, bugs, tampering, unauthorized intervention, fraud, technical failure, human error, or any other causes that affect the security or proper conduct of the Promotion, Sponsor reserves the right in its sole discretion, to disqualify any individual who tampers with the entry process, and to cancel, terminate, modify or suspend the Promotion.\n\nSponsor is not responsible for any error, interruption, deletion, defect, delay in operation or transmission; communications failure; loss, theft or destruction of entries; unauthorized access to or alteration of entries; any technical malfunction or problem with any telephone network or lines, computer or online systems, computer equipment or software; failure of any e-mail or entry to be received by Sponsor (including due to technical problems or traffic congestion on the Internet or at any website); or any injury or damage to entrant\'s or any person\'s computer related to or resulting from participation or downloading any materials in the Promotion. \n\nSponsor may prohibit an entrant from participating in the Promotion or winning a prize if, in its sole discretion, it determines that the entrant is attempting or likely to undermine the legitimate operation of the Promotion, including by cheating, hacking, deception, use of automated quick entry programs or other unfair playing practices, or intends or is likely to annoy, abuse, threaten, or harass any other entrants or Sponsor representatives.\n\nCaution: Any attempt by an entrant to deliberately damage any website or undermine the legitimate operation of the Promotion may violate criminal or civil laws and should such an attempt be made, Sponsor reserves the right to seek damages from that person to the fullest extent permitted by law, in addition to any other legal and/or equitable remedies that are or may be available.\n\n9. Use of Data. Sponsor will be collecting personal data about entrants online, in accordance with its privacy policy. Please review Sponsor\'s privacy policy at http://bozuko.com/privacy. By participating in the Promotion, entrants hereby agree to Sponsor\'s collection and usage of their personal information in accordance with Sponsor\'s privacy policy, and entrants acknowledge that they have read and accepted Sponsor\'s privacy policy.\n\n10. List of Winners. To obtain a list of winners, visit http://bozuko.com, or send a self-addressed, stamped envelope to \nSame Company, 1 Main St,  New York, New York, 10006.\n\n11. Sponsor. The Sponsor of this Promotion is Same Company, 1 Main St,  New York, New York, 10006.',
            total_entries: 1000,
            start: start,
            end: end
        }
    }
};

Bozuko.dev = dev;

function initUser(cb){
    // lets make sure we have the Bozuko place in the database
    var fbid = Bozuko.dev.users.fbid.mark;
    Bozuko.models.User.findByService('facebook',fbid,function(error, user){
        if( error ){
            return console.error('main::initTests - error looking for test user');
        }
        if( !user ){
            return Bozuko.service('facebook').user({user_id:fbid}, function(error, user){
                console.log(user);
                Bozuko.models.User.createFromServiceObject(user, function(error, user){
                    test_user = user;
                    cb();
                });
            });
        }
        else{
            test_user = user;
            return Bozuko.models.Checkin.remove({user_id: user._id},function(error){
                return cb();
            });
        }
    });
}

function initPlace(place_id, featured, cb){
    // lets make sure we have the Bozuko place in the database
    Bozuko.models.Page.findByService('facebook',place_id,function(error, place){
        if( error ){
            return console.error('main::initTests - error looking for Bozuko object');
        }
        if( !place ){
            return Bozuko.service('facebook').place({place_id:place_id}, function(error, place){
                Bozuko.models.Page.createFromServiceObject(place, function(error, place){
                    return setupPlace(place, featured, cb);
                });
            });
        }
        else{
            return setupPlace(place, featured, cb);
        }
    });
}

function setupPlace(place, featured, cb){
    place.test = true;
    place.announcement = 'Get down here on friday for free apps and beer. That\'s just how we roll.';
    place.featured = featured;
    place.owner_id = test_user._id;
    test_place = place;
    place.save(function(error){
        // not quite done, need to add a contest
        Bozuko.models.Contest.remove({page_id:place._id},function(){
            // create a fake contest
            var contest = new Bozuko.models.Contest(Bozuko.dev.contests.slots);
            contest.page_id = place._id;
            contest.active = true;
            contest.free_play_pct = 50;
            contest.prizes.forEach(function(prize){
                prize.duration = 1000*60*60*24;
            });
            contest.generateResults(function(error){
                var contest = new Bozuko.models.Contest(Bozuko.dev.contests.scratch);
                contest.page_id = place._id;
                contest.active = true;
                contest.prizes.forEach(function(prize){
                    prize.duration = 1000*60*60*24;
                });
                contest.generateResults(function(error){
                    if( error ) console.log(error, contest.doc );
                    cb();
                });
            });
        });
    });
}

module.exports.init = function(cb){
    console.log('dev setup init');
    initUser(function(){
        initPlace( dev.places.fbid.bozuko, true, function(){
            initPlace( dev.places.fbid.tea_room, false, function(){
                console.log('Development objects - setup complete');
                if(cb) cb();
            });
        });
    });
}