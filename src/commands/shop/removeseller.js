const { MessageEmbed } = require('discord.js')
const Seller = require('../../models/seller')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "removeseller",
    category: "moderation",
    category: "shop",
    description: "Remove a users verified seller status so they cant create products",
    usage: "[userID | reason]",
    run: async (client, message, args) => {
        if (!message.member.hasPermission('ADMINISTRATOR')) return;
        let seller = message.mentions.first.id
        let reason = args[1]
        if (!seller) return message.channel.send(new MessageEmbed().setDescription('Please provide a user ID').setColor(embedColor.error))
        try {
           await client.users.fetch(seller)
        } catch {
            return message.channel.send(new MessageEmbed().setDescription('The user ID you provided is invalid').setColor(embedColor.error))
        }
        let sellerFinder = await Seller.findOne({ sellerID: seller })
        if (!sellerFinder) return message.channel.send(new MessageEmbed().setDescription('This user is not a verified seller').setColor(embedColor.error))
        await Seller.deleteOne({ sellerID: seller })
        let foundSeller = await client.users.fetch(seller)
        if (reason) try { await foundSeller.send(new MessageEmbed().setDescription('You are no longer a verified seller').setColor(embedColor.success)) } catch {}
        message.channel.send(seller + ' is no longer a verified seller')
    }
}