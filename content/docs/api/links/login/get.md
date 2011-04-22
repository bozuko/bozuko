The user login process consists of openning this link in a top level web view or iframe.
The user will be able to login via the services provided by Bozuko (primarily facebook)
at first. They will be redirected to the OAuth page for the respective service.

After the OAuth process with the 3rd party service, the original login url will be returned
as an HTML page. In order to avoid the necessity for the client to parse the HTML body, the
pertinent information is included in the URL as a GET parameter.

The client should watch the url of the webview for when it changes back to the original with one
of the following parameters appended.

+ **token** If the user allows the Bozuko application the proper permissions, the web view will be
    redirected to the login url with the user token appended to the url as GET parameter
    (eg. /user/login?token=12312323123123123213). Make sure to escape this string as it will be url encoded.
    
    This should be used to call the _user_ link and get the users information (including the
    challenge seed which will be needed to perform _Mobile Authenticated_ methods).
    
    This token must be also passed to any _User Authenticated_ methods.
    
+ **error** If the user does not allow the Bozuko application the proper permissions, the web view
    will be return the login url with an error appended as a GET parameter.
