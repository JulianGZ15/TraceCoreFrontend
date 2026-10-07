import { Page } from '@playwright/test';
import { fixtureApi, ids } from './api-fixture';
export const dids = {
  owner: '10000000-0000-0000-0000-000000000001',
  asset: '10000000-0000-0000-0000-000000000002',
  document: '10000000-0000-0000-0000-000000000003',
  file: '10000000-0000-0000-0000-000000000004',
};
export const fullCodes = [
  'DOCUMENT_READ',
  'DOCUMENT_MANAGE',
  'DOCUMENT_APPROVE',
  'DOCUMENT_CONFIDENTIAL',
  'PARTY_READ',
  'PARTY_MANAGE',
  'EQUIPMENT_READ',
  'EQUIPMENT_MANAGE',
  'QUERY_READ',
  'QUERY_EXPORT',
  'INVENTORY_READ',
  'RFID_READ',
  'COMMERCIAL_READ',
  'FINANCE_READ',
  'SUPPORT_READ',
  'AUDIT_READ',
];
export async function documentsFixture(
  page: Page,
  profile: 'full' | 'reader' | 'approver' | 'writer' | 'yard' = 'full',
) {
  const base = await fixtureApi(page, 'empty');
  const codes =
    profile === 'reader'
      ? fullCodes.filter(
          (c) =>
            ![
              'DOCUMENT_MANAGE',
              'DOCUMENT_APPROVE',
              'DOCUMENT_CONFIDENTIAL',
              'PARTY_MANAGE',
              'EQUIPMENT_MANAGE',
            ].includes(c),
        )
      : profile === 'approver'
        ? ['DOCUMENT_READ', 'DOCUMENT_APPROVE', 'PARTY_READ']
        : profile === 'writer'
          ? ['DOCUMENT_MANAGE']
          : profile === 'yard'
            ? ['EQUIPMENT_READ']
            : fullCodes;
  const documents: any[] = [
    {
      uuid: dids.document,
      title: 'Procedimiento de operación y conservación documental con trazabilidad completa',
      type: 'GENERAL',
      classification: 'INTERNAL',
      owner: { kind: 'PARTY', uuid: dids.owner },
      state: 'ACTIVE',
      currentVersionUuid: dids.file,
      version: 1,
      createdAt: '2026-10-06T00:00:00Z',
      archiveReason: null,
    },
  ];
  const files: any[] = [
    {
      uuid: dids.file,
      documentUuid: dids.document,
      number: 1,
      version: 1,
      state: 'APPROVED',
      filename: 'procedure.pdf',
      mediaType: 'application/pdf',
      size: 28,
      sha256: 'a'.repeat(64),
      source: null,
      uploadedAt: '2026-10-06T00:00:00Z',
      decidedAt: '2026-10-06T00:01:00Z',
      decisionReason: 'Aprobado',
    },
  ];
  const links: any[] = [
    {
      uuid: '10000000-0000-0000-0000-000000000005',
      subject: { kind: 'PARTY', uuid: dids.owner },
      versionUuid: dids.file,
      role: 'PRIMARY',
      validFrom: '2026-10-06T00:00:00Z',
      validTo: null,
      withdrawnAt: null,
      withdrawalReason: null,
      version: 0,
    },
  ];
  const writes: { path: string; body: any }[] = [];
  const gets: string[] = [];
  let lostCreate = false;
  let decisionConflict = false;
  let oldResponse = false;
  const state = {
    documents,
    files,
    links,
    writes,
    gets,
    codes,
    get lostCreate() {
      return lostCreate;
    },
    set lostCreate(v: boolean) {
      lostCreate = v;
    },
    get decisionConflict() {
      return decisionConflict;
    },
    set decisionConflict(v: boolean) {
      decisionConflict = v;
    },
    get oldResponse() {
      return oldResponse;
    },
    set oldResponse(v: boolean) {
      oldResponse = v;
    },
  };
  const view = (v: any) => ({
    metadata: v,
    current:
      documents.find((d) => d.uuid === v.documentUuid)?.currentVersionUuid === v.uuid &&
      v.state === 'APPROVED',
    downloadable:
      v.state === 'APPROVED' ||
      codes.includes('DOCUMENT_MANAGE') ||
      codes.includes('DOCUMENT_APPROVE'),
  });
  const summary = (d: any) => ({
    document: d,
    ownerLabel: 'Tercero documental',
    current: files.find((v) => v.uuid === d.currentVersionUuid)
      ? view(files.find((v) => v.uuid === d.currentVersionUuid))
      : null,
    latest:
      files
        .filter((v) => v.documentUuid === d.uuid)
        .map(view)
        .at(-1) ?? null,
    actions: {
      manage: codes.includes('DOCUMENT_MANAGE') && d.state === 'ACTIVE',
      approve: codes.includes('DOCUMENT_APPROVE') && d.state === 'ACTIVE',
      archive: codes.includes('DOCUMENT_MANAGE') && d.state === 'ACTIVE',
      link: codes.includes('DOCUMENT_MANAGE') && d.state === 'ACTIVE',
    },
    evaluatedAt: '2026-10-06T12:00:00Z',
  });
  const linked = (l: any) => {
    const v = files.find((v) => v.uuid === l.versionUuid),
      d = documents.find((d) => d.uuid === v.documentUuid);
    return {
      view: {
        link: l,
        document: d,
        file: view(v),
        effective:
          !l.withdrawnAt &&
          d.state === 'ACTIVE' &&
          d.currentVersionUuid === v.uuid &&
          v.state === 'APPROVED',
      },
      subjectLabel: 'Tercero documental',
      withdrawable: !l.withdrawnAt && codes.includes('DOCUMENT_MANAGE'),
      evaluatedAt: '2026-10-06T12:00:00Z',
    };
  };
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace('/api/v1', ''),
      method = request.method();
    const respond = (json: unknown, status = 200, headers: Record<string, string> = {}) =>
      route.fulfill({ status, json, headers });
    const paging = (rows: any[]) => {
      const offset = Number(url.searchParams.get('offset') ?? 0),
        limit = Number(url.searchParams.get('limit') ?? 25),
        more = rows.length > offset + limit;
      return {
        items: rows.slice(offset, offset + limit),
        offset,
        limit,
        hasMore: more,
        nextOffset: more ? offset + limit : null,
      };
    };
    if (path === '/auth/context')
      return respond({
        company: {
          uuid: ids.company,
          name: 'TraceCore documental',
          active: true,
          timezone: 'America/Mexico_City',
        },
        companyPermissions: codes,
        yards: [
          {
            uuid: ids.yard,
            code: 'PT-MTY',
            name: 'Patio documental',
            active: true,
            timezone: 'America/Monterrey',
            permissions: profile === 'yard' ? ['QUERY_READ', 'INVENTORY_READ', 'RFID_READ'] : [],
          },
        ],
      });
    if (!path.startsWith('/documents') && !path.startsWith('/queries')) return route.fallback();
    if (method === 'GET') gets.push(path);
    if (path.startsWith('/documents') && !codes.includes('DOCUMENT_READ'))
      return respond({ code: 'ACCESS_DENIED' }, 403);
    let body: any = null;
    if (method === 'POST') {
      if (!request.headers()['content-type']?.includes('multipart')) body = request.postDataJSON();
      writes.push({ path, body });
    }
    if (path === '/documents' && method === 'POST') {
      const d = {
        ...body,
        owner: { kind: body.ownerKind, uuid: body.ownerUuid },
        state: 'ACTIVE',
        currentVersionUuid: null,
        version: 0,
        createdAt: '2026-10-06T00:00:00Z',
        archiveReason: null,
      };
      documents.push(d);
      if (lostCreate) {
        lostCreate = false;
        return route.abort('failed');
      }
      return respond(d);
    }
    if (path === '/documents/directory') {
      let rows = documents;
      const search = url.searchParams.get('search');
      if (search) rows = rows.filter((d) => d.title.includes(search));
      const state = url.searchParams.get('state');
      if (state) rows = rows.filter((d) => d.state === state);
      return respond(
        paging(rows.map((document) => ({ document, ownerLabel: 'Tercero documental' }))),
      );
    }
    if (
      path === '/documents/subject-options' ||
      path === '/queries/party-options' ||
      path === '/queries/equipment-options'
    )
      return respond(
        paging([
          {
            uuid: path.includes('equipment') ? dids.asset : dids.owner,
            kind: url.searchParams.get('kind') ?? 'PARTY',
            label: 'Tercero documental',
          },
        ]),
      );
    if (path === '/documents/evidence-options')
      return respond(
        paging([
          {
            uuid: '10000000-0000-0000-0000-000000000006',
            kind: url.searchParams.get('sourceKind'),
            filename: 'legacy.pdf',
            mediaType: 'application/pdf',
            size: 28,
            sha256: 'b'.repeat(64),
          },
        ]),
      );
    if (path === '/documents/links' && method === 'POST') {
      const l = {
        ...body,
        subject: { kind: body.subjectKind, uuid: body.subjectUuid },
        withdrawnAt: null,
        withdrawalReason: null,
        version: 0,
      };
      links.push(l);
      return respond(l);
    }
    if (path === '/documents/links/directory')
      return respond(
        paging(
          links
            .filter(
              (l) =>
                l.subject.kind === url.searchParams.get('subjectKind') &&
                l.subject.uuid === url.searchParams.get('subjectUuid'),
            )
            .map(linked),
        ),
      );
    let match = path.match(/^\/documents\/links\/([A-Z_]+)\/([a-f0-9-]+)(\/withdraw)?$/);
    if (match) {
      const l = links.find((l) => l.uuid === match![2]);
      if (!l) return respond({ code: 'RESOURCE_MISSING' }, 404);
      if (method === 'POST') {
        l.withdrawnAt = '2026-10-06T12:00:00Z';
        l.withdrawalReason = body.reason;
        l.version++;
        return respond(l);
      }
      return respond(linked(l));
    }
    match = path.match(/^\/documents\/versions\/([a-f0-9-]+)(\/decisions|\/content)?$/);
    if (match) {
      const v = files.find((v) => v.uuid === match![1]);
      if (!v) return respond({ code: 'RESOURCE_MISSING' }, 404);
      const d = documents.find((d) => d.uuid === v.documentUuid);
      if (match[2] === '/content')
        return route.fulfill({ body: '%PDF-1.4\ncontent\n%%EOF', contentType: 'application/pdf' });
      if (match[2] === '/decisions') {
        if (method === 'GET') return respond([]);
        if (decisionConflict) {
          decisionConflict = false;
          v.version++;
          return respond({ code: 'VERSION_CONFLICT' }, 409);
        }
        v.state =
          body.action === 'APPROVE'
            ? 'APPROVED'
            : body.action === 'REJECT'
              ? 'REJECTED'
              : 'REVOKED';
        v.version++;
        v.decisionReason = body.reason;
        if (body.action === 'APPROVE') {
          d.currentVersionUuid = v.uuid;
          links.push({
            uuid: crypto.randomUUID(),
            subject: d.owner,
            versionUuid: v.uuid,
            role: 'PRIMARY',
            validFrom: '2026-10-06T00:00:00Z',
            validTo: null,
            withdrawnAt: null,
            version: 0,
          });
        }
        if (body.action === 'REVOKE' && d.currentVersionUuid === v.uuid)
          d.currentVersionUuid = null;
        d.version++;
        return respond(v);
      }
      return respond(view(v));
    }
    match = path.match(
      /^\/documents\/([a-f0-9-]+)(\/summary|\/versions|\/imports|\/links|\/archive)?$/,
    );
    if (match) {
      const d = documents.find((d) => d.uuid === match![1]);
      if (!d) return respond({ code: 'RESOURCE_MISSING' }, 404);
      if (method === 'POST') {
        if (match[2] === '/archive') {
          d.state = 'ARCHIVED';
          d.archiveReason = body.reason;
          d.version++;
          return respond(d);
        }
        const v = {
          ...files[0],
          uuid: body?.uuid ?? url.searchParams.get('versionUuid'),
          documentUuid: d.uuid,
          number: files.filter((v) => v.documentUuid === d.uuid).length + 1,
          state: 'DRAFT',
          version: 0,
          filename: body ? 'legacy.pdf' : 'upload.pdf',
          source: body ? { kind: body.sourceKind, uuid: body.sourceUuid } : null,
        };
        files.push(v);
        d.version++;
        return respond(v);
      }
      if (match[2] === '/summary') return respond(summary(d));
      if (match[2] === '/links')
        return respond(
          paging(
            links
              .filter((l) => files.find((v) => v.uuid === l.versionUuid)?.documentUuid === d.uuid)
              .map(linked),
          ),
        );
      return respond({
        document: d,
        versions: paging(
          files
            .filter((v) => v.documentUuid === d.uuid)
            .reverse()
            .map(view),
        ).items,
        hasMore: false,
      });
    }
    if (path === '/queries/dashboard')
      return respond({
        generatedAt: '2026-10-06T12:00:00Z',
        yardUuid: ids.yard,
        inventory: {
          identifiedPieces: 12,
          positions: 3,
          knownWeightKg: 999999999999.999999,
          knownWeightKgExact: '999999999999.999999',
          unknownWeightGroups: 1,
          assetsInTransit: 2,
          pendingProposals: 1,
        },
        commercial: { authorized: false, data: null },
        logistics: { authorized: false, data: null },
        qualityHolds: { authorized: false, data: null },
      });
    if (path.startsWith('/queries/exports/')) {
      const offset = Number(url.searchParams.get('offset') ?? 0);
      return route.fulfill({
        contentType: 'text/csv;charset=UTF-8',
        body: '\ufeffcode,weight\nTEST,999999999999.999999\n',
        headers: {
          'Content-Disposition': 'attachment; filename=inventory.csv',
          'X-Offset': String(offset),
          'X-Limit': '500',
          'X-Has-More': String(offset === 0),
          'X-Next-Offset': offset === 0 ? '500' : '',
          'X-Generated-At': '2026-10-06T12:00:00Z',
        },
      });
    }
    if (path === '/queries/inventory') {
      if (oldResponse && url.searchParams.get('search') === 'old') {
        await new Promise((r) => setTimeout(r, 500));
      }
      return respond(
        paging([
          {
            assetUuid: dids.asset,
            internalCode: url.searchParams.get('search') === 'old' ? 'OLD' : 'EQ-001',
            serialNumber: 'Serial documental',
            modelCode: 'MOD-001',
            lifecycle: 'ACTIVE',
            rootAssetUuid: dids.asset,
            locationUuid: null,
            grossWeightKg: 999999999999.999999,
            grossWeightKgExact: '999999999999.999999',
          },
        ]),
      );
    }
    if (path === '/queries/orders')
      return respond(
        paging([
          {
            uuid: '10000000-0000-0000-0000-000000000007',
            type: 'OR',
            state: 'APPROVED',
            series: 'OR',
            folio: '001',
            currency: 'MXN',
            totalAmount: 99999999999999.9999,
            totalAmountExact: '99999999999999.9999',
          },
        ]),
      );
    if (path.startsWith('/queries/filter-options'))
      return respond(paging([{ uuid: dids.owner, label: 'Catálogo autorizado' }]));
    if (path.endsWith('/summary') && path.startsWith('/queries/'))
      return respond({
        profile: {
          asset: {
            uuid: dids.asset,
            internalCode: 'EQ-001',
            referenceValue: 999999999999999.9999,
            referenceValueExact: '999999999999999.9999',
          },
        },
        sections: {
          technicalHistory: true,
          composition: true,
          inventory: true,
          quality: false,
          rfid: true,
          commercial: false,
          documents: codes.includes('DOCUMENT_READ'),
          contacts: true,
          avl: true,
          finance: true,
          evidence: true,
        },
        generatedAt: '2026-10-06T12:00:00Z',
      });
    if (path.includes('/sections/')) {
      const section = path.split('/').at(-1);
      if (section === 'quality')
        return respond({
          authorized: false,
          data: null,
          collection: url.searchParams.get('collection'),
          generatedAt: '2026-10-06T12:01:00Z',
        });
      return respond({
        authorized: true,
        data: url.searchParams.get('collection')
          ? paging([
              {
                uuid: dids.owner,
                reference: 'Historia autorizada',
                amount: 0.1,
                amountExact: '0.100000',
              },
            ])
          : section === 'finance'
            ? { balances: [{ currency: 'MXN', receivable: 1, receivableExact: '1.0000' }] }
            : {},
        collection: url.searchParams.get('collection'),
        generatedAt: '2026-10-06T12:01:00Z',
      });
    }
    if (path === '/queries/support/rfid-receipts')
      return respond(
        paging([
          {
            eventUuid: dids.file,
            sessionUuid: dids.document,
            assetUuid: dids.asset,
            yardUuid: ids.yard,
            status: 'RESOLVED',
            receivedAt: '2026-10-06T12:00:00Z',
          },
        ]),
      );
    if (path === '/queries/support/audit')
      return respond(
        paging([
          {
            uuid: dids.file,
            resourceType: 'DOCUMENT',
            resourceUuid: dids.document,
            actorUuid: ids.admin,
            action: 'APPROVE',
            changedFields: ['state'],
            correlationUuid: dids.owner,
            occurredAt: '2026-10-06T12:00:00Z',
          },
        ]),
      );
    return respond({ code: 'RESOURCE_MISSING' }, 404);
  });
  return state;
}
