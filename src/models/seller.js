const { model, Schema } = require("mongoose");
const log = new Schema({
    sellerID: String,
    paypal: String,
});
module.exports = model("sellers", log);