const { Client, Collection, MessageEmbed } = require('discord.js');
const client = new Client({
  disableEveryone: true,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
const { config } = require('dotenv'),
  fs = require('fs');
mongoose = require('mongoose');
client.categories = fs.readdirSync('./commands/');
client.commands = new Collection();
client.aliases = new Collection();
const { makeID } = require('./handlers/functions');
const openDM = require('./models/orders.js');
const Product = require('./models/product');
const Seller = require('./models/seller');
const CompletedOrder = require('./models/completedorder');
const token = require('./config.json').token,
  mongoDBURI = require('./config.json').mongoDBURI,
  shopGuildID = require('./config.json').guildID,
  sellerRoleID = require('./config.json').sellerRoleID,
  archiveParentID = require('./config.json').archiveParentID,
  embedColor = require('./config.json').embedColor;
config({
  path: __dirname + '/.env',
});
['command'].forEach((handler) => {
  require(`./handlers/${handler}`)(client);
});
client.on('message', async (message) => {
  if (message.channel.type === 'dm') {
    const prefix = '$';
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd === 'review') {
      if (cmd.length === 0) return;
      let command = client.commands.get(cmd);
      if (!command) command = client.commands.get(client.aliases.get(cmd));
      if (command) command.run(client, message, args);
    } else {
    }
  }
  if (message.channel.type !== 'dm') {
    const prefix = '$';
    const sellerChecker = await Seller.findOne({ sellerID: message.author.id });
    if (!sellerChecker && !message.member.hasPermission('ADMINISTRATOR'))
      return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();
    if (cmd === 'review') return;
    if (cmd.length === 0) return;
    let command = client.commands.get(cmd);
    if (!command) command = client.commands.get(client.aliases.get(cmd));
    if (command) command.run(client, message, args);
  }
});
mongoose.connect(mongoDBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to Database');
});

