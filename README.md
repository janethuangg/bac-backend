# website-backend

NodeJS backend server for the sternbac.org site, this is currently hosted on heroku 
since the main site is hosted using github pages (i.e. serves static html)

As you'll note, the serve uses the CORS (Cross Origin Resource Sharing) header Access-Control-Allow-Origin=*,
meaning that any website with any origin can access this backend's resources, so make sure that sensitive info is
not placed on here
