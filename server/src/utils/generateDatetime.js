const moment = require('moment-timezone');

const generateDatetime = (timezone = 'Asia/Dubai') => {
  return moment().tz(timezone).format('YYYY-MM-DD HH:mm:ss');
};

module.exports = { generateDatetime };
