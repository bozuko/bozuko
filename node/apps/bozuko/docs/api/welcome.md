### Welcome to the Bozuko API Documentation

The Bozuko API is a RESTful API. It follows the principle of [HATEOAS](http://en.wikipedia.org/wiki/HATEOAS) or Hypermedia as the engine of application state. However, it does not use traditional hypermedia formats such as xhtml. Since the clients of the API are assumed to be driven by machines instead of humans we chose JSON as the data format, or representation. JSON has the additional benefits of being easily manipulated by javascript and human readable enough to simplify packet sniff debugging.

In order to follow the principle of HATEOAS there needs to be a way to follow links from one resource representation to the next. There also needs to be a standard vocabulary that allows the client to find the necessary data inside the representaions returned from the server. This vocabulary is dependent upon the needs of the Bozuko Engine and the names chosen for the JSON properties tend to be specific to Bozuko. Since the vocabulary is not generic it is very difficult to lay out a general pattern, although attempts have been made to be as consistent as possible. It is easiest and clearest to describe the vocabulary with named JSON objects called *transfer objects* that get returned by the server. An example should help make this clearer. Note that all transfer objects are detailed in the transfer objects tab.

*Transfer Object*: **Page**

    {
        id: "Number",
        name: "String",
        img: "String",
        facebook_page: "String",
        category: "String",
        website: "String",
        location: {
            street: "String",
            city: "String",
            state: "String",
            country: "String",
            zip: "String",
            latitude: "String",
            longitude: "String"
        },
        phone: "String",
        fan_count: "String",
        checkins: "Number",
        info: "String",
        games: [{
            id: "Number",
            name: "String",
            icon: "String",
            description: "String",
            prize: "String"
        }],
        links: {
            contest: "String",
            facebook_login: "String",
            facebook_checkin: "String",
            contest_result: "String",
            share: "String",
            feedback: "String"
        }
    }

The above shows a *Page* transfer object. Note that their exists a *links* property in this transfer object that allows navigation of the application. The names of these links are guaranteed not to change and also guaranteed to return the transfer objects documented in the links tab. No URL will ever need to be constructed, and should not be as they may change in the future. The application is driven by following links as shown in the example steps below.

1. Retrieve the entry point object via an HTTP GET to the application entry point at */api*. 
2. Send an HTTP GET to the pages link returned in the entry point object utilizing the parameters described in the *pages* link documentation. You do this by appending those parameters as query parameters to the URL in the *pages* link.
3. Display the pages to the user that were returned from the *pages* in an array of *page* transfer objects.
4. When the user clicks on a page the info from that page transfer object is displayed. 
5. The user is already logged into facebook so decides to checkin by following the facebook_checkin link.
6. A *facebook_checkin_result* transfer object is returned with a number of tokens. 
7. The tokens are credited to the game display, be it the slots or scratch ticket.
8. The *contest_result* link is then followed when the user plays the game and the result of the game is returned in a contest_result object.


There are benefits to this type of system. The client never has to know the URIs of the service except for the entry point. This decouples the URIs from the client interface and eliminates the need for versioning in the URIs. Since the microformat is predefined and guaranteed only to be extended once in production, the system can grow to encompass new transfer objects as well as new properties in existing transfer objects. Thus the only coupling or contract between the client and server is the entry point URI, the transfer objects returned and the standard links.
