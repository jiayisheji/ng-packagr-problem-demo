import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ButtonModule } from 'simple-ui/button';
import { MyLibModule } from 'simple-ui';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MyLibModule,
    ButtonModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
