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
local function ParseItemLink(link)
    if not link then return nil end
    -- TBC link: |Hitem:itemId:enchantId:gem1:gem2:gem3:suffixId:uniqueId:level|h[Name]|h
    local itemId, enchantId, gem1, gem2, gem3 = link:match("item:(%d+):(%d*):(%d*):(%d*):(%d*)")
    return tonumber(itemId), tonumber(enchantId) or 0, tonumber(gem1) or 0, tonumber(gem2) or 0, tonumber(gem3) or 0
end

-- Hidden tooltip for scanning enchant names
local scanTip = CreateFrame("GameTooltip", "TZScanTip", nil, "GameTooltipTemplate")
scanTip:SetOwner(UIParent, "ANCHOR_NONE")

local function GetEnchantName(invSlot)
    scanTip:ClearLines()
    scanTip:SetInventoryItem("player", invSlot)
    for i = 2, scanTip:NumLines() do
        local line = _G["TZScanTipTextLeft" .. i]
        if line then
            local r, g, b = line:GetTextColor()
            -- Green text = enchant (r≈0, g≈1, b≈0)
            if g > 0.9 and r < 0.2 and b < 0.2 then
                return line:GetText() or ""
            end
        end
    end
    return ""
end

local function ScanEquipped()
    local items = {}
    for invSlot, appSlot in pairs(SLOT_MAP) do
        local link = GetInventoryItemLink("player", invSlot)
        if link then
            local itemId, enchantId, gem1, gem2, gem3 = ParseItemLink(link)
            if itemId then
                local name, _, quality, ilvl = GetItemInfo(itemId)
                if name then
                    local enchantName = ""
                    if enchantId and enchantId > 0 then
                        enchantName = GetEnchantName(invSlot)
                    end
                    items[appSlot] = {
                        id = itemId,
                        name = name,
                        quality = quality or 0,
                        ilvl = ilvl or 0,
                        enchant = enchantId,
                        enchantName = enchantName,
                        gems = { gem1, gem2, gem3 },
                    }
                end
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
-- Auctionator Price Export
-- ---------------------------------------------------------------------------
-- All gem item IDs from our database (meta, red, orange, yellow, purple, blue, green)
local PRICE_IDS = {
    -- Meta
    34220, 25901, 25899, 32410, 25890, 25893, 25894, 25895, 25896, 25897, 25898, 32409, 35501, 35503,
    -- Rare Red (Living Ruby)
    24030, 24027, 24028, 24029, 24031, 24032, 24036,
    -- Uncommon Red (Blood Garnet)
    23096, 23095, 23097, 23094, 28595,
    -- Rare Orange (Noble Topaz)
    24059, 24058, 24061, 24060, 31867, 31868, 35316,
    -- Uncommon Orange (Flame Spessarite)
    23101, 23098, 23100, 23099, 31866, 31869,
    -- Rare Yellow (Dawnstone)
    24048, 24051, 31861, 24047, 24050, 24052, 24053, 35315,
    -- Uncommon Yellow (Golden Draenite)
    23114, 23113, 23115, 23116, 28290, 31860,
    -- Rare Blue (Star of Elune)
    24033, 24037, 24035, 24039,
    -- Uncommon Blue (Azure Moonstone)
    23118, 23121, 23119, 23120,
    -- Rare Purple (Nightseye)
    24056, 24054, 24055, 24057, 31863, 31865, 35707,
    -- Uncommon Purple (Shadow Draenite)
    23108, 23111, 23110, 23109, 31862, 31864,
    -- Rare Green (Talasite)
    24065, 24062, 35318, 33782, 24066, 24067,
    -- Uncommon Green (Deep Peridot)
    23104, 23105, 23106, 23103,
    -- Enchant Materials
    22445, 22446, 22447, 22448, 22449, 22450,  -- Arcane Dust thru Void Crystal
    22451, 22452, 22456, 22457, 21884, 21885,   -- Primals: Air, Earth, Shadow, Mana, Fire, Water
    -- Leg Armors (tradeable items)
    24274, 24273, 29535, 29536, 29533, 29534,    -- Spellthreads + Leg Armors (incl. budget)
    -- Crafting Materials: Primals
    21886, 23571, 23572,                         -- Primal Life, Primal Might, Primal Nether
    -- Crafting Materials: Tailoring Cloth
    21842, 21845, 21881, 24271, 24272,           -- Bolt Imbued Netherweave, PMC, Netherweb Spider Silk, Spellcloth, Shadowcloth
    -- Crafting Materials: Leatherworking
    23793, 25699, 25707, 25708, 29539, 29547,   -- Heavy Knothide, Thick Clefthoof, Fel Hide, Cobra/Wind Scales
    -- Crafting Materials: Blacksmithing Bars
    23445, 23447, 23448, 23449, 23573, 22824,   -- Fel Iron, Eternium, Felsteel, Khorium, Hardened Adamantite, Felsteel Stabilizer
    -- Crafting Materials: Jewelcrafting
    31079, 23112, 23117, 23436, 23437, 23439,   -- Eternium Bar, gems for JC figurines
    23440, 23441,                                -- Dawnstone, Nightseye (raw gems)
    -- Crafting Materials: Engineering
    23785, 23786, 23787, 16006,                  -- Adamantite Frame, Khorium Power Core, Felsteel Stabilizer, Delicate Arcanite Converter
    -- Crafting Materials: Alchemy
    22794, 25867, 25868, 30183,                  -- Fel Lotus, Mercurial Adamantite, Felsteel Stabilizer, Nether Vortex
    -- Crafting Materials: Misc
    14341, 27503,                                -- Rune Thread, special
    -- Crafting Materials: BS weapon intermediates (crafted BoP, used as mats)
    28428, 28431, 28437, 28440,                  -- Lionheart Blade, Mooncleaver, Dragonstrike, Thunder
    -- BoE Crafted Items (direct AH price)
    24266, 24262, 24250, 24252, 24253, 24254,   -- Spellstrike Hood/Pants, Tailoring BoE cloaks/bracers
    24256, 24259,                                -- Girdle of Ruination, Vengeance Wrap
    25685, 25686, 25687, 29506,                  -- Fel Leather set, Gloves of Living Touch
    23517, 23518, 23519, 23520, 23521, 23522,   -- Felsteel set, Ragesteel set
    23531, 23535, 23537, 23538, 23539, 33173,   -- BS BoE items
    23554, 23556, 28432, 28438,                  -- BS weapons
    24088, 24114, 24116, 24121                   -- JC BoE rings/necks
}

