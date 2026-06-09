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
    print("[amulet-shop] deliverPending called — src:" .. tostring(src) .. " discordId:" .. tostring(discordId))
    if not discordId then
        print("[amulet-shop] ERROR: no discordId for src " .. tostring(src))
        return
    end

    local url = SHOP_URL .. "/api/fivem/pending?discordId=" .. discordId
    print("[amulet-shop] Fetching pending from: " .. url)

    PerformHttpRequest(
        url,
        function(status, body)
            print("[amulet-shop] HTTP status: " .. tostring(status) .. " body: " .. tostring(body))
            if status ~= 200 then
                print("[amulet-shop] ERROR: HTTP " .. tostring(status))
                return
            end

            local data = json.decode(body)
            if not data or not data.items then
                print("[amulet-shop] ERROR: invalid JSON response")
                return
            end
            if #data.items == 0 then
                print("[amulet-shop] No pending items for " .. discordId)
                return
            end

            print("[amulet-shop] Found " .. #data.items .. " pending item(s) for " .. discordId)

            local delivered = {}

            for _, item in ipairs(data.items) do
                print("[amulet-shop] Giving " .. item.itemName .. " x" .. tostring(item.amount) .. " to src " .. tostring(src))
                local ok = exports.ox_inventory:AddItem(src, item.itemName, item.amount)
                print("[amulet-shop] AddItem result: " .. tostring(ok))
                if ok then
                    table.insert(delivered, item.id)
                    print("[amulet-shop] SUCCESS: " .. item.itemName .. " x" .. item.amount .. " -> " .. discordId)
                else
                    print("[amulet-shop] FAILED: " .. item.itemName .. " -> " .. discordId)
                end
            end

            -- แจ้งเว็บว่าส่งแล้ว
            if #delivered > 0 then
                print("[amulet-shop] Marking " .. #delivered .. " items as delivered")
                PerformHttpRequest(
                    SHOP_URL .. "/api/fivem/pending",
                    function(s, b)
                        print("[amulet-shop] Mark delivered response: " .. tostring(s) .. " " .. tostring(b))
                    end,
                    "POST",
                    json.encode({ ids = delivered }),
                    { ["Content-Type"] = "application/json", ["x-api-key"] = API_KEY }
                )

                -- แจ้ง player ในเกม
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
    print("[amulet-shop] playerSpawned received from src:" .. tostring(src))
    SetTimeout(3000, function()
        deliverPending(src)
    end)
end)

-- fallback: playerDropped เพื่อ debug
AddEventHandler("playerJoining", function(name)
    local src = source
    print("[amulet-shop] playerJoining src:" .. tostring(src) .. " name:" .. tostring(name))
    SetTimeout(8000, function()
        deliverPending(src)
    end)
end)

-- test command: /shopdeliver ให้ admin สั่ง deliver ด้วยตัวเองได้
RegisterCommand("shopdeliver", function(src, args, rawCommand)
    print("[amulet-shop] Manual shopdeliver triggered by src:" .. tostring(src))
    deliverPending(src)
end, false)

-- client event แจ้ง player
RegisterNetEvent("amulet-shop:notify")

print("[amulet-shop] Resource loaded — " .. SHOP_URL)
