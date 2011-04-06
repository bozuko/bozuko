### Links

Links are the channel of communication from the client application to the server. They will
be returned with transfer objects in the "links" hash object. The links returned with these
objects will have specific url strings that may be associated with specific objects, so it is
important to use these provided links during the application runtime.

Transfer Objects may also have embedded objects, so you may need to traverse through these
embedded objects to get the necessary link.

#### Starting Point

The first url that you should visit is */api*. This will return the entry_point object, which
contains the links to each of the main areas of the application.

#### Content-Type

When creating the HTTP request, please provide the correct header for the Content-Type. The
API accepts requests in JSON format with the application/json header, and also the traditional
application/x-www-form-urlencoded header. The POST or PUT bodies should be formatted accordingly.
Either header will work fine with GET requests as the parameters are appended to the url.

#### User Authentication

Any links that are documented with Access Level of user require that the user token be passed
as an additional parameter 'token'. The user token is supplied with the user object after
a successful login.

#### Client Version

All API calls must have the client software version passed as an additional parameter 'version'
in the URL string. 

#### Documented Links