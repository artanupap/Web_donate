-- แจ้ง server เมื่อ player spawn (รองรับหลาย framework)
AddEventHandler("playerSpawned", function()
    TriggerServerEvent("amulet-shop:playerSpawned")
end)

-- ESX
AddEventHandler("esx:playerLoaded", function()
    TriggerServerEvent("amulet-shop:playerSpawned")
end)

-- QBCore
AddEventHandler("QBCore:Client:OnPlayerLoaded", function()
    TriggerServerEvent("amulet-shop:playerSpawned")
end)

-- onResourceStart (ถ้า resource start ทีหลัง player เข้ามาแล้ว)
AddEventHandler("onClientResourceStart", function(resourceName)
    if resourceName == GetCurrentResourceName() then
        TriggerServerEvent("amulet-shop:playerSpawned")
    end
end)

-- แจ้งเตือน player เมื่อได้รับไอเท็ม
RegisterNetEvent("amulet-shop:notify")
AddEventHandler("amulet-shop:notify", function(count, items)
    -- ใช้ ox_lib notification (ถ้ามี)
    if exports["ox_lib"] then
        exports.ox_lib:notify({
            title = "Amulet Shop",
            description = "ได้รับไอเท็ม " .. count .. " รายการจากการสั่งซื้อ",
            type = "success",
            duration = 6000,
        })
    else
        -- fallback: chat message
        TriggerEvent("chat:addMessage", {
            color = {0, 200, 100},
            multiline = true,
            args = {"Amulet Shop", "ได้รับไอเท็ม " .. count .. " รายการจากการสั่งซื้อ"}
        })
    end
end)
