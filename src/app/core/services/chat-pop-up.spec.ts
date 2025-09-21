import { TestBed } from '@angular/core/testing';

import { ChatPopUp } from './chat-pop-up';

describe('ChatPopUp', () => {
  let service: ChatPopUp;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatPopUp);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
