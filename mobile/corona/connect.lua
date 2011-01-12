-- connect.lua module file
-- Functions for Async/Sync 
module(..., package.seeall)
 
local http = require( "socket.http" ) -- Required library for HTTP connection
local socket = require( "socket") -- Required library to test socket connection
local async_http = require( "async_debug")
 
 
-- This function will start the HTTP process either by calling doHTTP directly for Async or a delayed launch for Sync so that we can show the activity screen
function startHTTP( url, host ) 
        if connect.silent == nil then connect.silent = false end -- Default to NOT silent
        if not connect.silent then activity( true ) end -- If not running in silent mode show the activity indicator
        -- If mode is Sync HTTP
        if connect.mode == "Sync" then
                timer.performWithDelay( 100, function() doHTTP( url, host ); end) -- Launch delayed Sync HTTP request so activity indicator can fire
        else
                doHTTP( url, host )  -- Go straight to request if we're running ASync
        end
end
 
-- Calls different request types depending on whether Sync or ASync is used
function doHTTP( url, host )
        local hostFound = true
        local con = socket.tcp()
        con:settimeout( 2 ) -- Timeout connection attempt after 2 seconds
                
        -- Check if socket connection is open
        if con:connect(host, 8000) == nil then 
                hostFound = false
                print( "Host Not Found" )
        end
        
        if hostFound then -- If we have a connection
                print( connect.mode .. " Running ..." )
                if connect.mode == "Sync" then
                        data,c,h = http.request( url ) -- Fetch data via HTTP 
                        endHTTP( data )
                elseif connect.mode == "ASync" then
                        async_http.request(url,  endHTTP )
                end
        else
                endHTTP( hostFound ) -- No connection so jump straight to endHTTP and report failure
        end
                        
end
 
function endHTTP( data )
        if not connect.silent then 
                activity( false ) 
        end -- If not running in silent mode remove the activity indicator
        print(  "Data Connection Complete"  )
        connect.onComplete( data )  -- Send data  to onComplete function
end
 
function activity( mode )
 
   if mode then 
      native.setActivityIndicator( true )
   else
      native.setActivityIndicator( false )
   end             
   
end
