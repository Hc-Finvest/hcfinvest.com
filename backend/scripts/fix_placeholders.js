import fs from 'fs';
import path from 'path';

const filesToFix = [
  'c:\\Users\\DELL\\Documents\\HC-FINVEST - UPDATED - Copy\\backend\\scripts\\seedEmailTemplates.js',
  'c:\\Users\\DELL\\Documents\\HC-FINVEST - UPDATED - Copy\\backend\\scripts\\deployEmail.js',
  'c:\\Users\\DELL\\Documents\\HC-FINVEST - UPDATED - Copy\\backend\\scripts\\CompetitionEmailTemplate.js'
];

const maps = {
  '{{OTP}}': '{{otp}}',
  '{{NAME}}': '{{user_name}}',
  '{{EMAIL}}': '{{email}}',
  '{{AMOUNT}}': '{{amount}}',
  '{{METHOD}}': '{{method}}',
  '{{TXN_ID}}': '{{txn_id}}',
  '{{DOC_TYPE}}': '{{doc_type}}',
  '{{DOC_NUMBER}}': '{{doc_number}}',
  '{{COMPETITION_NAME}}': '{{competition_name}}',
  '{{START_DATE}}': '{{start_date}}',
  '{{END_DATE}}': '{{end_date}}'
};

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacedCount = 0;
    
    for (const [oldVal, newVal] of Object.entries(maps)) {
      const regex = new RegExp(oldVal, 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, newVal);
        replacedCount += matches.length;
      }
    }
    
    if (replacedCount > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${path.basename(filePath)}: ${replacedCount} replacements made.`);
    } else {
      console.log(`ℹ️ No uppercase placeholders found in ${path.basename(filePath)}.`);
    }
  }
});
