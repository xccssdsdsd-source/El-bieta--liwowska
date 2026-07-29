(() => {
  const assistant = document.querySelector('.quote-assistant');
  const messages = document.getElementById('chat-messages');
  if (!assistant || !messages) return;

  const title = document.getElementById('assistant-title');
  const intro = assistant.querySelector('.assistant-intro');
  const firstMessage = messages.querySelector('.chat-message.bot');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  if (title) title.textContent = 'Zapytaj o swoją nieruchomość';
  if (intro) {
    intro.textContent = 'Opisz krótko swoją sytuację. Otrzymasz konkretną odpowiedź dotyczącą sprzedaży, zakupu, wynajmu lub dokumentów.';
  }
  if (firstMessage && messages.children.length === 1) {
    firstMessage.textContent = 'Dzień dobry. Napisz, czy chodzi o sprzedaż, zakup czy wynajem. Odpowiem konkretnie i wskażę następny krok.';
  }
  if (input) input.placeholder = 'Np. Jak przygotować mieszkanie do sprzedaży?';

  if (!assistant.querySelector('.premium-assistant-status')) {
    const status = document.createElement('div');
    status.className = 'premium-assistant-status';
    status.textContent = 'Asystent nieruchomości dostępny';
    intro?.insertAdjacentElement('afterend', status);
  }

  const appendInline = (parent, text) => {
    const pattern = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const strong = document.createElement('strong');
      strong.textContent = match[1];
      parent.append(strong);
      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parent.append(document.createTextNode(text.slice(lastIndex)));
    }
  };

  const formatMessage = message => {
    if (!(message instanceof HTMLElement) || message.dataset.premiumFormatted === 'true') return;
    if (message.classList.contains('typing')) return;

    const raw = message.textContent.trim();
    if (!raw) return;

    const lines = raw
      .replace(/\r/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (!lines.length) return;

    const fragment = document.createDocumentFragment();
    let paragraph = null;

    const flushParagraph = () => {
      if (paragraph && paragraph.textContent.trim()) fragment.append(paragraph);
      paragraph = null;
    };

    lines.forEach(line => {
      const cleaned = line.replace(/^#{1,4}\s+/, '').replace(/^[-•]\s+/, '');
      const isListItem = /^\d+[.)]\s+/.test(line) || /^[-•]\s+/.test(line);

      if (isListItem) {
        flushParagraph();
        const row = document.createElement('p');
        const listText = cleaned.replace(/^\d+[.)]\s+/, '');
        appendInline(row, `• ${listText}`);
        fragment.append(row);
        return;
      }

      if (!paragraph) paragraph = document.createElement('p');
      if (paragraph.childNodes.length) paragraph.append(document.createTextNode(' '));
      appendInline(paragraph, cleaned);
    });

    flushParagraph();
    message.replaceChildren(fragment);
    message.dataset.premiumFormatted = 'true';
  };

  const showMessageStart = message => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const top = Math.max(0, message.offsetTop - messages.offsetTop - 10);
        messages.scrollTo({ top, behavior: 'smooth' });
      });
    });
  };

  messages.querySelectorAll('.chat-message').forEach(formatMessage);

  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement) || !node.classList.contains('chat-message')) return;
        if (node.classList.contains('typing')) {
          assistant.setAttribute('aria-busy', 'true');
          return;
        }

        assistant.setAttribute('aria-busy', 'false');
        formatMessage(node);
        showMessageStart(node);
      });

      record.removedNodes.forEach(node => {
        if (node instanceof HTMLElement && node.classList.contains('typing')) {
          assistant.setAttribute('aria-busy', 'false');
        }
      });
    }
  });

  observer.observe(messages, { childList: true });

  form?.addEventListener('submit', () => {
    assistant.setAttribute('aria-busy', 'true');
  });

  document.querySelectorAll('.faq-prompts button').forEach(button => {
    button.setAttribute('aria-label', button.dataset.question || button.textContent.trim());
  });
})();
