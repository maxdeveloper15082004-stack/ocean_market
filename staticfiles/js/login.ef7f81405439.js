document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(10px)';
        group.style.animation = `slideUpItem 0.4s ease forwards ${0.3 + (index * 0.1)}s`;
    });

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideUpItem {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    loginForm.addEventListener('submit', (e) => {
        // Here you can handle the login submission logic directly.
        // As you only need name and phone, you don't need OTP anymore.
    });
});
