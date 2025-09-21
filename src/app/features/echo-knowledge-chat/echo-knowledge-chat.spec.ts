import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeChat } from './echo-knowledge-chat';

describe('EchoKnowledgeChat', () => {
  let component: EchoKnowledgeChat;
  let fixture: ComponentFixture<EchoKnowledgeChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
