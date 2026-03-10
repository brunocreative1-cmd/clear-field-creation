/**
 * 🔍 BURGZ USER IDENTIFICATION SERVICE
 * Sistema avançado de identificação e fingerprinting de usuários
 * Detecta usuários únicos, sessões e possíveis fraudes
 */

class UserIdentificationService {
  constructor() {
    this.fingerprint = null
    this.deviceId = null
    this.sessionId = null
    this.userId = null
    this.confidence = 0
  }

  /**
   * Gera fingerprint super detalhado do browser/device
   */
  async generateAdvancedFingerprint() {
    const fp = []

    // 1. Canvas Fingerprinting
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('BurgzID🔍', 2, 2)
    fp.push('canvas:' + canvas.toDataURL())

    // 2. WebGL Fingerprinting
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          fp.push('webgl_vendor:' + gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
          fp.push('webgl_renderer:' + gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
        }
      }
    } catch (e) {
      fp.push('webgl:unavailable')
    }

    // 3. Audio Fingerprinting
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const analyser = audioCtx.createAnalyser()
      const gainNode = audioCtx.createGain()
      
      oscillator.type = 'triangle'
      oscillator.frequency.value = 10000
      
      gainNode.gain.value = 0
      oscillator.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      oscillator.start()
      
      const freqData = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(freqData)
      
      fp.push('audio:' + freqData.slice(0, 30).join(','))
      
