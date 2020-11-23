const { MessageEmbed } = require('discord.js')
const Order = require('../../models/completedorder')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "deleteorder",
    category: "moderation",
    category: "shop",
    description: "Delete an order from the DB but not the temp channel",
    usage: "[orderID]",
    run: async (client, message, args) => {
        let order = args[0]
        let reason = args[1]
        if (!order) return message.channel.send(new MessageEmbed().setDescription('Please provide a order ID'))
        let orderFinder = await Order.findOne({ specialID: order })
        if (!orderFinder) return message.channel.send(new MessageEmbed().setDescription('This order ID you provided does not exist').setColor(embedColor.cancel))
        let foundSeller = await client.users.fetch(orderFinder.buyerID)
        let cachedDM = await client.channels.fetch(orderFinder.dmID)
        cachedDM.messages.fetch(orderFinder.cartMessage).then(async message => {
            await message.delete()
        })
        await Order.deleteOne({ specialID: order })
        if(!reason) reason = 'no reason provided'
        if (reason) try { await foundSeller.send(new MessageEmbed().setDescription('Your order has been deleted for ' + reason).setColor(embedColor.cancel)) } catch {}
        message.channel.send(order + ' has been deleted')
    }
}