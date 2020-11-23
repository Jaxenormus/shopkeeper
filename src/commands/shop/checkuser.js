const { MessageEmbed } = require('discord.js')
const Orders = require('../../models/completedorder')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "checkuser",
    category: "moderation",
    category: "shop",
    description: "Check if a user has any open orders",
    usage: "[userID]",
    run: async (client, message, args) => {
        let user = message.mentions.users.first() ? message.mentions.users.first().id : args[0]
    let foundUser = await Orders.find({ buyerID: user })
        if(!foundUser) return message.channel.send(new MessageEmbed().setDescription('This user has no orders').setColor(embedColor.err))
        let username = await client.users.fetch(user)
        const embed = new MessageEmbed().setTitle(username.tag + '\'s Current Orders').setColor(embedColor.success)
    foundUser.forEach(orders => {
        let str = [];
        orders.cart.map(x => {
            str.push(`${orders.cart.filter(y => y === x).length} ${x}`)
        });
        embed.addField('Order ID: ' + orders.specialID, 'Items: ' + [...new Set(str)].join(", "))
     })
        await message.channel.send(embed)
    }
}