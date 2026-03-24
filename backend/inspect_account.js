import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const TradingAccount = mongoose.model('TradingAccount', new mongoose.Schema({
      accountId: String,
      balance: Number,
      credit: Number,
      leverage: String,
      status: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }, { strict: false, collection: 'tradingaccounts' }));

    const specific = await TradingAccount.findOne({ accountId: /74263341/ });
    console.log('--- TARGET ACCOUNT ---');
    console.log(specific);
    
    // Also log open trades margin if it exists
    if (specific) {
       const Trade = mongoose.model('Trade', new mongoose.Schema({
          tradingAccountId: { type: mongoose.Schema.Types.ObjectId },
          status: String,
          marginUsed: Number
       }, {strict: false, collection: 'trades'}));
       const openTrades = await Trade.find({ tradingAccountId: specific._id, status: 'OPEN' });
       console.log('--- OPEN TRADES MARGIN ---');
       const totalMargin = openTrades.reduce((acc, t) => acc + (t.marginUsed || 0), 0);
       console.log('Total Margin Used:', totalMargin);
    }

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
