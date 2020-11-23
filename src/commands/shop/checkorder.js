const { MessageEmbed } = require('discord.js')
const Orders = require('../../models/completedorder')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "checkorder",
    category: "moderation",
    category: "shop",
    description: "Check the info on a order",
    usage: "[userID]",
    run: async (client, message, args) => {
        let order = args[0]
        let foundOrder = await Orders.find({ specialID: order })
        if(!foundOrder) return message.channel.send(new MessageEmbed().setDescription('This order does not exist').setColor(embedColor.err))
        const embed = new MessageEmbed().setTitle(`Order ${order}`).setColor(embedColor.success)
        foundOrder.forEach(orders => {
            let str = [];
            orders.cart.map(x => {
                str.push(`${orders.cart.filter(y => y === x).length} x ${x}`)
            });
            embed.addField('Cart', [...new Set(str)].join(", "))
        })
        foundOrder.forEach(orders => {
            let str = [];
            orders.sellers.map(x => {
                str.push(`${x}`)
            });
            embed.addField('Seller(s)', [...new Set(str)].join(", "))
        })
        await message.channel.send(embed)
    }
}