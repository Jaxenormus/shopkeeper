const { model, Schema } = require("mongoose");
const log = new Schema({
    messageID: String,
    sellerID: String,
    name: String,
    description: String,
    price: String,
    picture: String,
});
module.exports = model("items", log);