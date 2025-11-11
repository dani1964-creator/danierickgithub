import { logger } from '@/lib/logger';

/**
 * Sistema de analytics e monitoramento profissional
 */

type EventCategory = 'page_view' | 'user_action' | 'error' | 'performance' | 'engagement';

type EventData = {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
};

/**
 * Classe principal de Analytics
 */
class Analytics {
  private sessionId: string;
  private userId: string | null = null;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Rastreia evento customizado
   */
  track(data: EventData) {
    const event = {
      ...data,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    };

    // Log local
    logger.info('Analytics Event:', event);

    // Em produção, enviar para serviço de analytics (Google Analytics, Mixpanel, etc)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalyticsService(event);
    }
  }

  /**
   * Rastreia visualização de página
   */
  trackPageView(pageName: string, metadata?: Record<string, any>) {
    this.track({
      category: 'page_view',
      action: 'view',
      label: pageName,
      metadata,
    });
  }

  /**
   * Rastreia ação do usuário
   */
  trackAction(action: string, label?: string, metadata?: Record<string, any>) {
    this.track({
      category: 'user_action',
      action,
      label,
      metadata,
    });
  }

  /**
   * Rastreia erro
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track({
      category: 'error',
      action: 'error_occurred',
      label: error.message,
      metadata: {
        stack: error.stack,
        name: error.name,
        ...context,
      },
    });
  }

  /**
   * Rastreia métrica de performance
   */
  trackPerformance(metric: string, value: number, metadata?: Record<string, any>) {
    this.track({
      category: 'performance',
      action: metric,
      value,
      metadata,
    });
  }

  /**
   * Rastreia engajamento
   */
  trackEngagement(action: string, label?: string, value?: number) {
    this.track({
      category: 'engagement',
      action,
      label,
      value,
    });
  }

  /**
   * Define ID do usuário
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Inicializa monitoramento de performance
   */
  private initPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitorar Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('lcp', lastEntry.startTime, {
          element: (lastEntry as any).element?.tagName,
        });
      });

      try {
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // Navegador não suporta
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.trackPerformance('fid', entry.processingStart - entry.startTime, {
            eventType: entry.name,
          });
        });
      });

      try {
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        // Navegador não suporta
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.trackPerformance('cls', clsValue);
          }
        }
      });

      try {
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        // Navegador não suporta
      }
    }

    // Monitorar tempo de carregamento da página
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      this.trackPerformance('page_load_time', pageLoadTime);

      const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
      this.trackPerformance('dns_lookup_time', dnsTime);

      const tcpTime = perfData.connectEnd - perfData.connectStart;
      this.trackPerformance('tcp_connection_time', tcpTime);

      const ttfb = perfData.responseStart - perfData.navigationStart;
      this.trackPerformance('time_to_first_byte', ttfb);
    });
  }

  /**
   * Envia evento para serviço de analytics (implementar integração)
   */
  private sendToAnalyticsService(event: any) {
    // TODO: Implementar integração com Google Analytics 4, Mixpanel, etc
    // Exemplo para GA4:
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', event.action, {
    //     event_category: event.category,
    //     event_label: event.label,
    //     value: event.value,
    //     ...event.metadata,
    //   });
    // }

    // Exemplo para enviar para endpoint customizado:
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // }).catch(() => {}); // Falha silenciosa
  }

  /**
   * Rastreia tempo na página
   */
  trackTimeOnPage() {
    const timeSpent = Date.now() - this.startTime;
    this.trackEngagement('time_on_page', window.location.pathname, timeSpent);
  }
}

// Instância singleton
export const analytics = new Analytics();

/**
 * Hooks de analytics específicos
 */

// Rastreia visualizações de propriedade
export function trackPropertyView(propertyId: string, propertyTitle: string, brokerSlug: string) {
  analytics.track({
    category: 'engagement',
    action: 'property_view',
    label: propertyTitle,
    metadata: {
      propertyId,
      brokerSlug,
    },
  });
}

// Rastreia cliques no botão de contato
export function trackContactClick(propertyId: string, contactMethod: 'whatsapp' | 'phone' | 'email' | 'form') {
  analytics.track({
    category: 'engagement',
    action: 'contact_click',
    label: contactMethod,
    metadata: {
      propertyId,
    },
  });
}

// Rastreia compartilhamentos
export function trackShare(propertyId: string, method: 'copy' | 'whatsapp' | 'email' | 'native') {
  analytics.track({
    category: 'engagement',
    action: 'share',
    label: method,
    metadata: {
      propertyId,
    },
  });
}

// Rastreia adição aos favoritos
export function trackFavorite(propertyId: string, action: 'add' | 'remove') {
  analytics.track({
    category: 'engagement',
    action: `favorite_${action}`,
    metadata: {
      propertyId,
    },
  });
}

// Rastreia erros de carregamento de imagem
export function trackImageError(propertyId: string, imageUrl: string, attemptNumber: number) {
  analytics.track({
    category: 'error',
    action: 'image_load_error',
    label: imageUrl,
    value: attemptNumber,
    metadata: {
      propertyId,
    },
  });
}

// Rastreia envio de lead
export function trackLeadSubmission(propertyId: string, leadType: 'contact' | 'tour' | 'info') {
  analytics.track({
    category: 'engagement',
    action: 'lead_submission',
    label: leadType,
    metadata: {
      propertyId,
    },
  });
}

// Rastreia navegação
export function trackNavigation(from: string, to: string) {
  analytics.track({
    category: 'user_action',
    action: 'navigation',
    label: `${from} -> ${to}`,
  });
}

// Rastreia scroll depth
export function trackScrollDepth(depth: number) {
  analytics.track({
    category: 'engagement',
    action: 'scroll_depth',
    value: depth,
  });
}

export default analytics;
