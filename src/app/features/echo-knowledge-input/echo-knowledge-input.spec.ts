import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeInput } from './echo-knowledge-input';

describe('EchoKnowledgeInput', () => {
  let component: EchoKnowledgeInput;
  let fixture: ComponentFixture<EchoKnowledgeInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
