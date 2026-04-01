const fs = require('fs');

const content = fs.readFileSync('backend/scripts/seedEmailTemplates.js', 'utf8');

const parts = content.split(/<<<<<<< HEAD\r?\n/);
if (parts.length > 1) {
    let newContent = parts[0];
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const sub = part.split(/=======\r?\n/);
        const headPart = sub[0];
        
        const dipteshSub = sub[1].split(/>>>>>>>[^\n]*\n?/);
        const dipteshPart = dipteshSub[0];
        const rest = dipteshSub.slice(1).join('');
        
        let depositMatch = dipteshPart.match(/(\s*\{\s*name:\s*'Deposit Confirmation'[\s\S]*?\n  \})/);
        let withdrawalMatch = dipteshPart.match(/(\s*\{\s*name:\s*'Withdrawal Confirmation'[\s\S]*?\n  \})/);
        
        newContent += headPart.replace(/\s*$/, ''); // trim trailing spaces before appending
        
        if (depositMatch) {
            newContent += ',\n' + depositMatch[1];
        }
        if (withdrawalMatch) {
            newContent += ',\n' + withdrawalMatch[1];
        }
        
        newContent += '\n' + rest.trimStart();
    }
    fs.writeFileSync('backend/scripts/seedEmailTemplates.js', newContent, 'utf8');
    console.log("Resolved conflicts successfully.");
} else {
    console.log("No conflicts found.");
}
