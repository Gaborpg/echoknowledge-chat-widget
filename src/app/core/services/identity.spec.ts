import { TestBed } from '@angular/core/testing';

import { Identity } from './identity';

describe('Identity', () => {
  let service: Identity;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Identity);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
