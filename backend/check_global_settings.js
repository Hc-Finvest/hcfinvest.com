import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const TradeSettings = mongoose.model('TradeSettings', new mongoose.Schema({}, { strict: false, collection: 'tradesettings' }));

    const global = await TradeSettings.findOne({ isGlobal: true });
    console.log('Global TradeSettings:', global);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
