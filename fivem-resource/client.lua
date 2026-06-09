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
