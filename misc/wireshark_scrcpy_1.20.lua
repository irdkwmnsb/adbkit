-- lua script to debug scrcpy protocol
usb_scrcpy_protocol = Proto("scrcpy",  "Scrcpy protocol")

usb_adbtest_protocol = Proto("adbtest",  "Adb protocol")

local f_controlMessage = ProtoField.uint8("scrcpy.controlMessage", "ControlMessage", base.DEC)
local f_action = ProtoField.int8 ("scrcpy.action", "Action", base.DEC)
local f_pointerId = ProtoField.uint64("scrcpy.pointerId", "PointerId",   base.DEC)
local f_posX = ProtoField.uint16("scrcpy.posX", "PosX",   base.DEC)
local f_posY = ProtoField.uint16("scrcpy.posY", "PosY",   base.DEC)
local f_screenX = ProtoField.uint16("scrcpy.screenX", "ScreenX",   base.DEC)
local f_screenY = ProtoField.uint16("scrcpy.screenY", "ScreenY",   base.DEC)
local f_pressure = ProtoField.uint16("scrcpy.pressure", "Pressure",   base.DEC)
local f_mouseEvent = ProtoField.uint32("scrcpy.mouseEvent", "MouseEvent",   base.DEC)
local f_keyCode = ProtoField.uint32("scrcpy.keyCode", "KeyCode",   base.DEC)
local f_repeatCount = ProtoField.uint32("scrcpy.repeatCount", "RepeatCount",   base.DEC)
local f_metaState = ProtoField.uint32("scrcpy.metaState", "MetaState",   base.DEC)

usb_scrcpy_protocol.fields = { f_controlMessage, f_action, f_pointerId, f_posX,
                               f_posY, f_screenX, f_screenY, f_pressure, f_mouseEvent,
                               f_keyCode, f_repeatCount, f_metaState
                             }

local function parse_buttons(touch_event_type)
  -- byte & (1 << n) > 0
  local function is_bit_set(byte, n)
    return bit.band(byte, bit.lshift(1, n)) > 0
  end

  local BUTTON_PRIMARY   = 0
  local BUTTON_SECONDARY = 1
  local BUTTON_TERTIARY  = 2
  local BUTTON_BACK      = 3
  local BUTTON_FORWARD   = 4
  local BUTTON_STYLUS_PRIMARY = 5
  local BUTTON_STYLUS_SECONDARY = 6

  local touch_event_number = touch_event_type:uint()
  local buttons_array = {}

  if is_bit_set(touch_event_number, BUTTON_PRIMARY)   then table.insert(buttons_array, "primary")    end
  if is_bit_set(touch_event_number, BUTTON_SECONDARY) then table.insert(buttons_array, "secondary")   end
  if is_bit_set(touch_event_number, BUTTON_TERTIARY)  then table.insert(buttons_array, "tertiary")  end
  if is_bit_set(touch_event_number, BUTTON_BACK)      then table.insert(buttons_array, "back")    end
  if is_bit_set(touch_event_number, BUTTON_FORWARD)   then table.insert(buttons_array, "forward") end
  if is_bit_set(touch_event_number, BUTTON_STYLUS_PRIMARY)  then table.insert(buttons_array, "stylus_prim")  end
  if is_bit_set(touch_event_number, BUTTON_STYLUS_SECONDARY)  then table.insert(buttons_array, "stylus_sec")  end
  local buttons_text = " (none)"
  
  if #buttons_array ~= 0 then
    buttons_text = " (" .. table.concat(buttons_array, ", ") .. ")"
  end

  return buttons_text
end

local mouseEventActionTable = {
  [ 0] = "DOWN",
  [ 1] = "UP",
  [ 2] = "MOVE",
  [ 3] = "CANCEL",
  [ 4] = "OUTSIDE",
  [ 5] = "POINTER_DOWN",
  [ 6] = "POINTER_UP",
  [ 7] = "HOVER_MOVE",
  [ 8] = "SCROLL",
  [ 9] = "HOVER_ENTER",
  [10] = "HOVER_EXIT",
  [11] = "BUTTON_PRESS",
  [12] = "BUTTON_RELEASE",
}

local controlMessageTable = {
  [ 0] = "INJECT_KEYCODE",
  [ 1] = "INJECT_TEXT",
  [ 2] = "INJECT_TOUCH_EVENT",
  [ 3] = "INJECT_SCROLL_EVENT",
  [ 4] = "BACK_OR_SCREEN_ON",
  [ 5] = "EXPAND_NOTIFICATION_PANEL",
  [ 6] = "EXPAND_SETTINGS_PANEL",
  [ 7] = "COLLAPSE_PANELS",
  [ 8] = "GET_CLIPBOARD",
  [ 9] = "SET_CLIPBOARD",
  [10] = "SET_SCREEN_POWER_MODE",
  [11] = "ROTATE_DEVICE",
}
  

function usb_scrcpy_protocol.dissector(buffer, pinfo, tree)
  length = buffer:len()
  if length == 0 then
    tree:add(usb_scrcpy_protocol, buffer(), "Scrcpy Empty")
    return
  end

  local controlMessageCode = buffer(0,1):uint()

  if controlMessageCode == 0x0 and length == 14 then
    local event_action_val = buffer(1,1);
    local controlMessageName = controlMessageTable[controlMessageCode]

    local subtree = tree:add(usb_scrcpy_protocol, buffer(), "Scrcpy " .. controlMessageName)
    subtree:add(f_controlMessage, buffer(0,1)):append_text(" (" .. controlMessageName .. ")")
    subtree:add(f_action, event_action_val):append_text(" (" .. mouseEventActionTable[event_action_val:uint()] .. ")")
    subtree:add(f_keyCode, buffer(2,4))
    subtree:add(f_repeatCount, buffer(6,4))
    subtree:add(f_metaState, buffer(10,4))

  elseif controlMessageCode == 0x2 and length == 28 then
    -- length == 28
    local event_action_val = buffer(1,1);
    local controlMessageName = controlMessageTable[controlMessageCode]
    local subtree = tree:add(usb_scrcpy_protocol, buffer(), "Scrcpy " .. controlMessageName)

    pinfo.cols.protocol = usb_scrcpy_protocol.name
    -- pinfo.cols.info = "Scrcpy " .. controlMessageName ..
    local touch_event_type = buffer(24,4);
    local buttons_text = parse_buttons(touch_event_type)

    subtree:add(f_controlMessage, buffer(0,1)):append_text(" (" .. controlMessageName .. ")")
    subtree:add(f_action, event_action_val):append_text(" (" .. mouseEventActionTable[event_action_val:uint()] .. ")")
    subtree:add(f_pointerId, buffer(2,8))
    subtree:add(f_posX, buffer(10,4))
    subtree:add(f_posY, buffer(14,4))
    subtree:add(f_screenX, buffer(18,2))
    subtree:add(f_screenY, buffer(20,2))
    subtree:add(f_pressure, buffer(22,2))
    subtree:add(f_mouseEvent, touch_event_type):append_text(buttons_text)
  end
end

--DissectorTable.get("usb.interrupt"):add(0xffff, usb_scrcpy_protocol)
--DissectorTable.get("usb.control"):add(0xffff, usb_scrcpy_protocol)
DissectorTable.get("usb.bulk"):add(0xff, usb_scrcpy_protocol)
