const form = document.querySelector('#grow-form');
const message = document.querySelector('#form-message');
const submitButton = form.querySelector('button[type="submit"]');
const submitLabel = submitButton.querySelector('.submit-label');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
document.querySelector('#year').textContent = new Date().getFullYear();

menuToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  menuToggle.textContent = isOpen ? '×' : '☰';
});
navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  menuToggle.textContent = '☰';
}));

function showMessage(text, type) {
  message.textContent = text;
  message.className = `form-message visible ${type}`;
  message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'form-message';
  message.textContent = '';
  if (!form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form).entries());
  submitButton.disabled = true;
  submitLabel.textContent = 'Sending your request…';
  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Something went wrong. Please try again.');
    form.reset();
    showMessage('Thank you! Your Herblife farmland enquiry has been received. We’ll review your details and contact you to discuss availability and next steps.', 'success');
  } catch (error) {
    showMessage(error.message || 'We couldn’t send your request. Please check your connection and try again.', 'error');
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = 'Send farmland enquiry';
  }
});
