import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const TradeSettings = mongoose.model('TradeSettings', new mongoose.Schema({
      accountTypeId: { type: mongoose.Schema.Types.ObjectId },
    }, { strict: false, collection: 'tradesettings' }));

    const settings = await TradeSettings.findOne({ accountTypeId: '6967f814bc6cb76b40bbe2ed' });
    console.log('TradeSettings:', settings);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
