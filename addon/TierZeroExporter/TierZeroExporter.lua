-- TierZeroExporter: Export equipped gear, bags, and bank for the Tier Zero web app

TierZeroExportData = TierZeroExportData or {}

-- Register slash commands FIRST so they always work
local function TZ_Run() end -- forward declaration, replaced below
SLASH_TierZeroExporter1 = "/tz"
SLASH_TierZeroExporter2 = "/tierzero"
SlashCmdList["TierZeroExporter"] = function(msg)
    TZ_Run(msg)
end

local SLOT_MAP = {
    [1]  = "head",
    [2]  = "neck",
    [3]  = "shoulders",
    [15] = "back",
    [5]  = "chest",
    [9]  = "wrists",
    [10] = "hands",
    [6]  = "waist",
    [7]  = "legs",
    [8]  = "feet",
    [11] = "ring1",
    [12] = "ring2",
    [13] = "trinket1",
    [14] = "trinket2",
    [16] = "mainhand",
    [17] = "offhand",
    [18] = "wand",
}

local EQUIPPABLE_CLASS = { [2] = true, [4] = true }

-- API compatibility: anniversary client uses C_Container namespace
local GetContainerNumSlots = GetContainerNumSlots or C_Container.GetContainerNumSlots
local GetContainerItemInfo = GetContainerItemInfo or function(bag, slot)
    local info = C_Container.GetContainerItemInfo(bag, slot)
    if not info then return nil end
    return info.iconFileID, info.stackCount, info.isLocked, info.quality, info.isReadable, info.hasLoot, info.hyperlink
end

local bankOpen = false
local cachedEquipped = {}
local cachedBags = {}

-- ---------------------------------------------------------------------------
-- Scanning
-- ---------------------------------------------------------------------------
local function ScanEquipped()
    local items = {}
    for invSlot, appSlot in pairs(SLOT_MAP) do
        local itemId = GetInventoryItemID("player", invSlot)
        if itemId then
            local name, _, quality, ilvl, _, _, _, _, _, _, _, classID = GetItemInfo(itemId)
            if name then
                items[appSlot] = {
                    id = itemId,
                    name = name,
                    quality = quality or 0,
                    ilvl = ilvl or 0,
                }
            end
        end
    end
    cachedEquipped = items
    return items
end

local function IsEquippableItem(itemId)
    if not itemId then return false end
    local _, _, _, _, _, _, _, _, _, _, _, classID = GetItemInfo(itemId)
    return classID and EQUIPPABLE_CLASS[classID]
end

local function ScanBags()
    local items = {}
    for bag = 0, 4 do
        local numSlots = GetContainerNumSlots(bag)
        for slot = 1, numSlots do
            local _, count, _, quality, _, _, link = GetContainerItemInfo(bag, slot)
            if link then
                local itemId = tonumber(link:match("item:(%d+)"))
                if itemId and (quality or 0) >= 2 and IsEquippableItem(itemId) then
                    local name, _, q, ilvl = GetItemInfo(itemId)
                    if name then
                        table.insert(items, {
                            id = itemId,
                            name = name,
                            quality = q or quality or 0,
                            ilvl = ilvl or 0,
                        })
                    end
                end
            end
        end
    end
    cachedBags = items
    return items
end

