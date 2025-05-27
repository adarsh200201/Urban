// Script to clear all localStorage data
console.log('Clearing all localStorage data...');

const itemsToRemove = [
  'user',
  'userBookings',
  'lastBooking', 
  'userId',
  'userEmail',
  'userMobile',
  'userName',
  'selectedCabData',
  'adminAuth'
];

// Remove specific keys
itemsToRemove.forEach(item => {
  if (localStorage.getItem(item)) {
    console.log(`Removing localStorage item: ${item}`);
    localStorage.removeItem(item);
  }
});

// Clear everything else just to be safe
console.log('Clearing all remaining localStorage items');
localStorage.clear();

console.log('All localStorage data has been cleared successfully');
