const { model, Schema } = require("mongoose");
const completedorder = new Schema({
    dmID: String,
    specialID: String,
    archiveChannel: String,
    buyerID: String,
    cart: Array,
    sellers: Array,
    price: String,
});
module.exports = model("completed-orders", completedorder);