client.on('ready', async () => {
  console.log('Shopkeeper initialized');
});
client.on('messageReactionAdd', async (messageReaction, user) => {
  if (user.bot) return;
  else if (messageReaction.message.channel.type === 'dm') {
    let foundDM = await openDM.findOne({ buyerID: user.id });
    if (foundDM) {
      if (messageReaction.emoji.name === '✅') {
        const sellerArray = [];
        for (const item of foundDM.cart) {
          let foundItem = await Product.findOne({ name: item });
          let foundSeller = await Seller.findOne({
            sellerID: foundItem.sellerID,
          });
          await sellerArray.push({
            Paypal: foundSeller.paypal,
            Price: foundItem.price.replace(/\D/g, ''),
            sellerid: foundSeller.sellerID,
          });
        }
        function flatterPayPal(array) {
          let map = {};
          for (let item of array) {
            if (!map[item.Paypal]) map[item.Paypal] = Number(item.Price);
            else map[item.Paypal] += Number(item.Price);
          }
          return Object.entries(map).map(([paypal, price]) => {
            return { Paypal: paypal, Price: price };
          });
        }
        function flatterSeller(array) {
          let map = {};
          for (let item of array) {
            if (!map[item.sellerid]) map[item.sellerid] = Number(item.Price);
            else map[item.sellerid] += Number(item.Price);
          }
          return Object.entries(map).map(([sellerid, price]) => {
            return { Sellerid: sellerid };
          });
        }
        let mapped = flatterPayPal(sellerArray)
          .map(
            (data, index) =>
              `[Seller ${index + 1}](${data.Paypal}/${data.Price})`,
          )
          .join('\n');
        let sellers = flatterSeller(sellerArray)
          .map((data, index) => `Seller ${index + 1} - <@${data.Sellerid}>`)
          .join('\n');
        let guild = await client.guilds.cache.get(shopGuildID);
        guild.channels
          .create(`archive-${foundDM.specialID}`, {
            type: 'text',
            parent: archiveParentID,
            permissionOverwrites: [
              {
                id: user.id,
                allow: 'VIEW_CHANNEL',
              },
              {
                id: guild.id,
                deny: 'VIEW_CHANNEL',
              },
              {
                id: sellerRoleID,
                allow: 'VIEW_CHANNEL',
              },
            ],
          })
          .then(async (channel) => {
            const array = foundDM.cart;
            let str = [];
            array.map((x) => {
              str.push(`${array.filter((y) => y === x).length} x ${x}`);
            });
            const embed = new MessageEmbed()
              .setTitle(`${user.tag}'s Shopping Cart`)
              .addField('Cart', [...new Set(str)].join('\n'))
              .addField(
                'Total',
                messageReaction.message.embeds[0].fields[2].value,
              )
              .addField('Order ID', foundDM.specialID)
              .setColor(embedColor.cart);
            await channel.send(embed);
            await messageReaction.message.delete();
            await user
              .send(
                new MessageEmbed()
                  .setTitle('🛍 Your order has been received')
                  .setDescription(
                    `Please send the correct payments to the PayPal link(s) below make sure to include your order ID number (${foundDM.specialID})\n${mapped}`,
                  )
                  .setColor(embedColor.processingOrder),
              )
              .then(async (message) => {
                let completeOrder = new CompletedOrder({
                  dmID: foundDM.dmID,
                  specialID: foundDM.specialID,
                  archiveChannel: channel.id,
                  buyerID: user.id,
                  cart: foundDM.cart,
                  sellers: sellers,
                  price: messageReaction.message.embeds[0].fields[2].value,
                });
                completeOrder.save().catch((error) => {});
                await openDM.deleteOne({ buyerID: user.id });
              });
          });
      }
      if (messageReaction.emoji.name === '🗑') {
        await messageReaction.message.delete();
        await user.send(
          new MessageEmbed()
            .setTitle('Order Deleted 🗑')
            .setDescription('Your order has been deleted')
            .setColor(embedColor.cancel),
        );
        await openDM.deleteOne({ buyerID: user.id });
      }
    }
  } else {
    let foundProduct = await Product.findOne({
      messageID: messageReaction.message.id,
    });
    if (!foundProduct) return;
    await messageReaction.users.fetch();
    let foundDM = await openDM.findOne({ buyerID: user.id });
    if (messageReaction.emoji.name === '🛒') {
      if (!foundDM) {
        let ID = makeID(5);
        let price = foundProduct.price.replace(/\D/g, '');
        user
          .send(
            new MessageEmbed()
              .setTitle('Shopping Cart')
              .setDescription(
                'This is your shopping cart.\nReact with :white_check_mark: to continue to checkout or with :wastebasket: to delete your order',
              )
              .addField('Information', `Name: ${user.tag}\nOrder ID: ${ID}`)
              .addField('Items', `1 x ${foundProduct.name}`, true)
              .addField('Total Price', '$' + price, true)
              .setColor(embedColor.cart),
          )
          .then(async (message) => {
            await message.react('✅');
            await message.react('🗑');
            let newDM = new openDM({
              buyerID: user.id,
              dmID: message.channel.id,
              cartMessage: message.id,
              specialID: ID,
              cart: [foundProduct.name],
            });
            newDM.save().catch((e) => console.log(e));
          });
        messageReaction.users.cache.forEach((user) => {
          if (user.id !== client.user.id) {
            messageReaction.users.remove(user);
          }
        });
      } else {
        messageReaction.users.cache.forEach((user) => {
          if (user.id !== client.user.id) {
            messageReaction.users.remove(user);
          }
        });
        let cachedDM = await client.channels.fetch(foundDM.dmID);
        if (cachedDM) {
          cachedDM.messages.fetch(foundDM.cartMessage).then(async (message) => {
            const currentArray = foundDM.cart;
            currentArray.push(foundProduct.name);
            foundDM.cart = currentArray;
            await foundDM.save().catch((e) => console.log(e));
            const array = foundDM.cart;
            let str = [];
            array.map((x) => {
              str.push(`${array.filter((y) => y === x).length} x ${x}`);
            });
            let oldEmbed = message.embeds[0];
            oldEmbed.fields[1].value = [...new Set(str)].join('\n');
            let price = foundProduct.price.replace(/\D/g, '');
            let oldPrice = oldEmbed.fields[2].value.replace(/\D/g, '');
            let total = parseFloat(oldPrice) + parseFloat(price);
            oldEmbed.fields[2].value = '$' + total;
            await message.edit(
              new MessageEmbed(oldEmbed).setColor(embedColor.cart),
            );
          });
        }
      }
    }
    if (messageReaction.emoji.name === '🗑') {
      messageReaction.users.cache.forEach((user) => {
        if (user.id !== client.user.id) {
          messageReaction.users.remove(user);
        }
      });
      if (!foundDM) {
        return;
      } else {
        let cachedDM = await client.channels.fetch(foundDM.dmID);
        if (cachedDM) {
          cachedDM.messages.fetch(foundDM.cartMessage).then(async (message) => {
            let currentArray = foundDM.cart;
            currentArray.splice(currentArray.indexOf(foundProduct.name), 1);
            foundDM.cart = currentArray;
            await foundDM.save().catch((e) => console.log(e));
            const array = foundDM.cart;
            let str = [];
            array.map((x) => {
              str.push(`${array.filter((y) => y === x).length} x ${x}`);
            });
            let oldEmbed = message.embeds[0];
            oldEmbed.fields[1].value = [...new Set(str)].join('\n');
            let price = foundProduct.price.replace(/\D/g, '');
            let oldPrice = oldEmbed.fields[2].value.replace(/\D/g, '');
            let total = parseFloat(oldPrice) - parseFloat(price);
            oldEmbed.fields[2].value = '$' + total;
            try {
              message.edit(new MessageEmbed(oldEmbed));
            } catch (e) {
              if (e.message === 'MessageEmbed field values may not be empty.') {
                await message.delete();
                await cachedDM.send(
                  new MessageEmbed()
                    .setTitle('Order Deleted 🗑')
                    .setDescription(
                      'Your order has been deleted since you have removed all items from your cart',
                    )
                    .setColor(embedColor.cancel),
                );
                await openDM.deleteOne({ buyerID: user.id });
              }
            }
          });
        }
      }
    }
  }
});
client.login(token);
