const { MessageEmbed } = require('discord.js')
const Product = require('../../models/product')
const Seller = require('../../models/seller')
const embedColor = require('../../config.json').embedColor
module.exports = {
    name: "createproduct",
    category: "shop",
    description: "Start the creation process for a product",
    run: async (client, message, args) => {
        let sellerFinder = await Seller.findOne({ sellerID: message.author.id })
        if (!sellerFinder) return message.channel.send(new MessageEmbed().setDescription('You are not a verified seller').setColor(embedColor.error))
        let embed = new MessageEmbed().setDescription('Product creation process started').setColor(embedColor.success)
        let msg = await message.channel.send(embed)
        let filter = m => m.author.id === message.author.id;
        await msg.edit(new MessageEmbed().setDescription('Please provide a Title/Name for the product you are selling.')).then(async () => {
            await message.channel.awaitMessages(filter, {max: 1, time: 300000, errors: ["time"]})
                .then(async collection => {
                    let title = collection.first().content
                    await collection.first().delete()
                    await msg.edit(new MessageEmbed().setDescription('Please provide a description of the product if you do not have a description please simply reply with none.')).then(async () => {
                        await message.channel.awaitMessages(filter, {max: 1, time: 300000, errors: ["time"]})
                            .then(async collection => {
                                let description = collection.first().content
                                await collection.first().delete()
                                await msg.edit(new MessageEmbed().setDescription('Please provide a price for your product?')).then(async () => {
                                    await message.channel.awaitMessages(filter, {
                                        max: 1,
                                        time: 300000,
                                        errors: ["time"]
                                    })
                                        .then(async collection => {
                                            let price = collection.first().content
                                            await collection.first().delete()
                                            await msg.edit(new MessageEmbed().setDescription('Please provide a link to a screenshot/picture of the product?')).then(async () => {
                                                await message.channel.awaitMessages(filter, {
                                                    max: 1,
                                                    time: 300000,
                                                    errors: ["time"]
                                                })
                                                    .then(async collection => {
                                                        let regex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/
                                                        let checkLink = regex.test(collection.first().content)
                                                        if (!checkLink) return msg.edit(new MessageEmbed().setDescription('The link you provide is in valid please restart the product creation progress').setColor(embedColor.error))
                                                        let picture = collection.first().content
                                                        await collection.first().delete()
                                                        await msg.delete()
                                                        let productMessage = new MessageEmbed().setColor(embedColor.productDisplay).setTitle(`**${title}**`).addField('Price', price).setImage(picture)
                                                        if (description.length > 0 && description.toLowerCase() !== 'none'){
                                                        productMessage.addField('Description', description)
                                                        }
                                                        await message.channel.send(productMessage).then(messageSent => {
                                                            messageSent.react('🛒')
                                                            messageSent.react('🗑')
                                                            const newProduct = new Product({
                                                                messageID: messageSent.id,
                                                                sellerID: message.author.id,
                                                                name: title,
                                                                description: description,
                                                                price: price,
                                                                picture: picture,
                                                            })
                                                            newProduct.save().catch(err => console.error(err));
                                                        })
                                                    })
                                                    .catch(async () => {
                                                        return msg.edit("You took to long to respond product creation has been canceled")
                                                    });
                                            })
                                        })
                                        .catch(async () => {
                                            return msg.edit("You took to long to respond product creation has been canceled")
                                        });
                                })
                            })
                            .catch(async () => {
                                return msg.edit("You took to long to respond product creation has been canceled")
                            });
                    })
                })
                .catch(async () => {
                    return msg.edit("You took to long to respond product creation has been canceled")
                });
        })
    }
}