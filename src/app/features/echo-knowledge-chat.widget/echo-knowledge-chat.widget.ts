import {
  afterNextRender, booleanAttribute, Component, effect, ElementRef,
  inject, input, ViewEncapsulation, computed, OnInit, untracked, Injector, signal, DestroyRef
} from '@angular/core';
import {ChatMode, ChatPopUp, ChatPopupOptions} from '../../core/services/chat-pop-up';
import { EchoKnowledgeToggleButton } from '../echo-knowledge-toggle-button/echo-knowledge-toggle-button';
import {EchoKnowledgeChat} from '../echo-knowledge-chat/echo-knowledge-chat';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'echo-knowledge-chat-widget',
  imports: [EchoKnowledgeToggleButton, EchoKnowledgeChat],
  templateUrl: './echo-knowledge-chat.widget.html',
  styleUrl: './echo-knowledge-chat.widget.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'echo-chat-host' } // optional: gives you a stable scope hook
})
export class EchoKnowledgeChatWidget implements OnInit {
  private popup = inject(ChatPopUp);
  private readonly injector = inject(Injector);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

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
  primary = input<string>("", { alias: 'primary' });
  include = input<string>('');     // e.g. "/bot, /auth/**"
  exclude = input<string>('');         // e.g. "/main, /checkout/**"
  private currentPath = signal(this.router.url);

  ngOnInit() {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef))
      .subscribe((e: any) => this.currentPath.set(e.urlAfterRedirects || e.url));

    const wantsOpen = computed(() => this.autoOpen() && this.mode() === 'popup');

    // create effect *now* (inside injection context)
    effect(() => {
      if (this.mode() === 'inline') this.paintInlineTheme(this.primary() ? { primary: this.primary() } : undefined);
      if (wantsOpen()) {
        this.popup.open({
          mode: this.mode(),
          side: this.side(),
          top: this.top(),
          right: this.right(),
          widthDesktop: this.width(),
          heightDesktop: this.height(),
          close: this.close(),
          theme: this.primary() ? { primary: this.primary() } : undefined, // service paints the overlay pane
        });
      }
    }, { injector: this.injector });

  }

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
  open()  { this.popup.open({ mode: this.mode(), top: this.top(), right: this.right(), close: this.close() }); }
  closeW(){ this.popup.close(); }
  toggle(){ this.popup.toggle({ mode: this.mode(), top: this.top(), right: this.right(), close: this.close() }); }

  private applyThemeToPane(theme: ChatPopupOptions['theme'] | undefined) {
    if (!theme?.primary) return;
    const pane = this.host.nativeElement;
    pane.style.setProperty('--echo-primary-color', theme.primary);
  }

  private paintInlineTheme(theme?: { primary: string }) {
    if (!theme?.primary) return;

    // Wait until child DOM exists
      const root = this.host.nativeElement.querySelector('.echo-chat-scope') as HTMLElement | null;
      if (root) {
        root.style.setProperty('--echo-primary-color', theme.primary);
      } else {
        // fallback: host
        this.host.nativeElement.style.setProperty('--echo-primary-color', theme.primary);
      }
  }

}
