import { confirm } from '../../../../shared/ui/editor';

import {
  Component,
  inject,
  signal,
  input,
  output,
  computed,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  forwardRef,
} from '@angular/core';

import {
  ReactiveFormsModule,
  FormsModule,
  FormGroup,
  FormControl,
  Validators,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { HttpErrorResponse } from '@angular/common/http';

import { Feedback, Pagination, PageHeading, Status } from '../../../../shared/ui/page';

import { EquipmentApi } from '../../equipment-api';

import { EquipmentPage, EquipmentFormPage } from '../../page-base';

import { EquipmentEditor } from '../../editor-base';

import { AssetStore } from '../../asset-store';

import { Session } from '../../../../core/auth/session';

import {
  Ref,
  Category,
  Model,
  Sheet,
  Asset,
  Profile,
  Grade,
  Heat,
  Trace,
  Lot,
  LotMember,
  LotLink,
  Owner,
  Condition,
  Assembly,
  ComponentMember,
  AssemblyLink,
  Usage,
  LookupItem,
  LookupKind,
  Purpose,
  Specs,
  Quantity,
  technicalKinds,
  conditions,
  quantities,
  catalogLinks,
  assetSections,
} from '../../models';

import {
  label,
  localError,
  numberText,
  quantityText,
  decimal,
  decimalValidator,
  scaled,
  exact,
  specsForm,
  readSpecs,
  writeSpecs,
  approvalMissing,
  toInstant,
  instantInput,
  units,
  uuidPattern,
  calendarValid,
} from '../../rules';

import { errorMessage } from '../../../../core/http/api';

import { AssetHeaderComponent } from '../../components/asset-header/asset-header.component';

import { SectionNavigationComponent } from '../../components/section-navigation/section-navigation.component';

@Component({
  selector: 'tc-equipment-dossier',
  providers: [AssetStore],
  imports: [Feedback, RouterLink, RouterOutlet, AssetHeaderComponent, SectionNavigationComponent],
  templateUrl: './dossier.component.html',
  styleUrl: './dossier.component.scss',
})
export class DossierComponent extends EquipmentPage {
  readonly store = inject(AssetStore);
  readonly ready = signal(false);

  constructor() {
    super();
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((p) => void this.load(p.get('uuid') ?? ''));
  }

  async load(uuid = this.store.uuid) {
    this.ready.set(false);
    if (!uuidPattern.test(uuid)) {
      this.error.set('El UUID del equipo no es válido.');
      return;
    }
    await this.request(
      () => this.store.load(uuid),
      () => this.ready.set(true),
    );
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.store.dispose();
  }
}
