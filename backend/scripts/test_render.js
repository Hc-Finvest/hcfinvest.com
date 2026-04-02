import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRendering() {
  const template = new EmailTemplate({
    name: 'Test Template',
    slug: 'test-render',
    subject: 'Hello {{NAME}}',
    htmlContent: '<p>Welcome {{User_Name}}! Your code is {{OTP}}.</p>',
    textContent: 'Welcome {{user_name}}! Code: {{otp}}'
  });

  const data = {
    user_name: 'Antigravity',
    otp: '999888'
  };

  const rendered = template.render(data);
  console.log('--- Rendered Output ---');
  console.log('Subject:', rendered.subject);
  console.log('HTML:', rendered.html);
  console.log('Text:', rendered.text);

  if (rendered.subject.includes('Antigravity') && rendered.html.includes('999888')) {
    console.log('\n✅ Case-insensitive rendering passed!');
  } else {
    console.log('\n❌ Case-insensitive rendering failed!');
  }
}

testRendering();
