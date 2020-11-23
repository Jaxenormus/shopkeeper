const { MessageEmbed } = require('discord.js')
const Seller = require('../../models/seller')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "showsellers",
    category: "moderation",
    category: "shop",
    description: "Shows all the current verified sellers",
    run: async (client, message, args) => {
        let sellerFinder = await Seller.find()
        const preSellersMapped = sellerFinder.map(seller => client.users.fetch(seller.sellerID).then(res => `**${res.tag}** - \`${seller.paypal}\``))
        Promise.all(preSellersMapped).then(sellersMapped => {
            message.channel.send(sellersMapped.map(sellers => sellers).join('\n'))
        })
    }
}