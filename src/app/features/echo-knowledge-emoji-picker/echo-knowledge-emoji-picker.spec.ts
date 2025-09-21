import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeEmojiPicker } from './echo-knowledge-emoji-picker';

describe('EchoKnowledgeEmojiPicker', () => {
  let component: EchoKnowledgeEmojiPicker;
  let fixture: ComponentFixture<EchoKnowledgeEmojiPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeEmojiPicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeEmojiPicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
