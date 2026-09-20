import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Alert,
  LoadingSpinner,
  LoadingSkeleton,
  EmptyState,
  Modal,
  ConfirmModal,
} from '../../components/ui';
import {
  Search,
  Plus,
  Trash2,
  CheckCircle,
  Palette,
} from 'lucide-react';
import { WorkOrderStatus } from '../../types';

export const DesignSystemPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const statuses: WorkOrderStatus[] = [
    'RECIBIDA',
    'DIAGNOSTICO',
    'PRESUPUESTO',
    'APROBADA',
    'EN_REPARACION',
    'ESPERANDO_REPUESTO',
    'LISTA',
    'ENTREGADA',
    'CANCELADA',
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            Sistema Visual B2B — A2Ruedas Design System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catálogo y banco de pruebas de componentes UI nativos construidos con Tailwind CSS para alta productividad.
          </p>
        </div>
      </div>

      {/* 1. Botones */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>1. Botones (Button)</CardTitle>
            <CardDescription>Variantes semánticas, tamaños y estados interactivos</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Variantes
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success" leftIcon={<CheckCircle className="w-3.5 h-3.5" />}>
                Success
              </Button>
              <Button variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Danger
              </Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Tamaños (Sizes)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md)</Button>
              <Button size="lg">Large (lg)</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              Estados (Loading & Disabled)
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                isLoading={loadingBtn}
                onClick={() => {
                  setLoadingBtn(true);
                  setTimeout(() => setLoadingBtn(false), 2000);
                }}
              >
                {loadingBtn ? 'Guardando...' : 'Hacer clic para probar Loading'}
              </Button>
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="secondary" disabled>
                Secondary Disabled
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <span className="text-[11px] text-slate-400 font-mono">
            Total de variantes interactivas probadas: 6
          </span>
          <Button size="sm" variant="ghost">Ver especificación</Button>
        </CardFooter>
      </Card>

      {/* 2. Formularios (Inputs & Selects) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>2. Campos de Formulario (Input & Select)</CardTitle>
            <CardDescription>Entradas tipadas, prefijos monoespaciados y validación de errores</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Nombre del Cliente"
              placeholder="Ej. Juan Pérez"
              helperText="Nombre completo para la orden"
            />
            <Input
              label="Búsqueda de Repuesto"
              placeholder="Buscar..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Input
              label="Monto de Anticipo"
              prefixText="$"
              placeholder="50.000"
              isMono
            />
            <Input
              label="Número de Serie de Marco"
              placeholder="WTU281C..."
              prefixText="SER-"
              isMono
              helperText="Grabado bajo la caja pedalier"
            />
            <Input
              label="Campo con Error"
              defaultValue="Dato erróneo"
              error="El teléfono debe tener 10 dígitos numéricos"
            />
            <Select
              label="Tipo de Bicicleta"
              options={[
                { value: 'mtb', label: 'Montaña (MTB)' },
                { value: 'road', label: 'Ruta / Carretera' },
                { value: 'gravel', label: 'Gravel' },
                { value: 'urban', label: 'Urbana' },
                { value: 'ebike', label: 'Eléctrica (E-Bike)' },
              ]}
              helperText="Selecciona la modalidad de la bicicleta"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Badges de Estado del Taller */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>3. Badges y Estados del Taller</CardTitle>
            <CardDescription>Mapeo automático de los 9 estados del ciclo de trabajo de A2Ruedas</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map((st) => (
              <Badge key={st} status={st} withDot isMono />
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <Badge variant="info">Informativo</Badge>
            <Badge variant="success">Completado</Badge>
            <Badge variant="warning">Atención requerida</Badge>
            <Badge variant="danger">Cancelado / Error</Badge>
            <Badge variant="neutral">Borrador</Badge>
            <Badge variant="purple">Presupuesto</Badge>
            <Badge variant="indigo">Diagnóstico</Badge>
            <Badge variant="cyan">Aprobado</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tablas B2B de Alta Densidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>4. Tabla de Datos Técnica (Table)</CardTitle>
              <CardDescription>Tipografía monoespaciada para seriales y valores numéricos</CardDescription>
            </div>
            <Button size="sm" variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Nueva Fila
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identificador</TableHead>
                <TableHead>Concepto / Repuesto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                  REP-0012
                </TableCell>
                <TableCell className="font-medium">Cadena Shimano 9V CN-HG53</TableCell>
                <TableCell>Transmisión</TableCell>
                <TableCell>
                  <Badge variant="success" withDot>
                    Disponible
                  </Badge>
                </TableCell>
                <TableCell isMono className="text-right">
                  12 un.
                </TableCell>
                <TableCell isMono className="text-right font-semibold">
                  $85.000
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                  FRE-0045
                </TableCell>
                <TableCell className="font-medium">Pastillas de Freno Shimano B05S</TableCell>
                <TableCell>Frenos</TableCell>
                <TableCell>
                  <Badge variant="warning" withDot>
                    Stock Bajo
                  </Badge>
                </TableCell>
                <TableCell isMono className="text-right text-amber-600 font-bold">
                  2 par
                </TableCell>
                <TableCell isMono className="text-right font-semibold">
                  $45.000
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell isMono className="font-bold text-blue-600 dark:text-blue-400">
                  SRV-0001
                </TableCell>
                <TableCell className="font-medium">Mantenimiento General Completo</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>
                  <Badge variant="info">Activo</Badge>
                </TableCell>
                <TableCell isMono className="text-right text-slate-400">
                  —
                </TableCell>
                <TableCell isMono className="text-right font-semibold">
                  $120.000
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Alertas Semánticas */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>5. Alertas del Sistema (Alert)</CardTitle>
            <CardDescription>Notificaciones en contexto con opción de descarte</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAlert && (
            <Alert
              variant="info"
              title="Información del Taller"
              onDismiss={() => setShowAlert(false)}
            >
              El cierre de caja está programado automáticamente para las 6:30 PM.
            </Alert>
          )}
          <Alert variant="success" title="Operación Exitosa">
            La orden de trabajo OT-000104 ha sido aprobada por el cliente mediante firma táctil.
          </Alert>
          <Alert variant="warning" title="Advertencia de Inventario">
            El stock de pastillas de freno ha alcanzado el umbral mínimo de seguridad.
          </Alert>
          <Alert variant="error" title="Error en Validación">
            No se puede entregar una bicicleta sin registrar el medio de pago en caja.
          </Alert>
        </CardContent>
      </Card>

      {/* 6. Estados de Carga y Empty State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>6. Estados de Carga (Loading)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadingSpinner size="md" text="Sincronizando inventario con Supabase..." />
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400">SKELETON LOADERS:</span>
              <LoadingSkeleton className="h-4 w-3/4" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Estado Vacío (Empty State)</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No hay órdenes en espera"
              description="Todas las bicicletas en taller han sido diagnosticadas o están en reparación."
              actionText="Registrar Nuevo Ingreso"
              onAction={() => alert('Acción de ingreso activada')}
            />
          </CardContent>
        </Card>
      </div>

      {/* 8. Modales y Confirmación de Acciones Peligrosas */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>8. Modales y Confirmaciones (Rule 44)</CardTitle>
            <CardDescription>
              Diálogos accesibles con teclado y modales obligatorios para acciones destructivas
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir Modal Estándar
          </Button>

          <Button variant="danger" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setConfirmOpen(true)}>
            Probar Confirmación Peligrosa (Eliminar/Cerrar)
          </Button>
        </CardContent>
      </Card>

      {/* Modal Estándar de Prueba */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ficha Técnica de Bicicleta"
        description="Detalle de componentes y especificaciones"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cerrar
            </Button>
            <Button size="sm" onClick={() => setModalOpen(false)}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>
            Aquí se puede visualizar o editar cualquier información técnica sin salir del contexto de trabajo.
          </p>
          <Input label="Marca / Modelo" defaultValue="Trek Marlin 7" />
          <Input label="Serial" defaultValue="WTU281C0492S" isMono />
        </div>
      </Modal>

      {/* ConfirmModal para Acciones Peligrosas */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          alert('Acción confirmada con auditoría.');
        }}
        title="¿Deseas cerrar la caja del día?"
        message="Esta acción bloqueará los movimientos de efectivo y generará el balance contable final. Deberás ingresar el monto contado en físico."
        confirmText="Confirmar Cierre"
        variant="danger"
      />
    </div>
  );
};
