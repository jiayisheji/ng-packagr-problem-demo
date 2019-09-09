import { TestBed, inject } from '@angular/core/testing';

import { SimDialogService } from './dialog.service';

describe('SimDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SimDialogService]
    });
  });

  it('should be created', inject([SimDialogService], (service: SimDialogService) => {
    expect(service).toBeTruthy();
  }));
});
