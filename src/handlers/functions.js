const { nanoid } = require('nanoid')
module.exports = {
    makeID(length) {
        return nanoid(length);
    },
}