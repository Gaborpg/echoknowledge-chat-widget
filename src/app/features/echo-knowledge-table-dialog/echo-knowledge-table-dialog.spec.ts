import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchoKnowledgeTableDialog } from './echo-knowledge-table-dialog';

describe('EchoKnowledgeTableDialog', () => {
  let component: EchoKnowledgeTableDialog;
  let fixture: ComponentFixture<EchoKnowledgeTableDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoKnowledgeTableDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EchoKnowledgeTableDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
