import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeToggleButton } from './echo-knowledge-toggle-button';

describe('EchoKnowledgeToggleButton', () => {
  let component: EchoKnowledgeToggleButton;
  let fixture: ComponentFixture<EchoKnowledgeToggleButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeToggleButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeToggleButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
