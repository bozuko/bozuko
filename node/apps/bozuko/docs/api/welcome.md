### Welcome to the Bozuko API Documentation

The Bozuko API is a RESTful API. It follows the principle of HATEOAS or Hypermedia as the engine of application state. However, it does not use traditional hypermedia formats such as xhtml. Since the clients of the API are assumed to be driven by machines instead of humans we chose JSON as the data format, or representation. JSON has the additional benefits of being easily manipulated by javascript and human readable enough to simplify packet sniff debugging.

In order to follow the principle of HATEOAS there needs to be a way to follow links from one resource representation to the next. There also needs to be a standard vocabulary that allows the client to find the necessary data inside the representaions returned from the server. This vocabulary is dependent upon the needs of the Bozuko Engine and the names chosen for the JSON properties tend to be specific to Bozuko. Since the vocabulary is not generic it is very difficult to lay out a general pattern, although attempts have been made to be as consistent as possible. It is easiest and clearest to describe the vocabulary with named JSON objects called *transfer objects* that get returned by the server. An example should help make this clearer. Note that all Transfer_Objects are detailed in the Transfer Objects tab.

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

The above shows a *Page* transfer object. An array of these objects is returned when an HTTP GET is sent to the entry point URI of the server: **/pages**. This entry point is documented in the **pages** link.  Note that their exists a *links* property in the *Page* transfer object.  Most transfer objects contain a *links* object that provides the URLs needed to navigate the application. After retrieving the initial pages list via the application entry point at */pages*, the application can be navigated by following named links. These names are guaranteed not to change and also guaranteed to return the transfer objects documented in the links tab.
No URL will ever need to be constructed, and should not be as they may change in the future.


Their are benefits to this type of system. The client never has to know the URIs of the service except for the entry point. This decouples the URIs from the client interface and eliminates the need for versioning in the URIs. Since the microformat is predefined and guaranteed only to be extended once in production, the system can grow to encompass new transfer objects as well as new properties in existing transfer objects. Thus the only coupling or contract between the client and server is the entry point URI, the transfer_objects returned and the standard links.
