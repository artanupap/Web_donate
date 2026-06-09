local API_KEY = "kwhuB9671mSgRbHJrUjsdpG5NzIZKlQx" -- ต้องตรงกับ .env FIVEM_API_KEY

-- HTTP endpoint รับ request จากเว็บ
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

    -- ตรวจ API key
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
    local items = body.items

    -- หา player จาก Discord ID
    local targetSrc = nil
    for _, src in ipairs(GetPlayers()) do
        local identifiers = GetPlayerIdentifiers(src)
        for _, id in ipairs(identifiers) do
            if string.sub(id, 1, 8) == "discord:" then
                if string.sub(id, 9) == discordId then
                    targetSrc = tonumber(src)
                    break
                end
            end
        end
        if targetSrc then break end
    end

    if not targetSrc then
        -- ผู้เล่นออฟไลน์ — บันทึกลง queue (ต้องทำระบบ queue เพิ่มเติม)
        res.writeHead(202)
        res.send('{"queued":true,"message":"Player offline, queued for next login"}')
        return
    end

    -- ส่งไอเท็มด้วย ox_inventory
    local success = true
    for _, item in ipairs(items) do
        local ok = exports.ox_inventory:AddItem(targetSrc, item.itemName, item.amount)
        if not ok then
            success = false
            print("[fivem-shop] Failed to give " .. item.itemName .. " to " .. discordId)
        end
    end

    if success then
        TriggerClientEvent("fivem-shop:itemDelivered", targetSrc, items)
        res.writeHead(200)
        res.send('{"success":true}')
    else
        res.writeHead(500)
        res.send('{"error":"Failed to give some items"}')
    end
end)

-- แจ้งผู้เล่นเมื่อได้ไอเท็ม
RegisterNetEvent("fivem-shop:itemDelivered")
AddEventHandler("fivem-shop:itemDelivered", function(items)
    -- client-side notification (ถ้าต้องการ)
end)

print("[fivem-shop] Bridge loaded — listening on /fivem-shop/deliver")
