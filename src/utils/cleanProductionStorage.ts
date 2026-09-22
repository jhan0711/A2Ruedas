/**
 * Utilidad de migración y purga para producción limpia en A2Ruedas.
 * Si un navegador tiene en caché datos demostrativos antiguos (clientes de prueba, órdenes falsas, dinero ficticio),
 * los elimina de forma segura para garantizar que el taller comience con base de datos 100% limpia.
 */
const CLEAN_PROD_FLAG = 'a2ruedas_production_clean_v5';

export function ensureCleanProductionStorage(): void {
  try {
    if (localStorage.getItem(CLEAN_PROD_FLAG) === 'true') {
      return;
    }

    // Lista de claves heredadas con datos demostrativos de desarrollo
    const legacyDemoKeys = [
      'a2ruedas_customers_cache',
      'a2ruedas_bicycles_cache',
      'a2ruedas_qrs_cache',
      'a2ruedas_bike_photos_cache',
      'a2ruedas_orders_cache',
      'a2ruedas_order_history_cache',
      'a2ruedas_signatures_cache',
      'a2ruedas_cash_register_active',
      'a2ruedas_cash_movements',
      'a2ruedas_cash_registers_history',
      'a2ruedas_cash_is_initialized_v2',
      'a2ruedas_invoices_v1',
      'a2ruedas_invoice_items_v1',
      'a2ruedas_invoices_initialized_v1',
      'a2ruedas_appointments_cache',
      'a2ruedas_movements_cache',
      'a2ruedas_products_cache',
      'a2ruedas_whatsapp_messages_cache',
    ];

    legacyDemoKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    localStorage.setItem(CLEAN_PROD_FLAG, 'true');
  } catch (err) {
    console.warn('Error al verificar almacenamiento local:', err);
  }
}
