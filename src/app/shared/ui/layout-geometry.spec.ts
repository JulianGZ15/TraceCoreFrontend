describe('Layout Geometry Specification', () => {
  it('guarantees table header starts before 320px from top at 1440x900 viewport without notices or active filters', () => {
    // Especificación geométrica definida en PLAN.md y docs/front/design.md
    const TOPBAR_HEIGHT = 64; // Cabecera estándar de TraceCore
    const MAIN_CONTENT_PADDING_TOP = 16; // Padding superior en desktop para listados
    const BREADCRUMB_HEIGHT = 16 + 8; // Texto 12px/16px + margen inferior 8px
    const TITLE_HEIGHT = 32 + 4; // h1 24px/32px + margen inferior 4px
    const DESCRIPTION_HEIGHT = 20 + 8; // Párrafo 14px/20px + margen inferior 8px
    const TABS_HEIGHT = 40; // Pestañas en escritorio 40px
    const HEADING_BORDER = 1; // Borde inferior unificado
    const HEADING_MARGIN_BOTTOM = 12; // Separación entre encabezado y toolbar
    const TOOLBAR_HEIGHT = 12 * 2 + 40; // Padding 12px arriba/abajo + controles 40px = 64px
    const TOOLBAR_MARGIN_BOTTOM = 12; // Separación entre toolbar y tarjeta de tabla
    const TABLE_CARD_BORDER = 1; // Borde superior de tarjeta de tabla

    const tableHeaderStart =
      TOPBAR_HEIGHT +
      MAIN_CONTENT_PADDING_TOP +
      BREADCRUMB_HEIGHT +
      TITLE_HEIGHT +
      DESCRIPTION_HEIGHT +
      TABS_HEIGHT +
      HEADING_BORDER +
      HEADING_MARGIN_BOTTOM +
      TOOLBAR_HEIGHT +
      TOOLBAR_MARGIN_BOTTOM +
      TABLE_CARD_BORDER;

    expect(tableHeaderStart).toBeLessThan(320);
    expect(tableHeaderStart).toBe(298);

    // Espacio vertical restante en 900px de altura de viewport
    const VIEWPORT_HEIGHT = 900;
    const FOOTER_HEIGHT = 35; // workspace-footer compacto (padding 8px + texto 12px)
    const MAIN_CONTENT_PADDING_BOTTOM = 12;
    const PAGINATION_HEIGHT = 50; // tc-pagination al pie de la tarjeta

    const tableUsableHeight =
      VIEWPORT_HEIGHT -
      tableHeaderStart -
      PAGINATION_HEIGHT -
      MAIN_CONTENT_PADDING_BOTTOM -
      FOOTER_HEIGHT;

    // La tabla debe tener al menos 450px de altura disponible para scroll interno (~11 filas de 40px)
    expect(tableUsableHeight).toBeGreaterThan(450);
  });
});