local function ScanBank()
    local items = {}

    local numSlots = GetContainerNumSlots(-1)
    for slot = 1, numSlots do
        local _, count, _, quality, _, _, link = GetContainerItemInfo(-1, slot)
        if link then
            local itemId = tonumber(link:match("item:(%d+)"))
            if itemId and (quality or 0) >= 2 and IsEquippableItem(itemId) then
                local name, _, q, ilvl = GetItemInfo(itemId)
                if name then
                    table.insert(items, {
                        id = itemId,
                        name = name,
                        quality = q or quality or 0,
                        ilvl = ilvl or 0,
                    })
                end
            end
        end
    end

    for bag = 5, 11 do
        local bagSlots = GetContainerNumSlots(bag)
        for slot = 1, bagSlots do
            local _, count, _, quality, _, _, link = GetContainerItemInfo(bag, slot)
            if link then
                local itemId = tonumber(link:match("item:(%d+)"))
                if itemId and (quality or 0) >= 2 and IsEquippableItem(itemId) then
                    local name, _, q, ilvl = GetItemInfo(itemId)
                    if name then
                        table.insert(items, {
                            id = itemId,
                            name = name,
                            quality = q or quality or 0,
                            ilvl = ilvl or 0,
                        })
                    end
                end
            end
        end
    end

    TierZeroExportData.bank = items
    TierZeroExportData.bankTime = date("%Y-%m-%d %H:%M")
    print("|cff69ccf0Tier Zero:|r Bank scanned! (" .. #items .. " equippable items found)")
    return items
end

-- ---------------------------------------------------------------------------
-- Export String Builder
-- ---------------------------------------------------------------------------
local function BuildExportString()
    local lines = {}
    table.insert(lines, "TIERZERO:1")

    local name = UnitName("player")
    local realm = GetRealmName()
    table.insert(lines, "CHAR:" .. (name or "Unknown") .. "-" .. (realm or "Unknown"))
    table.insert(lines, "SPEC:unknown")

    for appSlot, info in pairs(cachedEquipped) do
        table.insert(lines, "EQ:" .. appSlot .. ":" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl)
    end

    for _, info in ipairs(cachedBags) do
        table.insert(lines, "BAG:" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl)
    end

    local bankItems = TierZeroExportData.bank or {}
    for _, info in ipairs(bankItems) do
        table.insert(lines, "BANK:" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl)
    end

    table.insert(lines, "END")
    return table.concat(lines, "\n")
end

-- ---------------------------------------------------------------------------
-- Export Window UI — built with no XML templates for max compatibility
-- ---------------------------------------------------------------------------
local exportFrame = nil

local function ShowExportWindow()
    ScanEquipped()
    ScanBags()

    if not exportFrame then
        -- Main frame — plain frame, no template dependency
        exportFrame = CreateFrame("Frame", "TierZeroExportFrame", UIParent)
        exportFrame:SetSize(500, 400)
        exportFrame:SetPoint("CENTER")
        exportFrame:SetMovable(true)
        exportFrame:EnableMouse(true)
        exportFrame:RegisterForDrag("LeftButton")
        exportFrame:SetScript("OnDragStart", exportFrame.StartMoving)
        exportFrame:SetScript("OnDragStop", exportFrame.StopMovingOrSizing)
        exportFrame:SetFrameStrata("DIALOG")

        -- Background texture
        local bg = exportFrame:CreateTexture(nil, "BACKGROUND")
        bg:SetAllPoints()
        bg:SetColorTexture(0.05, 0.05, 0.1, 0.95)

        -- Border
        local border = exportFrame:CreateTexture(nil, "BORDER")
        border:SetPoint("TOPLEFT", -2, 2)
        border:SetPoint("BOTTOMRIGHT", 2, -2)
        border:SetColorTexture(0.6, 0.5, 0.3, 0.8)
        local innerBg = exportFrame:CreateTexture(nil, "ARTWORK")
        innerBg:SetAllPoints()
        innerBg:SetColorTexture(0.05, 0.05, 0.1, 1)

        -- Title
        exportFrame.title = exportFrame:CreateFontString(nil, "OVERLAY", "GameFontNormalLarge")
        exportFrame.title:SetPoint("TOP", 0, -10)
        exportFrame.title:SetText("|cffC8AA6ETier Zero Export|r")

        -- Subtitle
        local sub = exportFrame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
        sub:SetPoint("TOP", exportFrame.title, "BOTTOM", 0, -2)
        sub:SetText("Ctrl+A then Ctrl+C to copy")

        -- Close button (just a text button, no template)
        local closeBtn = CreateFrame("Button", nil, exportFrame)
        closeBtn:SetSize(20, 20)
        closeBtn:SetPoint("TOPRIGHT", -6, -6)
        closeBtn:SetNormalFontObject("GameFontNormal")
        closeBtn:SetText("X")
        closeBtn:SetScript("OnClick", function() exportFrame:Hide() end)

        -- Bank status
        exportFrame.bankStatus = exportFrame:CreateFontString(nil, "OVERLAY", "GameFontNormalSmall")
        exportFrame.bankStatus:SetPoint("BOTTOMLEFT", 12, 8)

        -- Scrollframe
        local scrollFrame = CreateFrame("ScrollFrame", "TierZeroExportScroll", exportFrame, "UIPanelScrollFrameTemplate")
        scrollFrame:SetPoint("TOPLEFT", 12, -42)
        scrollFrame:SetPoint("BOTTOMRIGHT", -30, 26)

        -- EditBox inside scroll
        local editBox = CreateFrame("EditBox", nil, scrollFrame)
        editBox:SetMultiLine(true)
        editBox:SetAutoFocus(true)
        editBox:SetFontObject(ChatFontNormal)
        editBox:SetWidth(440)
        editBox:SetScript("OnEscapePressed", function() exportFrame:Hide() end)
        scrollFrame:SetScrollChild(editBox)

        exportFrame.editBox = editBox
    end

    local text = BuildExportString()
    exportFrame.editBox:SetText(text)
    exportFrame.editBox:HighlightText()
    exportFrame.editBox:SetCursorPosition(0)

    local bankTime = TierZeroExportData.bankTime
    local bankItems = TierZeroExportData.bank or {}
    if bankTime then
        exportFrame.bankStatus:SetText("Bank: " .. #bankItems .. " items (scanned " .. bankTime .. ")")
    else
        exportFrame.bankStatus:SetText("Bank: Visit bank to scan")
    end

    exportFrame:Show()
end

-- Wire up the slash command to the real function
TZ_Run = function(msg)
    local ok, err = pcall(ShowExportWindow)
    if not ok then
        print("|cffff5555Tier Zero Error:|r " .. tostring(err))
    end
end

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
local eventFrame = CreateFrame("Frame")
eventFrame:RegisterEvent("PLAYER_LOGIN")
eventFrame:RegisterEvent("PLAYER_EQUIPMENT_CHANGED")
eventFrame:RegisterEvent("BAG_UPDATE")
eventFrame:RegisterEvent("BANKFRAME_OPENED")
eventFrame:RegisterEvent("BANKFRAME_CLOSED")

eventFrame:SetScript("OnEvent", function(self, event, ...)
    if event == "PLAYER_LOGIN" then
        pcall(ScanEquipped)
        pcall(ScanBags)
        print("|cff69ccf0Tier Zero Exporter|r loaded. Type |cffffd100/tz|r to export gear.")
    elseif event == "PLAYER_EQUIPMENT_CHANGED" then
        pcall(ScanEquipped)
    elseif event == "BAG_UPDATE" then
        pcall(ScanBags)
    elseif event == "BANKFRAME_OPENED" then
        bankOpen = true
        pcall(ScanBank)
    elseif event == "BANKFRAME_CLOSED" then
        bankOpen = false
    end
end)

print("|cff69ccf0TierZeroExporter|r file loaded - /tz registered")
