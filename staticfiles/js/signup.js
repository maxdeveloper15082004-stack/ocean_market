document.addEventListener('DOMContentLoaded', () => {
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const otpInputSection = document.getElementById('otp-input-section');
    const sendOtpSection = document.getElementById('send-otp-section');
    const signupForm = document.getElementById('signupForm');
    const otpMessage = document.getElementById('otp-message');
    const otpTimer = document.getElementById('otp-timer');
    const timerCount = document.getElementById('timer-count');
    const submitBtn = document.getElementById('submitBtn');
    
    // Initially disable Create Account button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    }

    let countdownInterval;

    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        if (group.id !== 'otp-input-section') {
            group.style.opacity = '0';
            group.style.transform = 'translateY(10px)';
            group.style.animation = `slideUpItem 0.4s ease forwards ${0.3 + (index * 0.1)}s`;
        }
    });

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideUpItem {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    function startTimer() {
        let duration = 5 * 60; // 5 minutes
        otpTimer.style.display = 'block';
        resendOtpBtn.style.display = 'none';
        
        clearInterval(countdownInterval);
        
        countdownInterval = setInterval(() => {
            let minutes = parseInt(duration / 60, 10);
            let seconds = parseInt(duration % 60, 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            timerCount.textContent = minutes + ":" + seconds;

            if (--duration < 0) {
                clearInterval(countdownInterval);
                timerCount.textContent = "00:00";
                resendOtpBtn.style.display = 'block';
                resendOtpBtn.disabled = false;
                otpMessage.style.color = "red";
                otpMessage.textContent = "OTP expired. Please click Resend OTP.";
            }
        }, 1000);
    }

    async function handleSendOTP() {
        const phoneInput = document.getElementById('phone').value;
        const nameInput = document.getElementById('name').value;
        
        if(!nameInput.trim() || !phoneInput.trim()) {
            alert("Please enter full name and phone number (e.g., +918888888888).");
            return;
        }

        const btnToUpdate = sendOtpSection.style.display === 'none' ? resendOtpBtn : sendOtpBtn;
        const originalText = btnToUpdate.innerText;
        btnToUpdate.innerText = "Sending...";
        btnToUpdate.disabled = true;
        otpMessage.textContent = "";

        try {
            const response = await fetch('/api/send-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneInput, name: nameInput })
            });

            const data = await response.json();

            if (data.success) {
                btnToUpdate.innerText = "OTP Sent!";
                
                // Show OTP Input section
                sendOtpSection.style.display = 'none';
                otpInputSection.style.display = 'block';
                
                // Enable Submit button as it handles verification now
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                
                otpMessage.style.color = "green";
                otpMessage.textContent = data.message;
                
                document.getElementById('otp').focus();
                startTimer();
            } else {
                btnToUpdate.innerText = originalText;
                btnToUpdate.disabled = false;
                otpMessage.style.color = "red";
                otpMessage.textContent = data.message;
            }
        } catch (error) {
            btnToUpdate.innerText = originalText;
            btnToUpdate.disabled = false;
            otpMessage.style.color = "red";
            otpMessage.textContent = "Network error while sending OTP.";
        }
    }

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', handleSendOTP);
    }
    
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', handleSendOTP);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (otpInputSection.style.display === 'none') {
                alert("Please request an OTP first.");
                return;
            }

            const phoneInput = document.getElementById('phone').value;
            const otpInput = document.getElementById('otp').value;
            const nameInput = document.getElementById('name').value;

            if (otpInput.length !== 6) {
                otpMessage.style.color = "red";
                otpMessage.textContent = "Please enter exactly 6 digits.";
                return;
            }

            const originalText = submitBtn.querySelector('span').innerText;
            submitBtn.querySelector('span').innerText = "Verifying...";
            submitBtn.disabled = true;
            otpMessage.textContent = "";

            try {
                const response = await fetch('/api/verify-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phoneInput, otp: otpInput, name: nameInput })
                });

                const data = await response.json();

                if (data.success) {
                    otpMessage.style.color = "green";
                    otpMessage.textContent = data.message;
                    clearInterval(countdownInterval);
                    timerCount.textContent = "Verified!";
                    
                    // Redirect to login page on success
                    setTimeout(() => {
                        window.location.href = "/login/";
                    }, 1500);
                } else {
                    submitBtn.querySelector('span').innerText = originalText;
                    submitBtn.disabled = false;
                    otpMessage.style.color = "red";
                    otpMessage.textContent = data.message;
                }
            } catch (error) {
                submitBtn.querySelector('span').innerText = originalText;
                submitBtn.disabled = false;
                otpMessage.style.color = "red";
                otpMessage.textContent = "Error verifying OTP. Please try again.";
            }
        });
    }
});
