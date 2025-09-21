import {Component, InjectionToken, signal} from "@angular/core";
import { RouterOutlet } from "@angular/router";
import {EchoKnowledgeToggleButton} from './features/echo-knowledge-toggle-button/echo-knowledge-toggle-button';

export const CHAT_USE_MOCK = new InjectionToken<boolean>('CHAT_USE_MOCK', {
  factory: () => true // default to mock for now; set to false in prod
});

@Component({
  selector: 'app-root',
  imports: [EchoKnowledgeToggleButton],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
}
