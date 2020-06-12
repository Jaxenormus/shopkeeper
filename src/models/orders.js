const { model, Schema } = require("mongoose");
const log = new Schema({
    buyerID: String,
    dmID: String,
    cartMessage: String,
    specialID: String,
    serverChannelID: String,
    cart: Array,
    completed: Boolean
});
module.exports = model("orders", log);