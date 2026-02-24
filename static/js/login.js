document.addEventListener('DOMContentLoaded', () => {
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const otpGroup = document.querySelector('.otp-group');
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

    if(sendOtpBtn) {
        sendOtpBtn.addEventListener('click', () => {
            const phoneInput = document.getElementById('phone').value;
            const nameInput = document.getElementById('name').value;
            
            if(!nameInput.trim() || !phoneInput.trim()) {
                alert("Please enter full name and phone number to receive OTP.");
                return;
            }

            sendOtpBtn.innerText = "Sending...";
            sendOtpBtn.disabled = true;
            
            setTimeout(() => {
                otpGroup.classList.add('otp-sent');
                const submitBtn = document.getElementById('submitBtn');
                submitBtn.querySelector('span').innerText = 'Verify & Login';
                
                document.getElementById('otp').focus();
            }, 800);
        });
    }

    loginForm.addEventListener('submit', (e) => {
        if (!otpGroup.classList.contains('otp-sent')) {
            e.preventDefault();
            alert("Please send and enter OTP first.");
        }
    });
});
