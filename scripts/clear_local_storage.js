// Script to clear all localStorage data from the old implementation
// Run this in the browser console: http://localhost:8080

console.log('=== Clearing Old Data ===');
console.log('Before clearing:');
console.log('app_user:', localStorage.getItem('app_user'));
console.log('app_users_db:', localStorage.getItem('app_users_db'));
console.log('app_bills:', localStorage.getItem('app_bills'));
console.log('app_documents:', localStorage.getItem('app_documents'));
console.log('app_chat:', localStorage.getItem('app_chat'));

// Clear all old localStorage keys
localStorage.removeItem('app_user');
localStorage.removeItem('app_users_db');
localStorage.removeItem('app_bills');
localStorage.removeItem('app_documents');
localStorage.removeItem('app_chat');

console.log('\n=== Data Cleared ===');
console.log('After clearing:');
console.log('app_user:', localStorage.getItem('app_user'));
console.log('app_users_db:', localStorage.getItem('app_users_db'));
console.log('app_bills:', localStorage.getItem('app_bills'));
console.log('app_documents:', localStorage.getItem('app_documents'));
console.log('app_chat:', localStorage.getItem('app_chat'));

console.log('\n✅ Old localStorage data has been cleared!');
console.log('You can now use the new Supabase authentication.');
