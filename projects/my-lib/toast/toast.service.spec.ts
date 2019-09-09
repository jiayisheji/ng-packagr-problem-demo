import { TestBed, inject } from '@angular/core/testing';

import { SimToastService } from './toast.service';

describe('SimToastService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SimToastService]
    });
  });

  it('should be created', inject([SimToastService], (service: SimToastService) => {
    expect(service).toBeTruthy();
  }));
});
