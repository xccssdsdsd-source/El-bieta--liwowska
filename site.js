(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');

  const updateScroll = () => {
    nav?.classList.toggle('visible', scrollY > Math.min(120, innerHeight * 0.12));
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  };

  updateScroll();
  addEventListener('scroll', updateScroll, { passive: true });

  const services = [...document.querySelectorAll('.service')];
  const setOpenService = selected => {
    services.forEach(service => {
      const open = service === selected;
      service.classList.toggle('open', open);
      service.querySelector('.service-toggle')?.setAttribute('aria-expanded', String(open));
    });
  };

  services.forEach(service => {
    service.querySelector('.service-toggle')?.addEventListener('click', () => setOpenService(service));
  });

  const steps = [...document.querySelectorAll('.step')];
  steps.forEach(step => {
    step.addEventListener('click', () => {
      steps.forEach(item => item.classList.toggle('active', item === step));
    });
  });

  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 55}ms`);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(element => element.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    reveals.forEach(element => observer.observe(element));
  }

  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const message = [
      'Dzień dobry, chciałabym/chciałbym porozmawiać o nieruchomości.',
      `Imię: ${data.get('name')}`,
      `Telefon: ${data.get('phone')}`,
      `Temat: ${data.get('topic')}`
    ].filter(Boolean).join('\n');

    location.href = `sms:+48668887845?body=${encodeURIComponent(message)}`;
  });

  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatSend = chatForm?.querySelector('button[type="submit"]');
  const chatHistory = [];

  const addChatMessage = (text, type) => {
    const message = document.createElement('div');
    message.className = `chat-message ${type}`;
    message.textContent = text;
    chatMessages?.append(message);
    return message;
  };

  document.querySelectorAll('.faq-prompts button').forEach(button => {
    button.addEventListener('click', () => {
      if (!chatInput || !chatForm) return;
      chatInput.value = button.dataset.question || button.textContent.trim();
      chatForm.requestSubmit();
    });
  });

  chatForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!chatInput || !chatMessages || !chatSend) return;

    const text = chatInput.value.trim();
    if (!text || chatInput.disabled) return;

    addChatMessage(text, 'user');
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    const typing = addChatMessage('Piszę odpowiedź…', 'bot typing');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się uzyskać odpowiedzi.');

      typing?.remove();
      addChatMessage(data.reply, 'bot');
      chatHistory.push({ role: 'user', text }, { role: 'model', text: data.reply });
      if (chatHistory.length > 10) chatHistory.splice(0, chatHistory.length - 10);
    } catch (error) {
      typing?.remove();
      addChatMessage(error.message || 'Asystent jest chwilowo niedostępny. Spróbuj ponownie.', 'bot error');
    } finally {
      chatInput.disabled = false;
      chatSend.disabled = false;
      chatInput.focus();
    }
  });
})();
