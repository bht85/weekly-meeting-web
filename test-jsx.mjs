import fs from 'fs';
import { parse } from '@babel/parser';

const code = fs.readFileSync('FranchiseDashboard.jsx', 'utf-8');
try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator'],
  });
  console.log('Valid syntax!');
} catch (e) {
  console.error(e);
}
