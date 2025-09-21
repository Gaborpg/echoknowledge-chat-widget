import { TestBed } from '@angular/core/testing';

import { EchoChatStore } from './echo-chat-store';

describe('EchoChatStore', () => {
  let service: EchoChatStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EchoChatStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
