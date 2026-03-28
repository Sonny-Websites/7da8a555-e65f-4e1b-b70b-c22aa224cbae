const fields = ['name', 'email', 'message'];

const validators = {
  name(value) {
    return value.trim().length >= 2 ? '' : 'Name must be at least 2 characters.';
  },
  email(value) {
    if (!value.trim()) {
      return 'Email is required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailPattern.test(value.trim()) ? '' : 'Please enter a valid email address.';
  },
  message(value) {
    return value.trim().length >= 10 ? '' : 'Message must be at least 10 characters.';
  }
};

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}Error`);

  if (!input || !error) {
    return;
  }

  error.textContent = message;
  input.classList.toggle('error', Boolean(message));
}

function validateField(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input) {
    return true;
  }

  const message = validators[fieldId](input.value);
  setFieldError(fieldId, message);
  return !message;
}

function setResponseMessage(message, isError = false) {
  const response = document.getElementById('responseMessage');
  if (!response) {
    return;
  }

  response.textContent = message;
  response.classList.toggle('error', isError);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) {
    return;
  }

  fields.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (!input) {
      return;
    }

    input.addEventListener('blur', () => {
      validateField(fieldId);
    });

    input.addEventListener('input', () => {
      validateField(fieldId);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setResponseMessage('');

    const isValid = fields.map((fieldId) => validateField(fieldId)).every(Boolean);
    if (!isValid) {
      setResponseMessage('Please fix the highlighted fields and submit again.', true);
      return;
    }

    const honeypot = form.querySelector('input[name="_hp"]');
    if (honeypot && honeypot.value.trim() !== '') {
      return;
    }

    const submitButton = document.getElementById('submitBtn');
    if (!submitButton) {
      return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.setAttribute('aria-busy', 'true');
    submitButton.textContent = 'Sending...';

    const payload = new URLSearchParams(new FormData(form));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('/__forms/contact', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      submitButton.textContent = 'Sent';
      const successUrl = form.getAttribute('data-success-url') || '/thank-you/';
      window.location.href = successUrl;
    } catch (error) {
      console.error('Form submit error:', error);
      setResponseMessage('Server error. Please try again.', true);
      submitButton.disabled = false;
      submitButton.setAttribute('aria-busy', 'false');
      submitButton.textContent = originalButtonText;
    } finally {
      clearTimeout(timeoutId);
    }
  });
});
