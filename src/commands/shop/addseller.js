const { MessageEmbed } = require('discord.js')
const Seller = require('../../models/seller')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "addseller",
    category: "moderation",
    category: "shop",
    description: "Add a verified seller so they can sell items",
    usage: "[userID | PayPalMeLink ]",
    run: async (client, message, args) => {
        let seller = args[0]
        if (!seller) return message.channel.send(new MessageEmbed().setDescription('Please provide a user ID').setColor(embedColor.error))
        try { await client.users.fetch(seller) } catch {
            return message.channel.send(new MessageEmbed().setDescription('The user ID you provided is invalid').setColor(embedColor.error))
        }
        let sellerFinder = await Seller.findOne({ sellerID: seller })
        if (sellerFinder) return message.channel.send(new MessageEmbed().setDescription('The user ID you provided is already a verified seller').setColor(embedColor.error))
        let link = args.slice(1).join(' ')
        let regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/
        let checkLink = regex.test(link)
        if (!checkLink) return message.channel.send(new MessageEmbed().setDescription('The link you provided is invalid').setColor(embedColor.error))
        const newSeller = new Seller({
            sellerID: seller,
            paypal: link
        })
        newSeller.save().catch(e => console.log(e))
        message.channel.send(new MessageEmbed().setDescription(seller + ' is now a verified seller').setColor(embedColor.success))
    }
}