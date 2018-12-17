import { Component, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs/Subscription';

import { DialogService } from './../services/index';

@Component({
  selector: 'ia-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnDestroy {
  private dialogEventSubscription: Subscription;

  public title: string = undefined;
  public innerHtml: SafeHtml | undefined;
  public footerButtonLabel: string;
  public footerRouterLink: string[];
  public showDialog = false;
  public isLoading = false;

  constructor(dialogService: DialogService, private router: Router) {    
    this.dialogEventSubscription = dialogService.dialogEvent.subscribe(event => {      
      switch (event.status) {
        case 'hide':
          this.innerHtml = undefined;
          this.showDialog = false;
          break;

        case 'loading':
          this.innerHtml = undefined;
          this.showDialog = true;
          this.isLoading = true;
          break;

        case 'show':
          this.innerHtml = event.html;
          this.title = event.title;
          this.showDialog = true;
          this.isLoading = false;
          this.footerButtonLabel = event.footer.buttonLabel;
          this.footerRouterLink = event.footer.routerLink;
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.dialogEventSubscription.unsubscribe();
  }

  navigate(): void {
    this.router.navigate(this.footerRouterLink);
  }
}
