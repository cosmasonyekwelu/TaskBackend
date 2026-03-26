const mongoose = require("mongoose");

const connectDb = async (uri) => {
  await mongoose.connect(uri, {
    autoIndex: false,
    maxPoolSize: 50,
    minPoolSize: 5
  });
};

module.exports = { connectDb, mongoose };
