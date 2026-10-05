import { TestBed } from '@angular/core/testing';
import { QualityAccess } from './access';
import { qualityTestProviders } from './testing';
describe('política local de calidad', () => {
  it('mantiene lectura y escritura independientes y respeta cada patio', () => {
    const s = qualityTestProviders();
    s.session.context.set({
      company: { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true },
      companyPermissions: ['QUALITY_APPROVE'],
      yards: [{ uuid: 'yard', active: true, permissions: ['QUALITY_READ', 'INSPECTION_MANAGE'] }],
    });
    TestBed.configureTestingModule({ providers: s.providers });
    const access = TestBed.inject(QualityAccess);
    expect(access.global('QUALITY_READ')).toBe(false);
    expect(access.can('QUALITY_APPROVE', 'yard')).toBe(true);
    expect(access.can('QUALITY_READ', 'yard')).toBe(true);
    expect(access.can('QUALITY_READ', 'other')).toBe(false);
    expect(access.can('MAINTENANCE_MANAGE', 'yard')).toBe(false);
  });
});
