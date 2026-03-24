import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const userId = '67d189bb1de5de1de2cd7b5b';

    const Wallet = mongoose.model('Wallet', new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      balance: Number
    }, { strict: false }));
    const wallet = await Wallet.findOne({ userId });
    console.log('Wallet:', wallet);

    const ChallengeAccount = mongoose.model('ChallengeAccount', new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      accountId: String,
      currentBalance: Number,
      currentEquity: Number
    }, { strict: false }));
    const cAcc = await ChallengeAccount.find({ userId });
    console.log('ChallengeAccounts for user:', cAcc);

    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String
    }, { strict: false }));
    const user = await User.findById(userId);
    console.log('User:', user?.firstName, user?.lastName, user?.email);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
