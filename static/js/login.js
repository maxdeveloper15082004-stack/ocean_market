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

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name').value;
        const phoneInput = document.getElementById('phone').value;
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.querySelector('span').innerText;
        
        // We'll optionally show an error message if added to the DOM
        let errorMessage = document.getElementById('login-error');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'login-error';
            errorMessage.style.color = 'red';
            errorMessage.style.marginTop = '10px';
            errorMessage.style.textAlign = 'center';
            loginForm.insertBefore(errorMessage, submitBtn);
        }
        
        errorMessage.textContent = "";
        submitBtn.querySelector('span').innerText = "Logging in...";
        submitBtn.disabled = true;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const nextUrl = urlParams.get('next') || "/";
            
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameInput, phone: phoneInput, next: nextUrl })
            });

            const data = await response.json();

            if (data.success) {
                errorMessage.style.color = "green";
                errorMessage.textContent = data.message;
                setTimeout(() => {
                    window.location.href = data.redirect_url || "/";
                }, 500);
            } else {
                submitBtn.querySelector('span').innerText = originalText;
                submitBtn.disabled = false;
                errorMessage.style.color = "red";
                errorMessage.textContent = data.message;
            }
        } catch (error) {
            submitBtn.querySelector('span').innerText = originalText;
            submitBtn.disabled = false;
            errorMessage.style.color = "red";
            errorMessage.textContent = "Network error. Please try again.";
        }
    });
});
