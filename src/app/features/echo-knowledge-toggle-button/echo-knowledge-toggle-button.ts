import {Component, computed, ElementRef, Input, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ChatPopUp} from '../../core/services/chat-pop-up';

@Component({
  selector: 'echo-knowledge-toggle-button',
  imports: [CommonModule],
  templateUrl: './echo-knowledge-toggle-button.html',
  styleUrl: './echo-knowledge-toggle-button.scss'
})
export class EchoKnowledgeToggleButton {
  constructor(public popup: ChatPopUp) {}

  // receive everything from the widget
  @Input() botId = 'default';
  @Input() side: 'left'|'right'|'auto' = 'auto';
  @Input() top = 10;
  @Input() right = 24;
  @Input() width: number|string = '406';
  @Input() height: number|string = '90%';
  @Input() close: 'outside'|'fab-only'|'backdrop' = 'outside';
  @Input() offset = 12;
  @Input() primary = '';

  opened = computed(() => this.popup.isOpen());

  @ViewChild('fab', { static: true }) fab!: ElementRef<HTMLButtonElement>;

  public toggle() {
    console.log('toggle');
    this.popup.toggle({
      // origin ensures we don’t cover the FAB
      origin: this.fab?.nativeElement,
      side: this.side,
      offset: this.offset,
      // treat this as popup unless you want global anchoring
      mode: 'popup',
      top: this.top,
      right: this.right,
      widthDesktop: this.width,
      heightDesktop: this.height,
      close: this.close,
      theme: this.primary ? { primary: this.primary } : undefined,
    });
  }
}
