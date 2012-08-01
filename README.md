# Babson Global Consortium

## Security

Security in a single page application is quite a bit different than a typical round-trip application.

In an application where the user navigates using submitted URLs and page refreshes (round-trip),
the security filters are triggered based on the URL of the new page. In order to achieve the
desired security restrictions URL patterns are declaritively secured.

In a single-page application there is not browser navigation. Sure, the URLs change in the browser's
location bar, but there is no actual navigational request-response action. Instead, there may
be an AJAX submission for content resources. It is these submissions that are secured.

### Implementation

Let's take a common example in this application, the request for a particular resource. User's
in GC will be able to view a particular resource regardless of there account status (ROLE). The
full resource content and download links are provided to them if they have ROLE_PREMIUM. If they
do not have this role, they are only presented with the abstract for the resource and no download
links.

Let's assume an unauthenticated client.

1. A resource is requested via AJAX to the web server.
2. The web server makes an unauthenticated request to the REST server for the particular resource.
3. The REST server returns a version of the resource with the content body and download links
   stripped.
4. The web server returns the JSON resource to the client for rendering. Part of this rendering
   is a link for the user to sign in.
5. When the user signs in,

### Use Cases

#### Accessing a protected resource

This is the case where we make an AJAX request for protected data:

1. Client AJAX request:  `GET /protected/123`
3. If Client is authenticated and authorized, the resource is returned if the user has correct
   permissions.
4. If Client is authenticated and not authorized, a 403 is returned.
    1. The client handles the 403 response with a message to the user. These should be rare
       occurences since we don't want to provide users with a link that will lead to a 403.
5. If Client is not authenticated, a 401 is returned.
    1. The client will save the request url which triggered the 401.
    2. The client will prompt the user for credentials.
    3. The client submits the URL via AJAX to the server.
    4. The server verifies the users credentials.
        1. The original request is resubmitted.
    5. The server denies the user's credentials.
        1. The user is notified of the problem.

#### Instance level security

This occurs when a resource instance must be inspected and compared with the user's
permissions to determine whether access will be granted.

1. Client AJAX request:  GET /restricted/123
3. If Client is authenticated and authorized, the resource is returned if the user has correct
   permissions.
4. If Client is authenticated and not authorized, the resource is returned, but stripped of
   protected content. _Should we indicate this issue in the response?_
5. If Client is not authenticated, a 401 is returned.
    1. The client will save the request url which triggered the 401.
    2. The client will prompt the user for credentials.
    3. The client submits the URL via AJAX to the server.
    4. The server verifies the users credentials.
        1. The original request is resubmitted.
    5. The server denies the user's credentials.
        1. The user is notified of the problem.

