import { Component, signal, input, effect, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { uuidPattern } from '../../rules';
import * as M from '../../models';
import { PoliciesComponent } from '../../sections/policies/policies.component';
import { MaterialsComponent } from '../../sections/materials/materials.component';
import { InspectionsComponent } from '../../sections/inspections/inspections.component';
import { CertificationsComponent } from '../../sections/certifications/certifications.component';
import { MaintenanceComponent } from '../../sections/maintenance/maintenance.component';
import { HoldsComponent } from '../../sections/holds/holds.component';
import { ReleasesComponent } from '../../sections/releases/releases.component';
@Component({
  selector: 'tc-quality-asset',
  imports: [
    RouterLink,
    RouterLinkActive,
    PageHeading,
    Feedback,
    QualityNavComponent,
    PendingRequestsComponent,
    PoliciesComponent,
    MaterialsComponent,
    InspectionsComponent,
    CertificationsComponent,
    MaintenanceComponent,
    HoldsComponent,
    ReleasesComponent,
  ],
  templateUrl: './asset.component.html',
  styleUrl: './asset.component.scss',
})
export class AssetComponent extends QualityPage {
  readonly record = signal<M.Asset | null>(null);
  readonly readiness = signal<M.Readiness[]>([]);
  readonly section = signal('resumen');
  readonly sections = [
    ['resumen', 'Resumen'],
    ['politicas', 'Políticas'],
    ['mtr', 'MTR'],
    ['inspecciones', 'Inspecciones'],
    ['certificaciones', 'Certificaciones'],
    ['mantenimiento', 'Mantenimiento'],
    ['retenciones', 'Retenciones'],
    ['liberaciones', 'Liberaciones'],
  ];
  ngOnInit() {
    this.watch(() => {
      const section = this.route.snapshot.paramMap.get('section') ?? 'resumen';
      if (!this.sections.some((v) => v[0] === section)) {
        void this.router.navigate(['/calidad/equipos', this.id(), 'resumen']);
        return Promise.resolve();
      }
      this.section.set(section);
      return this.load();
    });
  }
  async load() {
    await this.request(
      async () => ({
        r: await this.get<M.Asset>('/assets/' + this.id() + '/summary'),
        ready:
          this.section() === 'resumen' || this.section() === 'liberaciones'
            ? await this.get<M.Readiness[]>('/assets/' + this.id() + '/readiness')
            : [],
      }),
      (x) => {
        this.record.set(x.r);
        this.readiness.set(x.ready);
      },
    );
  }
}
