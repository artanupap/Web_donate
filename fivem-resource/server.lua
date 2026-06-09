local API_KEY = "kwhuB9671mSgRbHJrUjsdpG5NzIZKlQx"
local SHOP_URL = "http://localhost:3000" -- เปลี่ยนเป็น URL เว็บจริง

-- ดึง Discord ID ของ player
local function getDiscordId(src)
    for _, id in ipairs(GetPlayerIdentifiers(src)) do
        if string.sub(id, 1, 8) == "discord:" then
            return string.sub(id, 9)
        end
    end
    return nil
end

-- ส่งไอเท็ม pending ให้ player
local function deliverPending(src)
    local discordId = getDiscordId(src)
    if not discordId then return end

    PerformHttpRequest(
        SHOP_URL .. "/api/fivem/pending?discordId=" .. discordId,
        function(status, body)
            if status ~= 200 then return end

            local data = json.decode(body)
            if not data or not data.items or #data.items == 0 then return end

            local delivered = {}

            for _, item in ipairs(data.items) do
                local ok = exports.ox_inventory:AddItem(src, item.itemName, item.amount)
                if ok then
                    table.insert(delivered, item.id)
                    print("[amulet-shop] Delivered " .. item.itemName .. " x" .. item.amount .. " to " .. discordId)
                else
                    print("[amulet-shop] Failed to deliver " .. item.itemName .. " to " .. discordId)
                end
            end

            if #delivered > 0 then
                PerformHttpRequest(
                    SHOP_URL .. "/api/fivem/pending",
                    function(s) end,
                    "POST",
                    json.encode({ ids = delivered }),
                    { ["Content-Type"] = "application/json", ["x-api-key"] = API_KEY }
                )
                TriggerClientEvent("amulet-shop:notify", src, #delivered, data.items)
            end
        end,
        "GET",
        "",
        { ["x-api-key"] = API_KEY }
    )
end

-- HTTP endpoint รับ deliver request แบบ realtime (player ออนไลน์อยู่)
SetHttpHandler(function(req, res)
    if req.path ~= "/fivem-shop/deliver" then
        res.writeHead(404)
        res.send('{"error":"Not found"}')
        return
    end

    if req.method ~= "POST" then
        res.writeHead(405)
        res.send('{"error":"Method not allowed"}')
        return
    end

    local key = req.headers["x-api-key"] or ""
    if key ~= API_KEY then
        res.writeHead(401)
        res.send('{"error":"Unauthorized"}')
        return
    end

    local body = json.decode(req.body or "{}")
    if not body or not body.discordId or not body.items then
        res.writeHead(400)
        res.send('{"error":"Invalid body"}')
        return
    end

    local discordId = tostring(body.discordId)

    -- หา player online
    local targetSrc = nil
    for _, src in ipairs(GetPlayers()) do
        if getDiscordId(tonumber(src)) == discordId then
            targetSrc = tonumber(src)
            break
        end
    end

    if not targetSrc then
        -- ออฟไลน์ — เว็บจะ save queue เอง
        res.writeHead(202)
        res.send('{"queued":true}')
        return
    end

    -- ส่งไอเท็มทันที
    local allOk = true
    for _, item in ipairs(body.items) do
        local ok = exports.ox_inventory:AddItem(targetSrc, item.itemName, item.amount)
        if not ok then allOk = false end
    end

    TriggerClientEvent("amulet-shop:notify", targetSrc, #body.items, body.items)

    res.writeHead(200)
    res.send('{"success":true}')
end)

-- ตอน player spawn (รับจาก client event) — ส่ง pending items
RegisterNetEvent("amulet-shop:playerSpawned")
AddEventHandler("amulet-shop:playerSpawned", function()
    local src = source
    SetTimeout(3000, function()
        deliverPending(src)
    end)
end)

AddEventHandler("playerJoining", function()
    local src = source
    SetTimeout(8000, function()
        deliverPending(src)
    end)
end)

-- client event แจ้ง player
RegisterNetEvent("amulet-shop:notify")

print("[amulet-shop] Resource loaded — " .. SHOP_URL)
