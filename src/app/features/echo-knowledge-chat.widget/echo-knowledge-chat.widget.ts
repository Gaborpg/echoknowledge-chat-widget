import {
  Component, ViewEncapsulation, ElementRef, Injector, signal, computed,
  effect, input, booleanAttribute, inject, OnInit, DestroyRef
} from '@angular/core';

import { EchoKnowledgeToggleButton } from '../echo-knowledge-toggle-button/echo-knowledge-toggle-button';
import { EchoKnowledgeChat } from '../echo-knowledge-chat/echo-knowledge-chat';
import { ChatMode, ChatPopUp, ChatPopupOptions } from '../../core/services/chat-pop-up';

import { Router } from '@angular/router';
import { fromEvent, of, filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'echo-knowledge-chat-widget',
  imports: [EchoKnowledgeToggleButton, EchoKnowledgeChat],
  templateUrl: './echo-knowledge-chat.widget.html',
  styleUrl: './echo-knowledge-chat.widget.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'echo-chat-host' }
})
export class EchoKnowledgeChatWidget implements OnInit {
  private popup = inject(ChatPopUp);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  // Router is optional so the widget works on non-Angular hosts too
  private readonly router = inject(Router, { optional: true });

  constructor(private host: ElementRef<HTMLElement>) {}

  botId    = input<string>('default', { alias: 'bot-id' });
  mode     = input<ChatMode>('popup');
  side     = input<'left'|'right'|'auto'>('auto');
  top      = input<number, string>(10,  { transform: v => +v });
  right    = input<number, string>(24,  { transform: v => +v });
  width    = input<number | string>('406');
  height   = input<number | string>('90%');
  close    = input<'outside'|'fab-only'|'backdrop'>('outside');
  autoOpen = input<boolean, string>(false, { alias: 'auto-open', transform: booleanAttribute });
  primary  = input<string>('', { alias: 'primary' });
  include  = input<string>(''); // e.g. "/bot, /auth/**"
  exclude  = input<string>(''); // e.g. "/main, /checkout/**"

  // Track current host path (pathname + hash to support hash-based routers)
  private readHostPath(): string {
    const { pathname, hash } = window.location;
    return pathname + (hash || '');
  }

  private currentPath = signal<string>(this.readHostPath());

  ngOnInit() {
    if (this.router) {
      // Angular host: follow Router url + events
      this.currentPath.set(this.router.url);
      this.router.events
        .pipe(
          filter((e: any) => !!(e && (e.urlAfterRedirects ?? e.url))),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((e: any) => this.currentPath.set(e.urlAfterRedirects || e.url));
    } else {
      // Non-Angular host: robust URL tracking (popstate/hash + pushState/replaceState)
      const LCHG = 'echo-locationchange';

      const patchHistory = () => {
        const { pushState, replaceState } = history as any;
        if (!(history as any).__echoPatched) {
          (history as any).pushState = function (...args: any[]) {
            const ret = pushState.apply(this, args);
            window.dispatchEvent(new Event(LCHG));
            return ret;
          };
          (history as any).replaceState = function (...args: any[]) {
            const ret = replaceState.apply(this, args);
            window.dispatchEvent(new Event(LCHG));
            return ret;
          };
          (history as any).__echoPatched = true;
        }
      };

      patchHistory();

      const update = () => this.currentPath.set(this.readHostPath());

      fromEvent(window, 'popstate').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update);
      fromEvent(window, 'hashchange').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update);
      fromEvent(window, LCHG).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update);

      // initial sync (microtask)
      Promise.resolve().then(update);
    }

    // Only auto-open when popup mode and the widget is visible by rules
    const wantsOpen = computed(() => this.autoOpen() && this.mode() === 'popup' && this.visible());

    effect(() => {
      if (this.mode() === 'inline') {
        this.paintInlineTheme(this.primary() ? { primary: this.primary() } : undefined);
      }
      if (wantsOpen()) {
        this.popup.open({
          mode: this.mode(),
          side: this.side(),
          top: this.top(),
          right: this.right(),
          widthDesktop: this.width(),
          heightDesktop: this.height(),
          close: this.close(),
          theme: this.primary() ? { primary: this.primary() } : undefined,
        });
      } else {
        // ensure it’s closed when rules say it's not visible / not auto-open
        this.popup.close();
      }
    }, { injector: this.injector });
  }

  // Visibility rules based on host path (works with or without Router)
  visible = computed(() => {
    const path = this.currentPath();
    const inc = this.toRegexList(this.include());
    const exc = this.toRegexList(this.exclude());
    const inInclude = inc.length === 0 || inc.some(r => r.test(path));
    const inExclude = exc.some(r => r.test(path));
    return inInclude && !inExclude;
  });

  private toRegexList(list: string): RegExp[] {
    return list
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(glob => this.globToRegExp(glob));
  }

  private globToRegExp(glob: string): RegExp {
    // supports ** (any depth) and * (single segment)
    const esc = glob
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')   // escape regex chars
      .replace(/\/\*\*\//g, '/(?:.*\\/)?')     // /**/ -> any depth
      .replace(/\*\*/g, '.*')                  // ** -> any
      .replace(/\*/g, '[^/]*');                // * -> no slash
    return new RegExp('^' + esc + '$');
  }

  // Optional JS API for hosts:
  open()   { this.popup.open({ mode: this.mode(), top: this.top(), right: this.right(), close: this.close() }); }
  closeW() { this.popup.close(); }
  toggle() { this.popup.toggle({ mode: this.mode(), top: this.top(), right: this.right(), close: this.close() }); }

  private applyThemeToPane(theme: ChatPopupOptions['theme'] | undefined) {
    if (!theme?.primary) return;
    const pane = this.host.nativeElement;
    pane.style.setProperty('--echo-primary-color', theme.primary);
  }

  private paintInlineTheme(theme?: { primary: string }) {
    if (!theme?.primary) return;
    const root = this.host.nativeElement.querySelector('.echo-chat-scope') as HTMLElement | null;
    if (root) root.style.setProperty('--echo-primary-color', theme.primary);
    else this.host.nativeElement.style.setProperty('--echo-primary-color', theme.primary);
  }
}
