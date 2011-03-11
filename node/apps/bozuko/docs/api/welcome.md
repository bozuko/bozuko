### Welcome to the Bozuko API Documentation

The Bozuko API is a RESTful API. It follows the principle of HATEOAS or Hypermedia as the engine of application state. However, it does not use traditional hypermedia formats such as xhtml. Since the clients of the API are assumed to be driven by machines instead of humans we chose JSON as the data format, or representation. JSON has the additional benefits of being easily manipulated by javascript and human readable enough to simplify packet sniff debugging.

In order to follow the principle of HATEOAS there needs to be a way to follow links from one resource representation to the next. There also needs to be a standard vocabulary that allows the client to find the necessary data inside the representaions returned from the server. This vocabulary is dependent upon the needs of the Bozuko Engine and the names chosen for the JSON properties tend to be specific to Bozuko. Since the vocabulary is not generic it is very difficult to lay out a general pattern, although attempts have been made to be as consistent as possible. It is easiest and clearest to describe the vocabulary, or microformat, with named JSON objects that get returned by the API. An example should help make this clearer. Note that all Object Types are detailed in the Object Type section.

*Object Type*: **Page**

    {
        "id" : "Number",
        "name" : "String",
        "picture" : "String",
        "facebook_page" : "String",
        "category" : "String",
        "website" : "String",
        "location" : {
            "street" : "String",
            "city" : "String",
            "state" : "String",
            "country" : "String",
            "zip" : "String",
            "latitude" : "String",
            "longitude" : "String"
        },
        "phone" : "String",
        "fan_count" : "String",
        "checkins" : "Number",
        "games" : [{
            "id" : "Number",
            "name" : "String",
            "icon" : "String",
            "description" : "String",
            "prize" : "String",
        }],
        "links" : {
            "contest" : "String",
            "checkin" : "String",
            "game_result" : "String"
        }       
    }

The above shows a *Page* object type. Note that their exists a *links* property in the *Page* object type.  Most object types contain a *links* object that has standard property names that relate to Bozuko functionality. These property names have URIs attached to them. The standard links object properties and the allowed methods and parameters are documented in the links section. Thus when a client of the API follows a link it will know which methods and parameters are allowed and the exact format(s) of the return value.


Their are benefits to this type of system. The client never has to know the URIs of the service except for the entry point. This decouples the URIs from the client interface and eliminates the need for versioning in the URIs. Since the microformat is predefined and guaranteed only to be extended once in production, the system can grow to encompass new JSON object types as well as new properties in existing JSON objects. Thus the only coupling to the client is the entry URI, the object types returned and the standard links.

### Standard Links

**Note that required parameters are in bold**

<table border=1>
    <tr>
    <b>
        <td>Name</td>
        <td>Methods</td>
        <td>Params</td>
        <td>Object Type</td>
   </b>
   </tr>
   <tr>
       <td>page</td>
       <td>GET</td>
       <td></td>
       <td>Page</dt>
   </tr>
   <tr>
       <td>contest</td>
       <td>GET</td>
       <td></td>
       <td>Contest</td>
   </tr>
   <tr>
       <td>checkin</td>
       <td>POST</td>
       <td><b>lat</b>: "Number", <b>lng</b>: "Number", message: "String"</td>
       <td>Checkin_result</td>
   </tr>
   <tr>
      <td>result</td>
      <td>POST</td>
      <td><b>game</b>: "String"</td>
      <td>Play_result</td>
   </tr>
</table>


