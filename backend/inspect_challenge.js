import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    
    const ChallengeAccount = mongoose.model('ChallengeAccount', new mongoose.Schema({
      accountId: String,
      currentBalance: Number,
      currentEquity: Number
    }, { strict: false, collection: 'challengeaccounts' }));

    const specificProp = await ChallengeAccount.findOne({ accountId: /74263341/ });
    console.log('--- TARGET CHALLENGE ACCOUNT ---');
    console.log(specificProp);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
