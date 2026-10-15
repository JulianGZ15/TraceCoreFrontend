import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function acceptAppConfirmation(page: Page) {
  const confirmation = page.getByRole('dialog').last();
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Confirmar', exact: true }).click();
}
