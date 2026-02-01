document.addEventListener('DOMContentLoaded', function () {

    const year = document.getElementById('year');
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (window.GLightbox) {
        GLightbox({
            selector: '.glightbox',
            loop: true,
            touchNavigation: true,
            keyboardNavigation: true,
            /* Fade effect is better for high-res PNGs on mobile GPUs */
            openEffect: 'fade',
            closeEffect: 'fade',
            svg: {
                next: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
                prev: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>'
            }
        });
    }

    const form = document.getElementById('newsletterForm');
    const message = document.getElementById('newsletterMessage');

    if (!form || !message) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value.trim();
        const captchaResponse = window.turnstile?.getResponse?.() || null;

        if (!email || !email.includes('@')) {
            message.textContent = 'Please enter a valid email address.';
            message.className = 'newsletter-message error';
            return;
        }

        if (!captchaResponse) {
            message.textContent = 'Error: CAPTCHA validation failed.';
            message.className = 'newsletter-message error';
            return;
        }

        message.textContent = 'Submitting...';
        message.className = 'newsletter-message processing';

        try {
            /* Standard relative path for Cloudflare Worker interception */
            const res = await fetch('/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    turnstileToken: captchaResponse
                })
            });

            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || 'Unknown error');

            message.textContent = 'Thank you for subscribing!';
            message.className = 'newsletter-message success';
            emailInput.value = '';
            
            if (window.turnstile?.reset) {
                window.turnstile.reset();
            }

        } catch (err) {
            message.textContent = 'Error submitting email. Please try again.';
            message.className = 'newsletter-message error';
            console.error('Newsletter submission error:', err);
            
            if (window.turnstile?.reset) {
                window.turnstile.reset();
            }
        } finally {
            setTimeout(() => {
                if (message.className.includes('success')) {
                    message.textContent = '';
                }
            }, 5000);
        }
    });

});