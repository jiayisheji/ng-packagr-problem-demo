import { TestBed } from '@angular/core/testing';

import { SimpleUiService } from './simple-ui.service';

describe('SimpleUiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SimpleUiService = TestBed.get(SimpleUiService);
    expect(service).toBeTruthy();
  });
});
