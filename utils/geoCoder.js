const nodeGeocoder = require("node-geocoder");

const options = {
  provider: process.env.GEOCODER_PROVIDER,
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
};

//From Documentation  https://github.com/nchaulet/node-geocoder
const geocoder = nodeGeocoder(options);

module.exports = geocoder;
