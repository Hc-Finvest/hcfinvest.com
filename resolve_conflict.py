import re

with open('backend/scripts/seedEmailTemplates.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I want to extract the extra templates that Diptesh added (Deposit and Withdrawal)
# and append them, while keeping the HEAD version of Welcome and Password Reset.
# The `=======` divider separates HEAD from Diptesh.

parts = re.split(r'<<<<<<< HEAD\n', content)
if len(parts) > 1:
    new_content = parts[0]
    for part in parts[1:]:
        head_part = part.split('=======\n')[0]
        diptesh_part = part.split('=======\n')[1].split(r'>>>>>>>')[0]
        rest = part.split(r'>>>>>>>')[1].split('\n', 1)[1] if len(part.split(r'>>>>>>>')) > 1 else ''
        
        # We want to keep head_part. 
        # But we also want to extract any completely new templates from diptesh_part.
        # Diptesh's part has { name: 'Deposit Confirmation', ... }
        # Let's just find all `{ name: '...` in diptesh_part and see if they exist in head_part.
        
        # Actually, simpler: just regex to find the start of Deposit Confirmation
        deposit_match = re.search(r'(  \{\n    name: \'Deposit Confirmation\'.*?\n  \})', diptesh_part, re.DOTALL)
        withdrawal_match = re.search(r'(  \{\n    name: \'Withdrawal Confirmation\'.*?\n  \})', diptesh_part, re.DOTALL)
        
        new_content += head_part
        if deposit_match:
            new_content += ',\n' + deposit_match.group(1)
        if withdrawal_match:
            new_content += ',\n' + withdrawal_match.group(1)
        new_content += rest
    
    with open('backend/scripts/seedEmailTemplates.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Resolved conflicts.")
else:
    print("No conflicts found.")
