The page object contains all the data needed for several screens, including
the list page, the business description page, and the games screens.

The **registered** Boolean flag indicates whether or not the page is a
Bozuko listed business (true) or if the data was gathered from a 3rd party
service (false).

Fields that will be optionally returned depending on the **registered** status
are:


+ **id** The Bozuko specific page (should be used for caching)
+ **favorite** Only available for Bozuko pages.
+ **announcement** Only available or Bozuko pages.
+ **games** Only available or Bozuko pages.
