The page object contains all the data needed for several screens, including
the list page, the business description page, and the games screens.

The **registered** Boolean flag indicates whether or not the page is a
Bozuko listed business (true) or if the data was gathered from a 3rd party
service (false).

Fields that will be optionally returned depending on the **registered** status
are:

+ **id** The Bozuko specific page (should be used for caching)
+ **favorite** Only available for Bozuko pages.
+ **announcement** Only available for Bozuko pages.
+ **games** Only available for Bozuko pages.

The **like_url** is the url that should be openned in a webview when the "Like
us on Facebook" button is clicked. When the user performs the "Like" action,
the webview's url will change to "bozuko://webview.close" to indicate that it
should be closed. The closing of the webview does not guarantee that the user
actually performed the "Like" action, so you should refresh the "page" link to
get the most current page object (which should have the correct "liked" Boolean
as well as updated game states if they depend on a facebook like).