const { MessageEmbed } = require("discord.js");
const CompletedOrder = require('../../models/completedorder')
const embedColor = require('../../config.json').embedColor
const reviewChannel = require('../../config.json').reviewChannel
const guildID = require('../../config.json').guildID
module.exports = {
    name: "review",
    category: "info",
    description: "Send a review of your experience",
    usage: "[command | alias]",
    run: async (client, message, args) => {
    let orderChecker = await CompletedOrder.findOne({ buyerID: message.author.id })
        if (!orderChecker) return message.author.send(new MessageEmbed().setDescription('You must have an active order to make a review').setColor(embedColor.error))
        let review = args.join(" ")
        if(!review) return message.author.send(new MessageEmbed().setDescription('Please provide a review to send').setColor(embedColor.error))
        const embed = new MessageEmbed().setTitle(`Review By ${message.author.tag}`).setDescription(review).setColor(embedColor.review)
        let guild = await client.guilds.cache.get(guildID)
        let reviewChannelFound = guild.channels.cache.get(reviewChannel)
        reviewChannelFound.send(embed)
    }
}