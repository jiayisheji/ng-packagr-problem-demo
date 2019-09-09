import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleUiComponent } from './simple-ui.component';

describe('SimpleUiComponent', () => {
  let component: SimpleUiComponent;
  let fixture: ComponentFixture<SimpleUiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleUiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