local function GetAuctionatorPrices()
    local priceLines = {}
    -- Check if Auctionator and its Database API are available
    if not Auctionator or not Auctionator.Database then return priceLines end

    local db = Auctionator.Database
    if not db.GetPrice then return priceLines end

    for _, itemId in ipairs(PRICE_IDS) do
        local ok, price = pcall(db.GetPrice, db, tostring(itemId))
        if ok and price and price > 0 then
            local age = -1
            if db.GetPriceAge then
                local ok2, a = pcall(db.GetPriceAge, db, tostring(itemId))
                if ok2 and a then age = a end
            end
            table.insert(priceLines, "PRICE:" .. itemId .. ":" .. price .. ":" .. age)
        end
    end
    return priceLines
end

-- ---------------------------------------------------------------------------
-- Export String Builder
-- ---------------------------------------------------------------------------
local function GemsString(gems)
    if not gems then return "0,0,0" end
    return (gems[1] or 0) .. "," .. (gems[2] or 0) .. "," .. (gems[3] or 0)
end

local function BuildExportString()
    local lines = {}
    table.insert(lines, "TIERZERO:3")

    local name = UnitName("player")
    local realm = GetRealmName()
    table.insert(lines, "CHAR:" .. (name or "Unknown") .. "-" .. (realm or "Unknown"))
    table.insert(lines, "SPEC:unknown")

    -- Server line for AH price context
    local realmName = GetRealmName() or "Unknown"
    local faction = UnitFactionGroup("player") or "Unknown"
    table.insert(lines, "SERVER:" .. realmName .. " " .. faction)

    -- EQ format v2: EQ:slot:itemId:name:quality:ilvl:enchantId:gem1,gem2,gem3:enchantName
    for appSlot, info in pairs(cachedEquipped) do
        table.insert(lines, "EQ:" .. appSlot .. ":" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl .. ":" .. (info.enchant or 0) .. ":" .. GemsString(info.gems) .. ":" .. (info.enchantName or ""))
    end

    for _, info in ipairs(cachedBags) do
        table.insert(lines, "BAG:" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl)
    end

    local bankItems = TierZeroExportData.bank or {}
    for _, info in ipairs(bankItems) do
        table.insert(lines, "BANK:" .. info.id .. ":" .. info.name .. ":" .. info.quality .. ":" .. info.ilvl)
    end

    -- Auctionator price data (graceful no-op if not installed)
    local priceLines = GetAuctionatorPrices()
    for _, priceLine in ipairs(priceLines) do
        table.insert(lines, priceLine)
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
