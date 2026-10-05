import { Component, inject, input, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl, AbstractControl } from '@angular/forms';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
import { RouterLink, RouterLinkActive } from '@angular/router';
@Component({
  selector: 'tc-quality-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './quality-nav.component.html',
  styleUrl: './quality-nav.component.scss',
})
export class QualityNavComponent extends QualityPage {}
