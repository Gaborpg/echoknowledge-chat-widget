import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeChatWidget } from './echo-knowledge-chat.widget';

describe('EchoKnowledgeChatWidget', () => {
  let component: EchoKnowledgeChatWidget;
  let fixture: ComponentFixture<EchoKnowledgeChatWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeChatWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeChatWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
