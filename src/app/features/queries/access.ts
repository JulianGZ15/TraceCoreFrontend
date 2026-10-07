import { Injectable, inject } from '@angular/core';
import { Session } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class QueryAccess {
  readonly session = inject(Session);
  can(code: string, yard?: string) {
    return this.session.can(code) || (!!yard && this.session.can(code, yard));
  }
  any(code: string) {
    return (
      this.session.can(code) ||
      !!this.session.context()?.yards.some((y) => this.session.can(code, y.uuid))
    );
  }
  dashboard(yard: string) {
    return !!yard && this.can('QUERY_READ', yard) && this.can('INVENTORY_READ', yard);
  }
  inventory(yard: string) {
    return (
      this.can('QUERY_READ', yard) &&
      this.can('INVENTORY_READ', yard) &&
      this.session.can('EQUIPMENT_READ')
    );
  }
  orders(yard: string) {
    return this.can('QUERY_READ', yard) && this.can('COMMERCIAL_READ', yard);
  }
  receipt(yard: string) {
    return (
      this.session.can('SUPPORT_READ') &&
      this.can('QUERY_READ', yard) &&
      this.can('RFID_READ', yard)
    );
  }
  audit() {
    return ['SUPPORT_READ', 'QUERY_READ', 'AUDIT_READ'].every((c) => this.session.can(c));
  }
}
