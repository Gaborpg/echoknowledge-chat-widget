// echo-chat-store.ts
import { Injectable, signal, inject, Inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, finalize, of, tap, delay } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';
import { IdentityService } from './identity';
import { CHAT_USE_MOCK } from '../../app';

export type ChatMsg = {
  id: string;
  role: 'user' | 'bot' | 'admin';
  text: string | SafeHtml;
  at: number; // epoch ms
};

type WsOut =
  | { type: 'msg'; text: string; id?: string }                      // user sends a message
  | { type: 'typing'; isTyping: boolean }                           // user typing signal
  | { type: 'ack'; id: string };                                    // (optional) client ack

type WsIn =
  | { type: 'hello'; sessionId: string; onlineAgents: number }
  | { type: 'history'; items: ChatMsg[] }
  | { type: 'msg'; message: ChatMsg }                               // bot/agent message
  | { type: 'msg-ack'; clientId: string; serverId: string }         // server ack to optimistic
  | { type: 'typing'; who: 'bot' | 'agent'; isTyping: boolean }
  | { type: 'takeover.started'; agent: { id: string; name?: string } }
  | { type: 'takeover.ended' }
  | { type: 'presence'; onlineAgents: number }
  | { type: 'error'; code: string; message?: string };

function guid() {
  return (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

@Injectable({ providedIn: 'root' })
export class EchoChatStore {
  private http = inject(HttpClient);
  private identity = inject(IdentityService);
  private destroyRef = inject(DestroyRef);

  constructor(@Inject(CHAT_USE_MOCK) private mock: boolean) {}

  readonly anonId = this.identity.id;

  // --- state
  messages     = signal<ChatMsg[]>([]);
  draft        = signal('');
  typing       = signal(false);
  typingUsers  = signal<{ bot: boolean; agent: boolean }>({ bot: false, agent: false });
  connected    = signal(false);
  takenOver    = signal(false);
  agent        = signal<{ id: string; name?: string } | null>(null);
  onlineAgents = signal(0);

  // runtime
  private ws?: WebSocket;
  private wsUrl(botId: string) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const q = new URLSearchParams({ botId, anonId: this.anonId }).toString();
    return `${proto}://${location.host}/ws/chat?${q}`;
  }
  private reconnectAttempts = 0;
  private sendQueue: WsOut[] = [];
  private optimisticIds = new Set<string>();
  private currentBotId: string | null = null;

  // --- typing helpers
  setTyping(v: boolean) { this.typing.set(v); this.sendTyping(v); }
  startTyping() { this.setTyping(true); }
  stopTyping()  { this.setTyping(false); }

  // --- load history (HTTP; still useful for SSR or first paint)
  load$(botId: string) {
    if (this.mock) return of(this.messages()).pipe(delay(0));

    const params = new HttpParams().set('botId', botId).set('anonId', this.anonId);
    return this.http.get<ChatMsg[]>('/api/chat/history', { params }).pipe(
      tap(list => this.messages.set(list ?? [])),
      catchError(() => {
        this.messages.set([]);
        return of([] as ChatMsg[]);
      })
    );
  }

  // =========================
  // WebSocket lifecycle
  // =========================
  connectWs(botId: string) {
    if (this.mock) return;
    this.currentBotId = botId;
    // close any previous
    this.disconnectWs();

    const url = this.wsUrl(botId);
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this.connected.set(true);
      this.reconnectAttempts = 0;
      // flush queue
      this.flushQueue();
    };

    ws.onmessage = (ev) => {
      let msg: WsIn | undefined;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (!msg) return;

      switch (msg.type) {
        case 'hello':
          this.onlineAgents.set(msg.onlineAgents ?? 0);
          break;

        case 'history':
          // replace entire history
          this.messages.set(msg.items ?? []);
          break;

        case 'msg':
          this.messages.update(m => [...m, msg!.message]);
          break;

        case 'msg-ack':
          // server acknowledged our optimistic id; nothing to do unless you want to replace id
          this.optimisticIds.delete(msg.clientId);
          break;

        case 'typing':
          if (msg.who === 'bot')   this.typingUsers.update(t => ({ ...t, bot:   msg.isTyping }));
          if (msg.who === 'agent') this.typingUsers.update(t => ({ ...t, agent: msg.isTyping }));
          break;

        case 'takeover.started':
          this.takenOver.set(true);
          this.agent.set(msg.agent);
          // optional system line
          this.messages.update(m => [
            ...m,
            { id: guid(), role: 'admin', text: `👤 ${msg.agent.name ?? 'Agent'} joined the chat`, at: Date.now() }
          ]);
          break;

        case 'takeover.ended':
          this.takenOver.set(false);
          const left = this.agent();
          this.agent.set(null);
          this.messages.update(m => [
            ...m,
            { id: guid(), role: 'admin', text: `👋 ${left?.name ?? 'Agent'} left the chat`, at: Date.now() }
          ]);
          // clear agent typing state
          this.typingUsers.update(t => ({ ...t, agent: false }));
          break;

        case 'presence':
          this.onlineAgents.set(msg.onlineAgents ?? 0);
          break;

        case 'error':
          this.messages.update(m => [
            ...m,
            { id: guid(), role: 'admin', text: `⚠️ ${msg.code}: ${msg.message ?? ''}`, at: Date.now() }
          ]);
          break;
      }
    };

    ws.onclose = () => {
      this.connected.set(false);
      // clear live typing indicators
      this.typingUsers.set({ bot: false, agent: false });

      // schedule reconnect (unless component destroyed)
      if (this.currentBotId) this.scheduleReconnect();
    };

    ws.onerror = () => {
      // errors are followed by close; we keep logic in onclose
    };

    // auto-cleanup with Angular destroy
    this.destroyRef.onDestroy(() => this.disconnectWs());
  }

  disconnectWs() {
    if (this.ws) {
      try { this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null as any; } catch {}
      try { this.ws.close(); } catch {}
    }
    this.ws = undefined;
    this.connected.set(false);
  }

  private scheduleReconnect() {
    // capped exponential backoff with jitter
    const attempt = Math.min(this.reconnectAttempts++, 6);
    const base = Math.pow(2, attempt) * 500; // 0.5s, 1s, 2s, 4s, 8s, 16s, 32s
    const jitter = Math.random() * 250;
    const timeout = base + jitter;
    const botId = this.currentBotId!;
    setTimeout(() => {
      if (this.currentBotId === botId) this.connectWs(botId);
    }, timeout);
  }

  private sendWs(payload: WsOut) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.sendQueue.push(payload);
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }

  private flushQueue() {
    const batch = this.sendQueue.splice(0);
    for (const p of batch) this.sendWs(p);
  }

  private sendTyping(isTyping: boolean) {
    // don't spam; only via WS
    if (!this.ws) return;
    this.sendWs({ type: 'typing', isTyping });
  }

  // =========================
  // Messaging
  // =========================

  /**
   * Sends a user message.
   * - If WS connected: optimistic append and send over WS.
   * - Else: falls back to HTTP POST /api/chat/send (your original flow).
   */
  send$(botId: string, text: string) {
    const tempId = guid();
    const optimistic: ChatMsg = { id: tempId, role: 'user', text, at: Date.now() };
    this.messages.update(m => [...m, optimistic]);
    this.startTyping(); // local UI typing (you may prefer to setTyping(false) immediately)

    if (this.mock) return of(null).pipe(delay(0));

    if (this.connected()) {
      this.optimisticIds.add(tempId);
      this.sendWs({ type: 'msg', text, id: tempId });
      // Stop typing immediately for the sender; bot/agent typing will be signaled via WS
      this.stopTyping();
      return of(null); // keep signature; nothing to subscribe to
    }

    // HTTP fallback (original behavior)
    const payload = { botId, anonId: this.anonId, text };
    return this.http.post<ChatMsg>('/api/chat/send', payload).pipe(
      tap(reply => {
        this.messages.update(m => [...m, reply]);
      }),
      catchError(err => {
        this.messages.update(m => m.filter(x => x.id !== tempId));
        return of(err as any);
      }),
      finalize(() => this.stopTyping())
    );
  }

  /**
   * Push a bot/admin message (useful in mock mode).
   */
  mockReply(
    role: Exclude<ChatMsg['role'], 'user'>,
    text: string | SafeHtml,
    options: { stopTyping?: boolean } = { stopTyping: true }
  ) {
    this.messages.update(m => [...m, { id: guid(), role, text, at: Date.now() }]);
    if (options.stopTyping !== false) this.stopTyping();
  }

  add(role: ChatMsg['role'], text: string | SafeHtml) {
    this.messages.update(m => [...m, { id: guid(), role, text, at: Date.now() }]);
  }

  clear() {
    this.messages.set([]);
    this.draft.set('');
    this.stopTyping();
  }
}