      oscillator.stop()
      audioCtx.close()
    } catch (e) {
      fp.push('audio:unavailable')
    }

    // 4. Hardware/System Info
    fp.push('cores:' + (navigator.hardwareConcurrency || 'unknown'))
    fp.push('memory:' + (navigator.deviceMemory || 'unknown'))
    fp.push('platform:' + navigator.platform)
    fp.push('language:' + navigator.language)
    fp.push('languages:' + navigator.languages?.join(',') || 'unknown')

    // 5. Screen & Display
    fp.push('screen:' + screen.width + 'x' + screen.height + 'x' + screen.colorDepth)
    fp.push('available:' + screen.availWidth + 'x' + screen.availHeight)
    fp.push('pixelRatio:' + (window.devicePixelRatio || 1))

    // 6. Browser Features
    fp.push('webdriver:' + (navigator.webdriver || false))
    fp.push('cookieEnabled:' + navigator.cookieEnabled)
    fp.push('doNotTrack:' + (navigator.doNotTrack || 'unspecified'))
    fp.push('maxTouchPoints:' + (navigator.maxTouchPoints || 0))

    // 7. Timezone & Locale
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions()
      fp.push('timezone:' + tz.timeZone)
      fp.push('locale:' + tz.locale)
    } catch (e) {
      fp.push('timezone:unknown')
    }

    // 8. Permissions
    try {
      const permissions = ['camera', 'microphone', 'geolocation', 'notifications']
      for (const permission of permissions) {
        try {
          const result = await navigator.permissions.query({ name: permission })
          fp.push(`perm_${permission}:${result.state}`)
        } catch (e) {
          fp.push(`perm_${permission}:unavailable`)
        }
      }
    } catch (e) {
      fp.push('permissions:unavailable')
    }

    // 9. Installed Plugins
    if (navigator.plugins) {
      const plugins = Array.from(navigator.plugins)
        .map(p => p.name)
        .sort()
        .slice(0, 10) // Limit to avoid too large fingerprint
      fp.push('plugins:' + plugins.join(','))
    }

    // 10. Battery (if available)
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery()
        fp.push('battery:' + battery.level + '_' + battery.charging)
      }
    } catch (e) {
      fp.push('battery:unavailable')
    }

    // Gera hash final
    const fingerprintString = fp.join('|')
    return this.hashString(fingerprintString)
  }

  /**
   * Hash string para criar ID único
   */
  hashString(str) {
    let hash = 0
    if (str.length === 0) return hash.toString(36)
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return 'burgz_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36)
  }

  /**
   * Detecta informações do dispositivo
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent
    const info = {
      userAgent,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      javaEnabled: false
    }

    // Tenta detectar Java
    try {
      info.javaEnabled = navigator.javaEnabled()
    } catch (e) {
      info.javaEnabled = false
    }

    // Detecta tipo de dispositivo
    if (/Mobile|Android|iPhone/.test(userAgent)) {
      info.deviceType = 'mobile'
      info.isMobile = true
    } else if (/iPad|Tablet/.test(userAgent)) {
      info.deviceType = 'tablet'
      info.isTablet = true
    } else {
      info.deviceType = 'desktop'
      info.isDesktop = true
    }

    // Detecta SE É BOT/CRAWLER
    const botPatterns = [
      'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 
      'Baiduspider', 'YandexBot', 'facebookexternalhit',
      'Twitterbot', 'LinkedInBot', 'WhatsApp', 'bot',
      'crawl', 'spider', 'scrape'
    ]
    
    info.isBot = botPatterns.some(pattern => 
      userAgent.toLowerCase().includes(pattern.toLowerCase())
    )

    // Detecta webdriver (automation)
    info.isAutomated = !!(navigator.webdriver || window.chrome?.runtime?.onConnect)

    return info
  }

  /**
   * Detecta comportamentos suspeitos
   */
  detectSuspiciousBehavior() {
    const flags = {
      score: 0,
      reasons: []
    }

    // 1. Velocidade de cliques muito alta
    this.clickTimes = this.clickTimes || []
    if (this.clickTimes.length > 10) {
      const avgInterval = this.clickTimes.slice(-5).reduce((a, b, i, arr) => 
        i > 0 ? a + (b - arr[i - 1]) : 0, 0
      ) / 4
      
      if (avgInterval < 100) { // Menos de 100ms entre cliques
        flags.score += 30
        flags.reasons.push('Clicks muito rápidos')
      }
    }

    // 2. Movimento de mouse linear/robótico
    if (this.mouseMovements?.length > 50) {
      const movements = this.mouseMovements.slice(-20)
      let linearCount = 0
      
      for (let i = 2; i < movements.length; i++) {
        const [x1, y1] = movements[i-2]
        const [x2, y2] = movements[i-1]  
        const [x3, y3] = movements[i]
        
        // Verifica se movimento é muito linear
        const slope1 = (y2 - y1) / (x2 - x1)
        const slope2 = (y3 - y2) / (x3 - x2)
        
        if (Math.abs(slope1 - slope2) < 0.1) {
          linearCount++
        }
      }
      
      if (linearCount > 10) {
        flags.score += 25
        flags.reasons.push('Movimento de mouse robótico')
      }
    }

    // 3. Não scroll natural
    if (this.scrollEvents?.length > 20) {
      const scrolls = this.scrollEvents.slice(-10)
      const intervals = scrolls.map((_, i) => 
        i > 0 ? scrolls[i] - scrolls[i-1] : 0
      ).slice(1)
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
      
      if (avgInterval < 50 || intervals.every(i => i === intervals[0])) {
        flags.score += 20
        flags.reasons.push('Scroll não-humano')
      }
    }

    // 4. Headers suspeitos
    if (navigator.webdriver) {
      flags.score += 50
      flags.reasons.push('WebDriver detectado')
    }

    if (window.chrome?.runtime?.onConnect) {
      flags.score += 30
      flags.reasons.push('Extensão de automação')
    }

    // 5. Muitas abas abertas simultaneamente
    if (document.visibilityState === 'hidden' && this.hiddenTime > 10000) {
      flags.score += 15
      flags.reasons.push('Aba escondida por muito tempo')
    }

    return flags
  }

  /**
   * Setup tracking de comportamento
   */
  setupBehaviorTracking() {
    // Track clicks
    document.addEventListener('click', () => {
      this.clickTimes = this.clickTimes || []
      this.clickTimes.push(Date.now())
      if (this.clickTimes.length > 20) this.clickTimes.shift()
    })

    // Track mouse movements
    document.addEventListener('mousemove', (e) => {
      this.mouseMovements = this.mouseMovements || []
      this.mouseMovements.push([e.clientX, e.clientY])
      if (this.mouseMovements.length > 100) this.mouseMovements.shift()
    })

    // Track scrolling
    document.addEventListener('scroll', () => {
      this.scrollEvents = this.scrollEvents || []
      this.scrollEvents.push(Date.now())
      if (this.scrollEvents.length > 30) this.scrollEvents.shift()
    })

    // Track visibility
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.hiddenStartTime = Date.now()
      } else {
        if (this.hiddenStartTime) {
          this.hiddenTime = Date.now() - this.hiddenStartTime
        }
      }
    })
  }

  /**
   * Detecta múltiplas abas/janelas
   */
  detectMultipleTabs() {
    const storageKey = 'burgzActiveTab'
    const tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    
    // Registra esta aba
    const activeTabs = JSON.parse(localStorage.getItem(storageKey) || '[]')
    activeTabs.push({
      tabId,
      timestamp: Date.now(),
      url: window.location.href
    })
    
    // Remove abas antigas (mais de 1 minuto)
    const validTabs = activeTabs.filter(tab => 
      Date.now() - tab.timestamp < 60000
    )
    
    localStorage.setItem(storageKey, JSON.stringify(validTabs))
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      const tabs = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const filtered = tabs.filter(tab => tab.tabId !== tabId)
      localStorage.setItem(storageKey, JSON.stringify(filtered))
    })

    return {
      currentTabId: tabId,
      totalTabs: validTabs.length,
      isMultipleTabsOpen: validTabs.length > 1
    }
  }

  /**
   * Analisa padrões de visitação
   */
  analyzeVisitPatterns() {
    const visits = JSON.parse(localStorage.getItem('burgzVisitHistory') || '[]')
    
    // Adiciona visita atual
    const currentVisit = {
      timestamp: Date.now(),
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent
    }
    
    visits.push(currentVisit)
    
    // Mantém últimas 50 visitas
    if (visits.length > 50) {
      visits.splice(0, visits.length - 50)
    }
    
    localStorage.setItem('burgzVisitHistory', JSON.stringify(visits))
    
    // Análise de padrões
    const analysis = {
      totalVisits: visits.length,
      isReturningUser: visits.length > 1,
      avgTimeBetweenVisits: 0,
      frequentPages: {},
      suspiciousPattern: false
    }

    if (visits.length > 1) {
      const intervals = visits.slice(1).map((visit, i) => 
        visit.timestamp - visits[i].timestamp
      )
      
      analysis.avgTimeBetweenVisits = intervals.reduce((a, b) => a + b, 0) / intervals.length
      
      // Padrão suspeito: muitas visitas em pouco tempo
      const recentVisits = visits.filter(v => 
        Date.now() - v.timestamp < 60000 // últimos 60 segundos
      )
      
      if (recentVisits.length > 10) {
        analysis.suspiciousPattern = true
      }
    }

    // Frequência de páginas
    visits.forEach(visit => {
      const page = new URL(visit.url).pathname
      analysis.frequentPages[page] = (analysis.frequentPages[page] || 0) + 1
    })

    return analysis
  }

  /**
   * Identifica usuário com base em múltiplos fatores
   */
  async identifyUser() {
    try {
      // 1. Gera fingerprint avançado
      this.fingerprint = await this.generateAdvancedFingerprint()
      
      // 2. Obtém info do dispositivo
      const deviceInfo = this.getDeviceInfo()
      
      // 3. Setup tracking comportamental
      this.setupBehaviorTracking()
      
      // 4. Detecta múltiplas abas
      const tabInfo = this.detectMultipleTabs()
      
      // 5. Analisa padrões de visita
      const visitPatterns = this.analyzeVisitPatterns()
      
      // 6. Detecta comportamentos suspeitos
      setTimeout(() => {
        const suspiciousFlags = this.detectSuspiciousBehavior()
        
        if (suspiciousFlags.score > 50) {
          console.warn('[UserID] Comportamento suspeito detectado:', suspiciousFlags.reasons)
        }
      }, 5000)

      // 7. Calcula confidence score
      let confidence = 50 // Base confidence
      
      if (deviceInfo.isBot) confidence -= 30
      if (deviceInfo.isAutomated) confidence -= 25
      if (visitPatterns.suspiciousPattern) confidence -= 20
      if (tabInfo.totalTabs > 5) confidence -= 15
      if (visitPatterns.isReturningUser) confidence += 20
      
      this.confidence = Math.max(0, Math.min(100, confidence))

      const userIdentity = {
        fingerprint: this.fingerprint,
        deviceInfo,
        tabInfo,
        visitPatterns,
        confidence: this.confidence,
        timestamp: Date.now()
      }

      console.info('[UserID] Usuário identificado:', {
        fingerprint: this.fingerprint.substring(0, 20) + '...',
        confidence: this.confidence,
        isReturning: visitPatterns.isReturningUser,
        deviceType: deviceInfo.deviceType
      })

      return userIdentity
    } catch (error) {
      console.error('[UserID] Erro na identificação:', error)
      return null
    }
  }

  /**
   * Verifica se usuário já foi visto antes
   */
  checkIfKnownUser() {
    const knownFingerprints = JSON.parse(
      localStorage.getItem('burgzKnownFingerprints') || '[]'
    )
    
    const isKnown = knownFingerprints.includes(this.fingerprint)
    
    if (!isKnown && this.fingerprint) {
      knownFingerprints.push(this.fingerprint)
      // Mantém últimos 100 fingerprints
      if (knownFingerprints.length > 100) {
        knownFingerprints.shift()
      }
      localStorage.setItem('burgzKnownFingerprints', JSON.stringify(knownFingerprints))
    }
    
    return isKnown
  }
}

// Instância global
export const userIdentification = new UserIdentificationService()

export default userIdentification