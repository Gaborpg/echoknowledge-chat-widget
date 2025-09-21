import {
  AfterViewChecked,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
  signal, HostListener, ViewEncapsulation, HostBinding
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { EchoKnowledgeInput } from '../echo-knowledge-input/echo-knowledge-input';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { EchoKnowledgeTableDialog } from '../echo-knowledge-table-dialog/echo-knowledge-table-dialog';
import { MatDialog } from '@angular/material/dialog';
import { ChatMsg, EchoChatStore } from '../../core/services/echo-chat-store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type UiMsg = { role: 'bot' | 'admin' | 'user'; text: string | SafeHtml; timestamp: Date };

@Component({
  selector: 'echo-knowledge-chat',
  imports: [CommonModule, FormsModule, EchoKnowledgeInput, OverlayModule, PortalModule],
  templateUrl: './echo-knowledge-chat.html',
  styleUrl: './echo-knowledge-chat.scss'
})
export class EchoKnowledgeChat implements AfterViewChecked, OnInit {
  @Input() botId = 'default';
  @Input() inline = false;

  @HostBinding('class.echo-chat-scope')
  get addScopeClass(): boolean {
    return this.inline;
  }

  public userInput = '';
  public suggestions: string[] = ['Echo name test long whatever'];
  public suggestions2: string[] = [
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever',
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever',
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever',
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever',
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever',
    'Test', 'Test', 'Test', 'Test', 'Echo name test long whatever'
  ];
  private destroyRef = inject(DestroyRef);

  @ViewChild('messagesRef') private messagesContainer!: ElementRef<HTMLDivElement>;
  @HostListener('click', ['$event'])
  onContainerClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    const btn = target.closest('.table-feedback-bar .icon-btn[data-action="zoom"]') as HTMLElement | null;
    if (!btn) return;

    const wrapper = btn.closest('.table-response-wrapper');
    const table = wrapper?.querySelector('table');
    if (!table) return;

    const html = this.sanitizer.bypassSecurityTrustHtml(
      `<div class="table-response-wrapper">${table.outerHTML}</div>`
    );

    this.dialog.open(EchoKnowledgeTableDialog, {
      data: { html },
      width: '80vw',
      maxWidth: '80vw',
      autoFocus: false,
      panelClass: 'fullscreen-table-dialog'
    });
  }
  private store = inject(EchoChatStore);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  // fallback typing signal if store doesn’t provide setTyping
  private _typing = signal(false);

  private readonly adapted = computed<UiMsg[]>(() =>
    this.store.messages().map<UiMsg>((m: ChatMsg) => ({
      role: m.role,
      text: m.text,
      timestamp: new Date((m as any).at ?? Date.now())
    }))
  );

  get messages(): UiMsg[] { return this.adapted(); }
  get typing(): boolean {
    const t = (this.store as any)?.typing;
    return typeof t === 'function' ? t() : this._typing();
  }

  private lastMessageCount = 0;

  constructor() {
    marked.setOptions({ gfm: true, breaks: true });
  }

  ngOnInit() {
    this.store.load$(this.botId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  ngAfterViewChecked() {
    const count = this.messages.length;
    if (this.lastMessageCount !== count) {
      this.scrollToBottomSmooth();
      this.lastMessageCount = count;
    }
  }

  public sendMessage() {
    const input = this.userInput.trim();
    if (!input) return;

    this.userInput = '';

    this.store.send$(this.botId, input)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.setTyping(false)
      });

    // turn typing ON
    this.setTyping(true);

    setTimeout(async () => {
      const raw1 = `Absolutely! Here’s a quick comparison table of Chatbase’s main plans and their prices:\\n\\n| Plan      | Price (Monthly) | Price (Yearly) | Message Credits/Month | AI Agents | Team Members | API Access | AI Actions/Agent | Characters/Agent | Remove Branding |\\n|-----------|-----------------|---------------|----------------------|-----------|--------------|------------|------------------|------------------|-----------------|\\n| Free      | $0              | $0            | 100                  | 1         | 0            | No         | 0                | 400,000          | No              |\\n| Hobby     | $40             | $384          | 2,000                | 1         | 1            | Yes        | 5                | 33,000,000       | No              |\\n| Standard  | $150            | $1,440        | 12,000               | 2         | 2            | Yes        | 10               | 33,000,000       | No              |\\n| Pro       | $500            | $4,800        | 40,000               | 3         | 5*           | Yes        | 15               | 33,000,000       | Yes             |\\n\\n\\\\*Extra team members on Pro are $25 each per month.\\n\\nLet me know if you’d like more details about any plan or features!`;
      const raw2 = `Yes, you can change the settings for a bot in Chatbase! To do this, just follow these steps:\\n\\n1. Go to your Chatbase dashboard.\\n2. Select the bot you want to update.\\n3. Click on the Settings tab at the top of the page.\\n\\nFrom there, you can adjust various settings such as:\\n- Chat interface customization (appearance, colors, display name, chat bubble icon, etc.)\\n- AI model selection and response creativity\\n- Suggested messages and initial messages\\n- Team member permissions\\n- Data sources and training data\\n\\nIf you need help with a specific setting or want to know more about what you can customize, just let me know!`;
      const raw3 = `Chatbase offers four main subscription plans:\\n\\n1. Free Plan\\n- $0/month\\n- 100 message credits/month\\n- 1 AI agent\\n- 400,000 characters/agent\\n- Embed on unlimited websites\\n- No API access\\n\\n2. Hobby Plan\\n- $40/month or $384/year\\n- 2,000 message credits/month\\n- 1 AI agent\\n- 1 team member\\n- 5 AI Actions per agent\\n- 33,000,000 characters/agent\\n- Embed on unlimited websites\\n- API access\\n\\n3. Standard Plan\\n- $150/month or $1,440/year\\n- 12,000 message credits/month\\n- 2 AI agents\\n- 2 team members\\n- 10 AI Actions per agent\\n- 33,000,000 characters/agent\\n- Embed on unlimited websites\\n- API access\\n- Option to choose GPT-4 and GPT-4-Turbo\\n\\n4. Pro Plan\\n- $500/month or $4,800/year\\n- 40,000 message credits/month\\n- 3 AI agents\\n- 5 team members ($25 for each extra member)\\n- 15 AI Actions per agent\\n- 33,000,000 characters/agent\\n- Embed on unlimited websites\\n- API access\\n- Option to choose GPT-4 and GPT-4-Turbo\\n- Remove \\"Powered by Chatbase\\" branding\\n\\nIf you need more than 100 agents, you can reach out to support@chatbase.co for enterprise options.\\n\\nLet me know if you want details on any specific plan!`;
      const responses = [raw1, raw2, raw3];
      await this.animateBotMessage(responses[Math.floor(Math.random() * responses.length)]);
    }, 1200);
  }

  private async animateBotMessage(markdown: string): Promise<void> {
    // declare first so we can use later in both try and setTimeout
    let tableMatch: RegExpMatchArray | null = null;

    try {
      const normalizedMarkdown = markdown
        .replace(/\\n/g, '\n')
        .replace(/\\\*/g, '*')
        .replace(/\\"/g, '"');

      const fullHtml = await marked.parse(normalizedMarkdown);
      tableMatch = fullHtml.match(/<table[\s\S]*?<\/table>/);

      let enhancedHtml = fullHtml;
      if (tableMatch) {
        const wrappedTable = `
        <div class="table-response-wrapper">
          ${tableMatch[0]}
          <div class="table-feedback-bar">
            <button class="icon-btn" data-action="zoom">🔍</button>
          </div>
        </div>`;
        enhancedHtml = fullHtml.replace(tableMatch[0], wrappedTable);
      }

      const safeHtml = this.sanitizer.bypassSecurityTrustHtml(enhancedHtml);
      this.store.add('bot', safeHtml as SafeHtml);
    } finally {
      this.setTyping(false);
    }

    // tableMatch is still visible here ✅
  }
  private setTyping(value: boolean) {
    const t = (this.store as any)?.typing;
    if (t && typeof t.set === 'function') {
      t.set(value);            // <-- ensure we actually flip the store signal
    } else if (typeof (this.store as any)?.setTyping === 'function') {
      (this.store as any).setTyping(value);
    } else {
      this._typing.set(value); // fallback
    }
  }
  private scrollToBottomSmooth() {
    try {
      this.messagesContainer.nativeElement.scrollTo({
        top: this.messagesContainer.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch {}
  }

  onSuggestionClick(suggestion: string) {
    this.userInput = suggestion;
    this.sendMessage();
  }
}
