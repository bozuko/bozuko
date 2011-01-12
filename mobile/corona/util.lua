module(..., package.seeall)

-- For nested tables, use level param to specify how deep to go. It's 1 by default.
function printTable( t, label, level )
        if label then print( label ) end
        level = level or 1
        if t then
                for k,v in pairs( t ) do
                        local prefix = ""
                        for i=1,level do
                                prefix = prefix .. "\t"
                        end
 
                        print( prefix .. "[" .. tostring(k) .. "] = " .. tostring(v) )
                        if type( v ) == "table" then
                                print( prefix .. "{" )
                                printTable( v, nil, level + 1 )
                                print( prefix .. "}" )
                        end
                end
        end
end

-- http://developer.anscamobile.com/code/multiline-text-width-pixel
function autoWrappedText(text, font, size, color, width)
   if text == '' then return false end
   font = font or native.systemFont
   size = tonumber(size) or 12
   color = color or {255, 255, 255}
   width = width or display.stageWidth
   
   local result = display.newGroup()
   local currentLine = ''
   local currentLineLength = 0
   local lineCount = 0
   local left = 0
   for line in string.gmatch(text, "[^\n]+") do
      for word, spacer in string.gmatch(line, "([^%s%-]+)([%s%-]*)") do
	 local tempLine = currentLine..word..spacer
	 local tempDisplayLine = display.newText(tempLine, 0, 0, font, size)
	 tempDisplayLine.alpha = 0
	 if tempDisplayLine.width <= width then
	    currentLine = tempLine
	    currentLineLength = tempDisplayLine.width
	 else
	    local newDisplayLine = display.newText(currentLine, 0, (size * 1.3) * (lineCount - 1), font, size)
	    newDisplayLine:setTextColor(color[1], color[2], color[3])
	    result:insert(newDisplayLine)
	    lineCount = lineCount + 1
	    if string.len(word) <= width then
	       currentLine = word..spacer
	       currentLineLength = string.len(word)
	    else
	       local newDisplayLine = display.newText(word, 0, (size * 1.3) * (lineCount - 1), font, size)
	       newDisplayLine:setTextColor(color[1], color[2], color[3])
	       result:insert(newDisplayLine)
	       lineCount = lineCount + 1
	       currentLine = ''
	       currentLineLength = 0
	    end 
	 end
      end
      local newDisplayLine = display.newText(currentLine, 0, (size * 1.3) * (lineCount - 1), font, size)
      newDisplayLine:setTextColor(color[1], color[2], color[3])
      result:insert(newDisplayLine)
      lineCount = lineCount + 1
      currentLine = ''
      currentLineLength = 0
   end
   result:setReferencePoint(display.CenterReferencePoint)
   return result
end
