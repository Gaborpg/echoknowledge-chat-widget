import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {PickerComponent} from '@ctrl/ngx-emoji-mart';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {Overlay, OverlayPositionBuilder, OverlayRef} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {EchoKnowledgeEmojiPicker} from '../echo-knowledge-emoji-picker/echo-knowledge-emoji-picker';

@Component({
  selector: 'echo-knowledge-input',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './echo-knowledge-input.html',
  styleUrl: './echo-knowledge-input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EchoKnowledgeInput),
      multi: true
    }
  ]
})
export class EchoKnowledgeInput implements ControlValueAccessor {
  public value = '';
  public disabled = false;

  @ViewChild('emojiBtn') private emojiBtnRef!: ElementRef;
  @ViewChild('textarea') private textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Output() public enterPressed = new EventEmitter<void>();

  private overlayRef: OverlayRef | null = null;

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder
  ) {}

  // -------------------
  // ControlValueAccessor
  // -------------------

  public writeValue(value: string): void {
    this.value = value || '';
  }

  public registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // -------------------
  // Events & Handlers
  // -------------------

  public onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);

    // Auto-resize
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }

  public onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onTouched();
      this.onChange(this.value.trim());
      this.enterPressed.emit(); // <-- This was missing
    }
  }

  public toggleEmojiPicker(): void {
    if (this.overlayRef) {
      this.closeEmojiPicker();
      return;
    }

    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(this.emojiBtnRef)
      .withPush(true)
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'bottom',
          offsetY: -8
        }
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });

    const emojiPortal = new ComponentPortal(EchoKnowledgeEmojiPicker);
    const pickerRef = this.overlayRef.attach(emojiPortal);

    pickerRef.instance.emojiSelected.subscribe((emoji: string) => {
      this.appendEmoji(emoji);
      this.closeEmojiPicker();
    });

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeEmojiPicker();
    });
  }

  private appendEmoji(emoji: string): void {
    this.value += emoji;
    this.onChange(this.value);
  }

  private closeEmojiPicker(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
  }
}
