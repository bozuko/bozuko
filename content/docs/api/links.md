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

#### Authenticated Methods

##### User 

User authenticated methods reqire that the following parameter is passed along with
the with the request:

 + **token** The token is returned with user transfer object

##### Mobile

Mobile authenticated methods require that the following parameters are passed along with
with the request:

 + **phone_type**  The phone type (iphone4 or android)
 + **phone_id**  The udid of the phone
 + **challenge_response**  The challenge seed is passed with the user transfer object.
   The challenge response is an number that is calculated using the version specific algorithm
   provided to the client developers upon request.


#### Client Version

All API calls must have the client software version passed as an additional parameter 'mobile\_version'
in the URL string. 

#### Documented Links