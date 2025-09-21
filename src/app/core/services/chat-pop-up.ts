import { Injectable, Injector, signal } from '@angular/core';
import {
  Overlay, OverlayRef, OverlayConfig,
  ConnectedPosition
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { EchoKnowledgeChat } from '../../features/echo-knowledge-chat/echo-knowledge-chat';

export type ChatSide = 'left' | 'right' | 'auto';
export type ChatMode = 'popup' | 'inline' | 'global';
export type ChatClose = 'outside' | 'fab-only' | 'backdrop';

export interface ChatPopupOptions {
  origin?: HTMLElement;
  side?: ChatSide;
  offset?: number;

  mode?: ChatMode;
  top?: number;
  right?: number;
  widthDesktop?: number | string;   // can be number/px/%/vh
  heightDesktop?: number | string;  // can be number/px/%/vh
  close?: ChatClose;

  // NEW: theme vars to apply on the overlay pane
  theme?: { primary?: string };
}

@Injectable({ providedIn: 'root' })
export class ChatPopUp {
  private overlayRef?: OverlayRef;
  private outsideSub?: Subscription;
  private currentOrigin?: HTMLElement;

  private _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  constructor(private overlay: Overlay, private injector: Injector) {}

  // ---------- helpers ----------
  private toPx(v: number | string | undefined, fallbackPx: number): string {
    if (v == null) return `${fallbackPx}px`;
    if (typeof v === 'number') return `${v}px`;
    const s = String(v).trim();
    if (/^\d+$/.test(s)) return `${s}px`; // "406" -> "406px"
    return s; // already has unit
  }
  private normalizeHeight(v: number | string | undefined, fallbackVh = 90): string {
    if (v == null) return `${fallbackVh}%`;
    if (typeof v === 'number') return `${v}px`;
    const s = String(v).trim();
    if (/^\d+$/.test(s)) return `${s}px`;      // plain number -> px
    if (s.endsWith('vh'))   return s.replace('vh', '%'); // 90% -> 90vh (desktop)
    return s; // px/vh/dvh/etc
  }
  private hexToRgbTriplet(hex: string) {
    const s = String(hex).trim();

    // 1) Hex (#rgb or #rrggbb)
    if (s.startsWith('#')) {
      const m = s.slice(1);
      const n = m.length === 3 ? m.split('').map(ch => ch + ch).join('') : m;
      const r = parseInt(n.slice(0, 2), 16);
      const g = parseInt(n.slice(2, 4), 16);
      const b = parseInt(n.slice(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }

    // 2) rgb/rgba(...)
    const mRgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,[^\)]*)?\)/i);
    if (mRgb) {
      const r = Math.round(+mRgb[1]);
      const g = Math.round(+mRgb[2]);
      const b = Math.round(+mRgb[3]);
      return `${r}, ${g}, ${b}`;
    }

    // 3) hsl()/named colors/etc. – let the browser resolve to rgb(...)
    if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.style.color = s;
      document.body.appendChild(el);
      const cs = getComputedStyle(el).color; // "rgb(r, g, b)" or "rgba(...)"
      document.body.removeChild(el);
      const m = cs.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (m) return `${m[1]}, ${m[2]}, ${m[3]}`;
    }

    // Fallback (avoid NaN)
    return `0, 0, 0`;
  }
  private applyThemeToPane(theme: ChatPopupOptions['theme'] | undefined) {
    if (!this.overlayRef || !theme?.primary) return;
    const pane = this.overlayRef.overlayElement;
    pane.style.setProperty('--echo-primary-color', theme.primary);
    pane.style.setProperty('--echo-primary-color-rgb', this.hexToRgbTriplet(theme.primary));
  }

  open(opts: ChatPopupOptions = {}) {
    const {
      origin,
      side = 'auto',
      offset = 12,
      mode = 'popup',
      top = 10,
      right = 24,
      widthDesktop = '406px',
      heightDesktop = '90%',
      close = 'outside',
      theme
    } = opts;

    this.currentOrigin = origin ?? this.currentOrigin;

    const isMobile = this.isMobile();
    const useBackdrop = close !== 'fab-only';

    // Normalize sizes (avoid invalid widths & accidental 100%)
    const width  = isMobile ? '100vw'  : this.toPx(widthDesktop, 406);
    const height = isMobile ? '100dvh' : this.normalizeHeight(heightDesktop, 90);

    // Position strategy
    const positionStrategy =
      this.currentOrigin && mode !== 'global'
        ? this.buildConnected(this.currentOrigin, side, offset)
        : (mode === 'global'
            ? this.buildGlobal() // explicit handling of 'global'
            : this.overlay.position().global().top(`${top}px`).right(`${right}px`)
        );

    const config: OverlayConfig = {
      hasBackdrop: useBackdrop,
      backdropClass: close === 'outside' ? 'cdk-overlay-transparent-backdrop' : '',
      disposeOnNavigation: true,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: ['chat-overlay-panel', 'echo-chat-scope'],
      width,
      height,
      positionStrategy,
    };

    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create(config);
      // Apply theme directly on the pane so the chat sees CSS vars
      this.applyThemeToPane(theme);

      this.overlayRef.attach(new ComponentPortal(EchoKnowledgeChat, null, this.injector));

      // Escape key closes
      this.overlayRef.keydownEvents().subscribe(e => { if (e.key === 'Escape') this.close(); });

      // Backdrop close (if enabled)
      if (useBackdrop) this.overlayRef.backdropClick().subscribe(() => this.close());
    } else {
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize({ width, height });

      // update theme on subsequent open calls too
      this.applyThemeToPane(theme);

      // toggle backdrop if needed (CDK doesn't expose a setter; this keeps your approach)
      (this.overlayRef as any)._config.hasBackdrop = useBackdrop;

      if (!this.overlayRef.hasAttached()) {
        this.overlayRef.attach(new ComponentPortal(EchoKnowledgeChat, null, this.injector));
      }
    }

    this.overlayRef.updatePosition();
    this.setupOutsideClose(useBackdrop);
    this._isOpen.set(true);
  }

  toggle(opts?: ChatPopupOptions) {
    this._isOpen() ? this.close() : this.open(opts);
  }

  close() {
    this.outsideSub?.unsubscribe();
    this.outsideSub = undefined;
    this.overlayRef?.detach();
    this._isOpen.set(false);
  }

  dispose() {
    this.outsideSub?.unsubscribe();
    this.outsideSub = undefined;
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this._isOpen.set(false);
  }

  // Mobile = narrow screens
  private isMobile() {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches;
  }

  // Global mode: keep it anchored top-right (desktop), full-screen on mobile
  private buildGlobal() {
    const pos = this.overlay.position().global();
    return this.isMobile()
      ? pos.top('0').right('0')
      : pos.top('10px').right('24px');
  }

  /** Open ABOVE the FAB with a clean vertical gap; fallback below if no space. */
  private buildConnected(origin: HTMLElement, side: ChatSide, offset: number) {
    const chosen: 'left' | 'right' = side === 'auto' ? this.pickSide(origin) : side;

    const right: ConnectedPosition[] = [
      // ABOVE, right-aligned
      { originX: 'end', originY: 'top',    overlayX: 'end', overlayY: 'bottom', offsetX: 0, offsetY: -offset },
      // BELOW fallback
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top',    offsetX: 0, offsetY:  offset },
    ];

    const left: ConnectedPosition[] = [
      // ABOVE, left-aligned
      { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom', offsetX: 0, offsetY: -offset },
      // BELOW fallback
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top',    offsetX: 0, offsetY:  offset },
    ];

    return this.overlay.position()
      .flexibleConnectedTo(origin)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8)
      .withPositions(chosen === 'right' ? right : left);
  }

  private pickSide(origin: HTMLElement): 'left' | 'right' {
    const r = origin.getBoundingClientRect();
    const vw = window.innerWidth;
    return (vw - r.right) >= r.left ? 'right' : 'left';
  }

  private setupOutsideClose(useBackdrop: boolean) {
    this.outsideSub?.unsubscribe();
    this.outsideSub = undefined;
    if (useBackdrop || !this.overlayRef) return;

    const overlayEl = this.overlayRef.overlayElement;
    const originEl = this.currentOrigin;

    // defer subscription until pane exists in the DOM
    setTimeout(() => {
      this.outsideSub = this.overlayRef!.outsidePointerEvents().subscribe(ev => {
        const t = ev.target as Node | null;
        if (!t) return;
        if (overlayEl.contains(t) || (originEl && originEl.contains(t))) return; // ignore inside/FAB
        this.close();
      });
    }, 0);
  }
}
