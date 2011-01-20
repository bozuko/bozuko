module(..., package.seeall)

local ui = require("ui")

local navBarHeight = 40
local disclaimerHeight = 30
local disclaimerY = display.contentHeight - disclaimerHeight
local menuBarHeight = 50
local menuBarY = disclaimerY - menuBarHeight
local contentWidth = display.contentWidth

widget.screenTop = navBarHeight
widget.screenBottom = menuBarY

function newNavBar()
   local group = display.newGroup()
   local bg = display.newRect(group, 0, 0, contentWidth, navBarHeight)
   bg:setFillColor(140,0,0)
   local title = display.newText(group, "bozuko", 0, 0, "American Typewriter", 32)
   title.x = contentWidth/2
   title.y = 20
   return group
end

function newLoopButton(f)
   local loopButton = ui.newButton {
      default = "loopButton.png",
      over = "loopButton_over.png",
      onRelease = f
   }
   loopButton.x = contentWidth - loopButton.width/2 - 5
   loopButton.y = navBarHeight/2
   return loopButton
end

function newBackButton(f)
   local backButton = ui.newButton {
      default = "backButton.png", 
      over = "backButton_over.png",
      onRelease = f
   }
   backButton.x = math.floor(backButton.width/2) + 5 
   backButton.y = navBarHeight/2
   return backButton
end

function newDisclaimer()
   local group = display.newGroup()
   local bg = display.newRect(group, 0, disclaimerY, contentWidth, disclaimerHeight)
   bg:setFillColor(0,0,0)
   local text = display.newText(group, "Must be 13+ to play. Please see official rules.", 0, 
				 disclaimerY, native.systemFont, 12)
   text:setTextColor(153,153,153)
   group:addEventListener("touch", function(e) return true end)
   return group
end

function newMenuBar(f)
   local group = display.newGroup()
   local bg = display.newRect(group, 0, menuBarY, contentWidth, menuBarHeight)
   bg:setFillColor(140,0,0)
   local listButton = ui.newButton {
      default = "homeButton.jpg",
      over = "homeButton_over.jpg",
      onRelease = f,
      text = "places",
      textColor = {153,153,153},
      size = 14,
      id = "listButton"
   }
   listButton.x = contentWidth/2
   listButton.y = bg.y
   group:insert(listButton)
		
   group:addEventListener("touch", function(e) return true end)
   return group
end

function newFacebookLogoutButton()
   local function f()
      local path = system.pathForFile("fbauth.txt", system.DocumentsDirectory)
      os.remove(path)
      native.showWebPopup("http://m.facebook.com/logout.php?confirm=1&next=http://bozuko.com:8000/get_token", 
			  {hasBackground = false, urlRequest = function(e) native.cancelWebPopup() end})
   end
   local button = ui.newButton {
      default = "fbconnect_logout.jpg",
      onRelease = f,
      id = "fbLogoutButton"
   }
   button.x = contentWidth - math.floor(button.width/2) - 5
   button.y = navBarHeight/2
   return button
end
