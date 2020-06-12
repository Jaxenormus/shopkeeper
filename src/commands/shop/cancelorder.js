const { MessageEmbed } = require('discord.js')
const CompletedOrder = require('../../models/completedorder')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "cancelorder",
    category: "moderation",
    category: "shop",
    description: "Cancels a order along with the temporary channel",
    usage: "[orderID | reason]",
    run: async (client, message, args) => {
        let order = args[0]
        let reason = args[1]
        if (!order) return message.channel.send(new MessageEmbed().setDescription('Please provide a order ID').setColor(embedColor.error))
        let orderFinder = await CompletedOrder.findOne({ specialID: order })
        if (!orderFinder) return message.channel.send(new MessageEmbed().setDescription('This order ID you provided does not exist').setColor(embedColor.error))
        let cachedDM = await client.channels.fetch(orderFinder.dmID)
        let channel = await message.guild.channels.cache.get(orderFinder.archiveChannel)
        await channel.delete()
        await CompletedOrder.deleteOne({ specialID: order })
        if(!reason) reason = 'no reason provided'
        if (reason) try { await cachedDM.send(new MessageEmbed().setDescription('Your order has been canceled for ' + reason).setColor(embedColor.cancel)) } catch {}
    }
}