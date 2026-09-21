import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  MessageCircle,
  ClipboardCheck,
  Trash2,
  Gauge,
  List,
  CalendarDays,
} from 'lucide-react';
import { Appointment, Customer, Bicycle } from '../../types/database';
import {
  appointmentService,
  AVAILABLE_MECHANICS,
  COMMON_SERVICES,
  DEFAULT_DAILY_CAPACITY,
} from '../../services/appointmentService';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { Button, Card, Modal, ConfirmModal, Alert, LoadingSpinner } from '../../components/ui';

type CalendarView = 'month' | 'week' | 'day' | 'list';

export const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Estados de datos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de vista y navegación temporal
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toISOString().slice(0, 10));

  // Filtros de búsqueda en vista de lista
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal Nueva Cita
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newBicycleId, setNewBicycleId] = useState('');
  const [newServiceName, setNewServiceName] = useState(COMMON_SERVICES[0].name);
  const [newDurationMin, setNewDurationMin] = useState(COMMON_SERVICES[0].duration);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('09:00');
  const [newMechanic, setNewMechanic] = useState(AVAILABLE_MECHANICS[0]);
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dailyCapacityInfo, setDailyCapacityInfo] = useState<{
    booked: number;
    max: number;
    percentage: number;
    isFull: boolean;
  } | null>(null);

  // Modal Detalle de Cita
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Modal Confirmación de Eliminación (Regla 44)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback y alertas
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Cargar datos
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apts, custs, bikes] = await Promise.all([
        appointmentService.getAppointments(),
        customerService.getCustomers(),
        bicycleService.getBicycles(),
      ]);
      setAppointments(apts);
      setCustomers(custs);
      setBicycles(bikes);
    } catch (err) {
      console.error('Error al cargar agenda:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Consultar aforo en tiempo real cuando cambia la fecha en el modal de nueva cita
  useEffect(() => {
    if (!newModalOpen) return;
    const checkCap = async () => {
      const cap = await appointmentService.getDailyCapacity(newDate);
      setDailyCapacityInfo(cap);
    };
    checkCap();
  }, [newDate, newModalOpen, appointments]);

  // Bicicletas filtradas por cliente seleccionado en el modal
  const customerBicycles = useMemo(() => {
    if (!newCustomerId) return [];
    return bicycles.filter((b) => b.customer_id === newCustomerId);
  }, [newCustomerId, bicycles]);

  // Auto-seleccionar primera bicicleta al cambiar de cliente
  useEffect(() => {
    if (customerBicycles.length > 0) {
      setNewBicycleId(customerBicycles[0].id);
    } else {
      setNewBicycleId('');
    }
  }, [customerBicycles]);

  // Navegación temporal (Mes / Semana / Día)
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (currentView === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (currentView === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (currentView === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.toISOString().slice(0, 10));
  };

  // Título del período actual
  const periodTitle = useMemo(() => {
    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    if (currentView === 'month') {
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'day') {
      return currentDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      // Semana
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `Semana: ${startOfWeek.getDate()} ${months[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${months[endOfWeek.getMonth()]}`;
    }
  }, [currentDate, currentView]);

  // Métricas rápidas de agenda
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayAppointments = appointments.filter(
      (a) => a.scheduled_at.slice(0, 10) === todayStr && a.status !== 'CANCELLED'
    );
    const monthAppointments = appointments.filter((a) => {
      const d = new Date(a.scheduled_at);
      return (
        d.getMonth() === currentDate.getMonth() &&
        d.getFullYear() === currentDate.getFullYear() &&
        a.status !== 'CANCELLED'
      );
    });
    const completedMonth = monthAppointments.filter((a) => a.status === 'COMPLETED').length;
    const capacityPercent = Math.min(
      100,
      Math.round((todayAppointments.length / DEFAULT_DAILY_CAPACITY) * 100)
    );

    return {
      todayCount: todayAppointments.length,
      todayCapacityPercent: capacityPercent,
      monthCount: monthAppointments.length,
      completedMonth,
    };
  }, [appointments, currentDate]);

  // Guardar nueva cita
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setAlertMessage({ type: 'error', text: 'Debes seleccionar un cliente propietario.' });
      return;
    }

    setIsSaving(true);
    try {
      const scheduledDateTime = new Date(`${newDate}T${newTime}:00`).toISOString();

      await appointmentService.createAppointment({
        customer_id: newCustomerId,
        bicycle_id: newBicycleId || null,
        service_name: newServiceName,
        mechanic_name: newMechanic,
        scheduled_at: scheduledDateTime,
        estimated_duration_min: Number(newDurationMin),
        status: 'SCHEDULED',
        notes: newNotes.trim() || null,
      });

      setAlertMessage({
        type: 'success',
        text: `Cita programada con éxito para el ${newDate} a las ${newTime}.`,
      });
      setNewModalOpen(false);
      setNewNotes('');
      loadData();
    } catch (err: any) {
      console.error('Error al guardar cita:', err);
      setAlertMessage({ type: 'error', text: err.message || 'No se pudo agendar la cita.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Actualizar estado de cita
  const handleUpdateStatus = async (
    newStatus: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ) => {
    if (!selectedAppointment) return;
    try {
      await appointmentService.updateAppointment(selectedAppointment.id, { status: newStatus });
      setAlertMessage({
        type: 'success',
        text: `Estado de la cita actualizado a "${newStatus}".`,
      });
      setDetailModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error al actualizar cita:', err);
      setAlertMessage({ type: 'error', text: 'Error al cambiar estado de la cita.' });
    }
  };

  // Eliminar cita
  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    setIsDeleting(true);
    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);
      setAlertMessage({
        type: 'success',
        text: 'Cita eliminada correctamente de la agenda.',
      });
      setDeleteModalOpen(false);
      setDetailModalOpen(false);
      setAppointmentToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error al eliminar cita:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo eliminar la cita.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Redirigir a Recepción (Fase 10) con datos de la cita
  const handleStartReception = (_apt?: Appointment) => {
    setDetailModalOpen(false);
    navigate(`/admin/ordenes/nueva`);
  };

  // Agrupar citas por fecha (YYYY-MM-DD)
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const apt of appointments) {
      const dateKey = apt.scheduled_at.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(apt);
    }
    return map;
  }, [appointments]);

  // Días del mes actual para renderizar cuadrícula
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajustar para que la semana empiece en Lunes (1)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Días de relleno del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        date: prevDate,
        dateString: prevDate.toISOString().slice(0, 10),
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curDate = new Date(year, month, d);
      days.push({
        date: curDate,
        dateString: curDate.toISOString().slice(0, 10),
        isCurrentMonth: true,
      });
    }

    // Días de relleno del próximo mes para completar filas de 7
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const nextDate = new Date(year, month + 1, i);
        days.push({
          date: nextDate,
          dateString: nextDate.toISOString().slice(0, 10),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [currentDate]);

  // Citas del día seleccionado
  const selectedDayAppointments = appointmentsByDate[selectedDay] || [];

  // Filtrado para la vista de lista
  const filteredListAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const custName = apt.customer?.full_name?.toLowerCase() || '';
      const bikeModel = apt.bicycle ? `${apt.bicycle.brand} ${apt.bicycle.model}`.toLowerCase() : '';
      const serviceName = apt.service_name?.toLowerCase() || '';
      const mechanic = apt.mechanic_name?.toLowerCase() || '';
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !term ||
        custName.includes(term) ||
        bikeModel.includes(term) ||
        serviceName.includes(term) ||
        mechanic.includes(term);

      const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando agenda del taller A2Ruedas..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Agenda y Calendario de Mantenimientos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de citas de taller, aforo diario (máx. {DEFAULT_DAILY_CAPACITY} bicis) y asignación técnica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setNewDate(new Date().toISOString().slice(0, 10));
              setNewModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Agendar Nueva Cita
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type === 'success' ? 'success' : 'error'}
          title={alertMessage.type === 'success' ? 'Éxito' : 'Atención'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Barra de 4 Indicadores Clave (KPIs de Agenda) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">CITAS DE HOY</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {metrics.todayCount} <span className="text-xs font-normal text-slate-400">servicios</span>
          </div>
          <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
            {DEFAULT_DAILY_CAPACITY - metrics.todayCount > 0
              ? `${DEFAULT_DAILY_CAPACITY - metrics.todayCount} cupos libres`
              : 'Aforo completo'}
          </span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">AFORO TALLER HOY</span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {metrics.todayCapacityPercent}%
            </span>
            <Gauge
              className={`w-4 h-4 ${
                metrics.todayCapacityPercent >= 100
                  ? 'text-red-500'
                  : metrics.todayCapacityPercent >= 70
                    ? 'text-amber-500'
                    : 'text-emerald-500'
              }`}
            />
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                metrics.todayCapacityPercent >= 100
                  ? 'bg-red-500'
                  : metrics.todayCapacityPercent >= 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${metrics.todayCapacityPercent}%` }}
            />
          </div>
        </Card>

        <Card className="p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">TOTAL EN EL MES</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {metrics.monthCount} <span className="text-xs font-normal text-slate-400">citas</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Programadas y atendidas</span>
        </Card>

        <Card className="p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">COMPLETADAS</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics.completedMonth}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            Servicios entregados ✓
          </span>
        </Card>
      </div>

      {/* Barra de Control de Navegación y Vistas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Controles de Fechas */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
            <button
              onClick={handlePrev}
              title="Anterior"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border-x border-slate-300 dark:border-slate-700"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              title="Siguiente"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
            {periodTitle}
          </h2>
        </div>

        {/* Selector de Vistas */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setCurrentView('month')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              currentView === 'month'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mes</span>
          </button>
          <button
            onClick={() => setCurrentView('day')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              currentView === 'day'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Día</span>
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              currentView === 'list'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* 1. VISTA DE MES */}
      {currentView === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Cuadrícula de Calendario Mensual */}
          <Card className="lg:col-span-3 p-3 overflow-x-auto">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 mb-2">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
              <div>Dom</div>
            </div>

            {/* Días del Mes */}
            <div className="grid grid-cols-7 gap-1">
              {monthCalendarDays.map((dayItem) => {
                const dayApts = appointmentsByDate[dayItem.dateString] || [];
                const isSelected = selectedDay === dayItem.dateString;
                const isToday =
                  dayItem.dateString === new Date().toISOString().slice(0, 10);
                const activeApts = dayApts.filter((a) => a.status !== 'CANCELLED');
                const isFull = activeApts.length >= DEFAULT_DAILY_CAPACITY;

                return (
                  <div
                    key={dayItem.dateString}
                    onClick={() => setSelectedDay(dayItem.dateString)}
                    className={`min-h-[92px] p-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                        : isToday
                          ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                          : dayItem.isCurrentMonth
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                            : 'border-slate-100 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/50 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono text-[10px]'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {dayItem.date.getDate()}
                      </span>

                      {/* Mini indicador de aforo */}
                      {dayItem.isCurrentMonth && (
                        <span
                          className={`text-[9px] font-mono px-1 rounded ${
                            isFull
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : activeApts.length > 0
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : 'text-slate-300 dark:text-slate-700'
                          }`}
                        >
                          {activeApts.length}/{DEFAULT_DAILY_CAPACITY}
                        </span>
                      )}
                    </div>

                    {/* Badges de citas del día */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {activeApts.slice(0, 2).map((apt) => (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAppointment(apt);
                            setDetailModalOpen(true);
                          }}
                          className={`truncate text-[10px] px-1 py-0.5 rounded font-medium ${
                            apt.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : apt.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                          title={`${apt.customer?.full_name || 'Cita'} - ${apt.service_name}`}
                        >
                          {new Date(apt.scheduled_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          {apt.customer?.full_name?.split(' ')[0]}
                        </div>
                      ))}
                      {activeApts.length > 2 && (
                        <div className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 text-center">
                          +{activeApts.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Panel Lateral: Citas del Día Seleccionado */}
          <div className="space-y-3">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    DÍA SELECCIONADO
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                    {new Date(`${selectedDay}T12:00:00`).toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </h3>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewDate(selectedDay);
                    setNewModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3 h-3" />}
                  className="text-xs"
                >
                  Agendar
                </Button>
              </div>

              {/* Lista de citas del día */}
              {selectedDayAppointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p>No hay citas programadas para este día.</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewDate(selectedDay);
                      setNewModalOpen(true);
                    }}
                    className="text-xs text-blue-600"
                  >
                    + Programar servicio técnico
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {selectedDayAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setDetailModalOpen(true);
                      }}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-blue-400 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(apt.scheduled_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            apt.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : apt.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {apt.customer?.full_name || 'Cliente sin asignar'}
                      </div>

                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {apt.bicycle ? `${apt.bicycle.brand} ${apt.bicycle.model}` : 'Bicicleta en espera'}
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium">
                        🔧 {apt.service_name || 'Mantenimiento General'} • {apt.estimated_duration_min} min
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 2. VISTA DE DÍA */}
      {currentView === 'day' && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Turnos Programados para {periodTitle}
              </span>
              <p className="text-[11px] text-slate-500">
                {selectedDayAppointments.length} servicios agendados hoy.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setNewDate(currentDate.toISOString().slice(0, 10));
                setNewModalOpen(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Agendar en este día
            </Button>
          </div>

          {selectedDayAppointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p>No hay turnos agendados en esta fecha.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                        {new Date(apt.scheduled_at).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({apt.estimated_duration_min} min)
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : apt.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : apt.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 dark:text-white text-sm">
                      {apt.customer?.full_name}
                      <span className="text-xs font-normal text-slate-500 ml-2 font-mono">
                        Tel: {apt.customer?.phone}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 flex items-center gap-3">
                      <span>🚲 {apt.bicycle ? `${apt.bicycle.brand} ${apt.bicycle.model}` : 'Bicicleta no especificada'}</span>
                      <span>🔧 {apt.service_name}</span>
                      <span>👨‍🔧 {apt.mechanic_name || 'Taller General'}</span>
                    </div>

                    {apt.notes && (
                      <p className="text-[11px] text-slate-500 italic">"{apt.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {apt.customer?.phone && (
                      <a
                        href={appointmentService.getWhatsAppConfirmationUrl(apt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                        title="Enviar confirmación a WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedAppointment(apt);
                        setDetailModalOpen(true);
                      }}
                    >
                      Gestionar
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleStartReception(apt)}
                      leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
                    >
                      Recibir Bici
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* 3. VISTA DE LISTA */}
      {currentView === 'list' && (
        <Card className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, bicicleta, servicio o mecánico..."
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Todos los estados</option>
                <option value="SCHEDULED">Agendada</option>
                <option value="IN_PROGRESS">En Taller</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="pb-2">Fecha y Hora</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Bicicleta</th>
                  <th className="pb-2">Servicio Solicitado</th>
                  <th className="pb-2">Mecánico</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredListAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron citas con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredListAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                      <td className="py-2.5 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {new Date(apt.scheduled_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400">
                          {new Date(apt.scheduled_at).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                        {apt.customer?.full_name}
                        <div className="text-[10px] font-normal text-slate-400 font-mono">
                          {apt.customer?.phone}
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">
                        {apt.bicycle ? `${apt.bicycle.brand} ${apt.bicycle.model}` : 'N/A'}
                      </td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        {apt.service_name}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {apt.mechanic_name || 'Taller General'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            apt.status === 'SCHEDULED'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : apt.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : apt.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.customer?.phone && (
                            <a
                              href={appointmentService.getWhatsAppConfirmationUrl(apt)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setDetailModalOpen(true);
                            }}
                          >
                            Ver
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: AGENDAR NUEVA CITA */}
      <Modal
        isOpen={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Agendar Cita de Mantenimiento"
        description="Reserva un turno de atención y asigna un mecánico para el servicio."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              form="appointment-form"
              type="submit"
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Confirmar Agendamiento
            </Button>
          </>
        }
      >
        <form id="appointment-form" onSubmit={handleCreateAppointment} className="space-y-4">
          {/* Alerta de Capacidad Diaria en Tiempo Real */}
          {dailyCapacityInfo && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                dailyCapacityInfo.isFull
                  ? 'border-red-300 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                  : dailyCapacityInfo.percentage >= 70
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 shrink-0" />
                <span>
                  Ocupación para el {newDate}:{' '}
                  <strong>
                    {dailyCapacityInfo.booked} de {dailyCapacityInfo.max} cupos ocupados
                  </strong>
                </span>
              </div>
              <span className="font-bold">{dailyCapacityInfo.percentage}%</span>
            </div>
          )}

          {/* Selección de Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente Propietario *
            </label>
            <select
              required
              value={newCustomerId}
              onChange={(e) => setNewCustomerId(e.target.value)}
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Seleccionar cliente --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Selección de Bicicleta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bicicleta a Intervenir
            </label>
            {customerBicycles.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                {newCustomerId
                  ? 'Este cliente no tiene bicicletas registradas aún (se registrará al ingresar al taller).'
                  : 'Selecciona primero un cliente para ver sus bicicletas.'}
              </p>
            ) : (
              <select
                value={newBicycleId}
                onChange={(e) => setNewBicycleId(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              >
                {customerBicycles.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand} {b.model} ({b.bike_type} - {b.color})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Servicio y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Servicio Técnico Solicitado *
              </label>
              <select
                value={newServiceName}
                onChange={(e) => {
                  setNewServiceName(e.target.value);
                  const matched = COMMON_SERVICES.find((s) => s.name === e.target.value);
                  if (matched) setNewDurationMin(matched.duration);
                }}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              >
                {COMMON_SERVICES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Duración Estimada (minutos)
              </label>
              <select
                value={newDurationMin}
                onChange={(e) => setNewDurationMin(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              >
                <option value={30}>30 min (Express)</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min (1 hora)</option>
                <option value={90}>90 min (1.5 horas)</option>
                <option value={120}>120 min (2 horas)</option>
                <option value={180}>180 min (3 horas)</option>
              </select>
            </div>
          </div>

          {/* Fecha, Hora y Mecánico */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hora de Inicio *
              </label>
              <input
                type="time"
                required
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mecánico Responsable
              </label>
              <select
                value={newMechanic}
                onChange={(e) => setNewMechanic(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
              >
                {AVAILABLE_MECHANICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notas u Observaciones del Cliente
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Ej: Cliente trae sus propios repuestos, solicita revisar ruido..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>

      {/* MODAL: DETALLE Y GESTIÓN DE CITA */}
      {selectedAppointment && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Gestión de Cita de Mantenimiento"
          maxWidth="md"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  setAppointmentToDelete(selectedAppointment);
                  setDeleteModalOpen(true);
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Eliminar Cita
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailModalOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStartReception(selectedAppointment)}
                  leftIcon={<ClipboardCheck className="w-3.5 h-3.5" />}
                >
                  Iniciar Recepción
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Cabecera de Estado y Horario */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {new Date(selectedAppointment.scheduled_at).toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  ({selectedAppointment.estimated_duration_min} min)
                </span>
                <div className="text-[11px] text-slate-500 capitalize">
                  {new Date(selectedAppointment.scheduled_at).toLocaleDateString('es-CO', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  selectedAppointment.status === 'SCHEDULED'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    : selectedAppointment.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : selectedAppointment.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700'
                }`}
              >
                {selectedAppointment.status}
              </span>
            </div>

            {/* Datos del Cliente y Bicicleta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase block">CLIENTE</span>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedAppointment.customer?.full_name}
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Tel: {selectedAppointment.customer?.phone}
                </div>
                {selectedAppointment.customer?.phone && (
                  <a
                    href={appointmentService.getWhatsAppConfirmationUrl(selectedAppointment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold pt-1 hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Enviar mensaje WhatsApp
                  </a>
                )}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-400 text-[10px] uppercase block">BICICLETA</span>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {selectedAppointment.bicycle
                    ? `${selectedAppointment.bicycle.brand} ${selectedAppointment.bicycle.model}`
                    : 'Bicicleta no especificada'}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {selectedAppointment.bicycle?.bike_type} - {selectedAppointment.bicycle?.color}
                </div>
              </div>
            </div>

            {/* Detalles del Servicio y Técnico */}
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex justify-between">
                <span className="text-slate-500">Servicio Programado:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedAppointment.service_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mecánico Asignado:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedAppointment.mechanic_name || 'Taller General'}
                </span>
              </div>
              {selectedAppointment.notes && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Notas:</span>
                  <p className="text-slate-800 dark:text-slate-200 italic">
                    "{selectedAppointment.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Acciones de Cambio de Estado */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                ACTUALIZAR ESTADO DE LA CITA
              </span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={selectedAppointment.status === 'SCHEDULED' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus('SCHEDULED')}
                >
                  Agendada
                </Button>
                <Button
                  size="sm"
                  variant={selectedAppointment.status === 'IN_PROGRESS' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                >
                  En Taller
                </Button>
                <Button
                  size="sm"
                  variant={selectedAppointment.status === 'COMPLETED' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus('COMPLETED')}
                >
                  Completada
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN (REGLA 44) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAppointment}
        title="¿Deseas cancelar y eliminar esta cita?"
        message={`Estás a punto de eliminar la cita de ${appointmentToDelete?.customer?.full_name}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar Cita"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
