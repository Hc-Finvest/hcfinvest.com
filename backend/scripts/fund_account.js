
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import model using the full path since we are in a script
import TradingAccount from '../models/TradingAccount.js';

async function fundAccount(accountId, amount) {
    try {
        console.log(`[FundScript] Connecting to MongoDB...`);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(`[FundScript] Connected.`);

        console.log(`[FundScript] Searching for account: ${accountId}`);
        const account = await TradingAccount.findOne({ accountId: accountId });

        if (!account) {
            console.error(`[FundScript] ERROR: Account ${accountId} not found in database.`);
            process.exit(1);
        }

        const oldBalance = account.balance || 0;
        account.balance = oldBalance + amount;
        
        await account.save();
        
        console.log(`[FundScript] SUCCESS!`);
        console.log(`[FundScript] Account: ${accountId}`);
        console.log(`[FundScript] Old Balance: $${oldBalance}`);
        console.log(`[FundScript] Added: $${amount}`);
        console.log(`[FundScript] New Balance: $${account.balance}`);

        process.exit(0);
    } catch (error) {
        console.error(`[FundScript] UNEXPECTED ERROR:`, error);
        process.exit(1);
    }
}

const targetAccountId = '91120439';
const fundAmount = 5000;

fundAccount(targetAccountId, fundAmount);
