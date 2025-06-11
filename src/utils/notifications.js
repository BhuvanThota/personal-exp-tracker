export function showSuccessNotification() {
  const notification = document.createElement('div');
  notification.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 z-50 bg-green-500 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg translate-y-[-100px] transition-all duration-300 max-w-sm mx-2';
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span class="text-sm">Profile updated successfully!</span>
    </div>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.remove('translate-y-[-100px]'), 100);
  setTimeout(() => {
    notification.classList.add('translate-y-[-100px]');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}
