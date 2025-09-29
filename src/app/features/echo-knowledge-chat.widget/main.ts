// src/app/features/echo-knowledge-chat.widget/main.ts
import { createApplication } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { CSP_NONCE, importProvidersFrom, Injector } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDialogModule } from '@angular/material/dialog';
import { createCustomElement } from '@angular/elements';
import { EchoKnowledgeChatWidget } from './echo-knowledge-chat.widget';

import { Router, ActivatedRoute } from '@angular/router';  // VALUE import
import { of } from 'rxjs';

function nonce() {
  const s = document.currentScript as HTMLScriptElement | null;
  return s?.nonce || s?.getAttribute?.('nonce') || undefined;
}

(async () => {
  if (customElements.get('echo-knowledge-chat-widget')) return;

  // No-op router so anything that injects Router won't initialize real routing
  const dummyRouter: Partial<Router> = {
    url: '/',
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    events: of(),
    createUrlTree: () => ({} as any),
    serializeUrl: () => '/',
    parseUrl: () => ({} as any),
  };

  const app = await createApplication({
    providers: [
      provideHttpClient(withFetch()),
      importProvidersFrom(OverlayModule, MatDialogModule),
      { provide: CSP_NONCE, useValue: nonce() },

      // ⛔ satisfy anything that injects Router/ActivatedRoute without real Router
      { provide: Router,         useValue: dummyRouter },
      { provide: ActivatedRoute, useValue: {
          snapshot: { params: {}, queryParams: {} },
          params: of({}),
          queryParams: of({}),
        } },
    ],
  });

  const injector: Injector = app.injector;
  const el = createCustomElement(EchoKnowledgeChatWidget, { injector });
  customElements.define('echo-knowledge-chat-widget', el);
})();
export {};
