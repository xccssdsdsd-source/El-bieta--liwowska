(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const nav = document.getElementById('nav')
  const progress = document.getElementById('progress')

  const updateScroll = () => {
    nav?.classList.toggle('visible', scrollY > Math.min(120, innerHeight * 0.12))
    const max = document.documentElement.scrollHeight - innerHeight
    if (progress) progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`
  }

  updateScroll()
  addEventListener('scroll', updateScroll, { passive: true })

  const services = [...document.querySelectorAll('.service')]
  const serviceSection = document.querySelector('.services')
  let activeServiceIndex = -1
  const serviceThresholds = [0.16, 0.38, 0.6, 0.82]
  let serviceWheelLocked = false

  const setOpenService = selected => {
    activeServiceIndex = services.indexOf(selected)
    services.forEach(service => {
      const open = service === selected
      service.classList.toggle('open', open)
      service.querySelector('.service-toggle')?.setAttribute('aria-expanded', String(open))
    })
  }

  const setOpenServiceIndex = index => {
    activeServiceIndex = Math.max(-1, Math.min(services.length - 1, index))
    services.forEach((service, serviceIndex) => {
      const open = serviceIndex === activeServiceIndex
      service.classList.toggle('open', open)
      service.querySelector('.service-toggle')?.setAttribute('aria-expanded', String(open))
    })
  }

  services.forEach(service => {
    service.querySelector('.service-toggle')?.addEventListener('click', () => setOpenService(service))
  })

  const updateServices = () => {
    if (!serviceSection || !services.length) return
    if (innerWidth <= 980 || reduceMotion) {
      if (activeServiceIndex < 0) setOpenServiceIndex(0)
      return
    }

    const rect = serviceSection.getBoundingClientRect()
    const scrollRange = Math.max(1, serviceSection.offsetHeight - innerHeight)
    const progress = Math.max(0, Math.min(0.9999, -rect.top / scrollRange))
    let nextIndex = -1
    serviceThresholds.forEach((threshold, index) => {
      if (progress >= threshold) nextIndex = index
    })
    if (nextIndex !== activeServiceIndex) setOpenServiceIndex(nextIndex)
  }

  const scrollToServiceIndex = index => {
    if (!serviceSection) return
    const scrollRange = Math.max(1, serviceSection.offsetHeight - innerHeight)
    const progress = index < 0 ? 0 : serviceThresholds[Math.min(index, serviceThresholds.length - 1)]
    scrollTo({
      top: serviceSection.offsetTop + (scrollRange * progress),
      behavior: reduceMotion ? 'auto' : 'smooth'
    })
  }

  const handleServicesWheel = event => {
    if (!serviceSection || !services.length || innerWidth <= 980 || reduceMotion) return

    const rect = serviceSection.getBoundingClientRect()
    const inPinnedRange = rect.top <= 2 && rect.bottom >= innerHeight - 2
    if (!inPinnedRange || Math.abs(event.deltaY) < 8) return

    const direction = event.deltaY > 0 ? 1 : -1
    const canMoveDown = direction > 0 && activeServiceIndex < services.length - 1
    const canMoveUp = direction < 0 && activeServiceIndex > -1
    if (!canMoveDown && !canMoveUp) return

    event.preventDefault()
    if (serviceWheelLocked) return

    const step = Math.abs(event.deltaY) > 900 ? 2 : 1
    const nextIndex = Math.max(-1, Math.min(services.length - 1, activeServiceIndex + (direction * step)))
    serviceWheelLocked = true
    setOpenServiceIndex(nextIndex)
    scrollToServiceIndex(nextIndex)
    setTimeout(() => {
      serviceWheelLocked = false
    }, reduceMotion ? 80 : 560)
  }

  setOpenServiceIndex(innerWidth <= 980 ? 0 : -1)
  updateServices()
  addEventListener('scroll', updateServices, { passive: true })
  addEventListener('wheel', handleServicesWheel, { passive: false })
  addEventListener('resize', updateServices)

  const steps = [...document.querySelectorAll('.step')]
  const process = document.querySelector('.process')
  let activeStepIndex = 0

  const setActiveStep = index => {
    activeStepIndex = Math.max(0, Math.min(steps.length - 1, index))
    steps.forEach((item, itemIndex) => {
      const active = itemIndex === activeStepIndex
      item.classList.toggle('active', active)
      item.setAttribute('aria-current', active ? 'step' : 'false')
    })
  }

  steps.forEach((step, index) => {
    step.addEventListener('click', () => {
      setActiveStep(index)
    })
  })

  const updateProcess = () => {
    if (!process || innerWidth <= 980 || reduceMotion) return
    const rect = process.getBoundingClientRect()
    const scrollRange = Math.max(1, process.offsetHeight - innerHeight)
    const progress = Math.max(0, Math.min(0.9999, -rect.top / scrollRange))
    const nextIndex = Math.floor(progress * steps.length)
    if (nextIndex !== activeStepIndex) setActiveStep(nextIndex)
  }

  setActiveStep(0)
  updateProcess()
  addEventListener('scroll', updateProcess, { passive: true })
  addEventListener('resize', updateProcess)

  if ('IntersectionObserver' in window) {
    const mobileStepObserver = new IntersectionObserver(entries => {
      if (innerWidth > 980) return
      const centered = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (centered) setActiveStep(steps.indexOf(centered.target))
    }, { rootMargin: '-24% 0px -24% 0px', threshold: [0.25, 0.5, 0.75] })

    steps.forEach(step => mobileStepObserver.observe(step))
  }

  const reveals = document.querySelectorAll('.reveal')
  reveals.forEach((element, index) => {
    element.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 55}ms`)
  })

  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(element => element.classList.add('visible'))
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    reveals.forEach(element => observer.observe(element))
  }

  const contactForm = document.getElementById('contact-form')
  contactForm?.addEventListener('submit', event => {
    event.preventDefault()
    const data = new FormData(contactForm)
    const message = [
      'Dzień dobry, chciałabym/chciałbym porozmawiać o nieruchomości.',
      `Imię: ${data.get('name')}`,
      `Telefon: ${data.get('phone')}`,
      `Temat: ${data.get('topic')}`
    ].filter(Boolean).join('\n')

    location.href = `sms:+48668887845?body=${encodeURIComponent(message)}`
  })

  const chatForm = document.getElementById('chat-form')
  const chatInput = document.getElementById('chat-input')
  const chatMessages = document.getElementById('chat-messages')
  const chatSend = chatForm?.querySelector('button[type="submit"]')
  const assistant = document.querySelector('.quote-assistant')
  const chatHistory = []

  assistant?.addEventListener('pointermove', event => {
    const rect = assistant.getBoundingClientRect()
    assistant.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    assistant.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
  })

  const appendInline = (parent, text) => {
    const parts = text.split(/(\*\*.+?\*\*)/g)
    parts.forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const strong = document.createElement('strong')
        strong.textContent = part.slice(2, -2)
        parent.append(strong)
      } else {
        parent.append(document.createTextNode(part))
      }
    })
  }

  const formatReply = (container, text) => {
    const lines = text.replace(/\r/g, '').split('\n')
    let list

    lines.forEach(rawLine => {
      const line = rawLine.trim()
      if (!line) {
        list = undefined
        return
      }

      const listMatch = line.match(/^(?:[-•*]|\d+[.)])\s+(.+)$/)
      if (listMatch) {
        if (!list) {
          list = document.createElement('ul')
          container.append(list)
        }
        const item = document.createElement('li')
        appendInline(item, listMatch[1])
        list.append(item)
        return
      }

      list = undefined
      const paragraph = document.createElement('p')
      appendInline(paragraph, line.replace(/^#{1,4}\s+/, ''))
      container.append(paragraph)
    })
  }

  const addChatMessage = (text, type) => {
    const message = document.createElement('div')
    message.className = `chat-message ${type}`

    const avatar = document.createElement('span')
    avatar.className = 'message-avatar'
    avatar.setAttribute('aria-hidden', 'true')
    avatar.textContent = type.includes('user') ? 'Ty' : 'EŚ'

    const content = document.createElement('div')
    content.className = 'message-content'
    if (type.includes('typing') || type.includes('error') || type.includes('user')) {
      content.textContent = text
    } else {
      formatReply(content, text)
    }

    message.append(avatar, content)
    chatMessages?.append(message)
    requestAnimationFrame(() => {
      if (!chatMessages) return
      chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
    })
    return message
  }

  document.querySelectorAll('.faq-prompts button').forEach(button => {
    button.addEventListener('click', () => {
      if (!chatInput || !chatForm) return
      chatInput.value = button.dataset.question || button.textContent.trim()
      chatForm.requestSubmit()
    })
  })

  chatForm?.addEventListener('submit', async event => {
    event.preventDefault()
    if (!chatInput || !chatMessages || !chatSend) return

    const text = chatInput.value.trim()
    if (!text || chatInput.disabled) return

    addChatMessage(text, 'user')
    chatInput.value = ''
    chatInput.disabled = true
    chatSend.disabled = true
    assistant?.setAttribute('aria-busy', 'true')
    const typing = addChatMessage('Piszę odpowiedź…', 'bot typing')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Nie udało się uzyskać odpowiedzi.')

      typing.remove()
      addChatMessage(data.reply, 'bot')
      chatHistory.push({ role: 'user', text }, { role: 'model', text: data.reply })
      if (chatHistory.length > 10) chatHistory.splice(0, chatHistory.length - 10)
    } catch (error) {
      typing.remove()
      addChatMessage(error.message || 'Asystent jest chwilowo niedostępny. Spróbuj ponownie.', 'bot error')
    } finally {
      assistant?.setAttribute('aria-busy', 'false')
      chatInput.disabled = false
      chatSend.disabled = false
      chatInput.focus()
    }
  })
})()
