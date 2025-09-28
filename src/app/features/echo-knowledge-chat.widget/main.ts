import {createApplication} from '@angular/platform-browser';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {CSP_NONCE, importProvidersFrom, Injector} from '@angular/core';
import {OverlayModule} from '@angular/cdk/overlay';
import {MatDialogModule} from '@angular/material/dialog';
import {createCustomElement} from '@angular/elements';
import {EchoKnowledgeChatWidget} from './echo-knowledge-chat.widget';

function readNonceFromLoader(): string | undefined {
  // The loader sets a nonce on itself; grab it here
  const s = document.currentScript as HTMLScriptElement | null;
  return s?.nonce || s?.getAttribute?.('nonce') || undefined;
}

async function defineEchoChatElement() {
  if (customElements.get('echo-knowledge-chat-widget')) return;

  const app = await createApplication({
    providers: [
      provideHttpClient(withFetch()),
      importProvidersFrom(OverlayModule),
      importProvidersFrom(MatDialogModule),
      { provide: CSP_NONCE, useValue: readNonceFromLoader() }
    ],
  });

  const injector: Injector = app.injector;
  const el = createCustomElement(EchoKnowledgeChatWidget, { injector });
  customElements.define('echo-knowledge-chat-widget', el);
}

defineEchoChatElement();
export {};
