import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { DividerModule } from './divider.module';

@Component({
  template: `<sim-divider [vertical]="vertical" [dashed]="dashed" [interval]="interval">{{text}}</sim-divider>`
})
class SimDividerTestComponent {
  vertical: boolean;
  dashed: boolean;
  interval: boolean;
  text: string;
}


describe('sim-divider', () => {
  let fixture: ComponentFixture<SimDividerTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [DividerModule],
      declarations: [
        SimDividerTestComponent
      ],
    });

    TestBed.compileComponents();
    fixture = TestBed.createComponent(SimDividerTestComponent);
  }));


  it('应该将垂直分类应用于垂直分隔符', () => {
    fixture.componentInstance.vertical = true;
    fixture.detectChanges();

    const divider = fixture.debugElement.query(By.css('sim-divider'));
    expect(divider.nativeElement.className).toContain('sim-divider');
    expect(divider.nativeElement.className).toContain('sim-divider-vertical');
  });

});



