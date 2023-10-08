import { TestBed } from '@angular/core/testing';

import { PollutionDataService } from './pollution-data.service';

describe('PollutionDataService', () => {
  let service: PollutionDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PollutionDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
