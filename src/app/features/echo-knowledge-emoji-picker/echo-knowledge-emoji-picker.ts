import {Component, EventEmitter, Output} from '@angular/core';
import {PickerComponent} from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'echo-knowledge-emoji-picker',
  imports: [
    PickerComponent
  ],
  templateUrl: './echo-knowledge-emoji-picker.html',
  styleUrl: './echo-knowledge-emoji-picker.scss'
})
export class EchoKnowledgeEmojiPicker {
  @Output() public emojiSelected = new EventEmitter<string>();

  public selectEmoji(event: any) {
    console.log(event);
    const emoji = event?.native ?? '';
    this.emojiSelected.emit(emoji);
  }
}
