import { Validators } from '@angular/forms';
import { Field, codeValidator } from '../../shared/ui/editor-model';
const text = (key: string, label: string, required = false, max = 150): Field => ({
  key,
  label,
  required,
  validators: [Validators.maxLength(max)],
});
const country: Field = {
  key: 'country',
  label: 'País ISO (dos letras)',
  required: true,
  validators: [Validators.pattern(/^[A-Za-z]{2}$/)],
};
const active: Field = { key: 'active', label: 'Activo', type: 'checkbox' };
export const partyFields: Field[] = [
  text('legalName', 'Razón social', true, 250),
  text('tradeName', 'Nombre comercial'),
  country,
  active,
];
export const contactFields: Field[] = [
  text('name', 'Nombre completo', true),
  text('position', 'Cargo'),
  { ...text('email', 'Correo electrónico', false, 254), type: 'email' },
  text('phone', 'Teléfono', false, 40),
  text('extension', 'Extensión', false, 10),
  { key: 'primary', label: 'Contacto principal', type: 'checkbox' },
  active,
];
export const addressFields: Field[] = [
  {
    key: 'type',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'FISCAL', label: 'Fiscal' },
      { value: 'COMMERCIAL', label: 'Comercial' },
      { value: 'DELIVERY', label: 'Entrega' },
    ],
  },
  text('line1', 'Dirección', true, 250),
  text('line2', 'Complemento', false, 250),
  text('locality', 'Localidad', true),
  text('region', 'Región'),
  text('postalCode', 'Código postal', false, 30),
  country,
  active,
];
export const taxFields: Field[] = [
  country,
  { ...text('type', 'Tipo de identificación', true, 80), validators: [codeValidator] },
  text('number', 'Número fiscal', true, 100),
];
export const certificateFields: Field[] = [
  text('standard', 'Norma', true),
  text('number', 'Número / licencia', true, 100),
  text('issuer', 'Emisor', true, 250),
  { key: 'issuedOn', label: 'Fecha de emisión', type: 'date', required: true },
  { key: 'expiresOn', label: 'Fecha de vencimiento inclusiva', type: 'date' },
];
