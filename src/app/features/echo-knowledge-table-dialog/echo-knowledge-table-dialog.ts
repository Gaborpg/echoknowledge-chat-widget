import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'echo-knowledge-table-dialog',
  imports: [
  ],
  templateUrl: './echo-knowledge-table-dialog.html',
  styleUrl: './echo-knowledge-table-dialog.scss'
})
export class EchoKnowledgeTableDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { html: string }) {}

}
