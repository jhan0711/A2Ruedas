import React, { useState } from 'react';
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Layers,
  Package,
} from 'lucide-react';
import { ProductCategory, Product } from '../../types/database';
import { inventoryService } from '../../services/inventoryService';
import { Modal, Button, Input, ConfirmModal } from '../ui';
import { useToast } from '../../context/ToastContext';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  products: Product[];
  onCategoriesUpdated: () => void;
  onCategoryCreated?: (newCategory: ProductCategory) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onCategoriesUpdated,
  onCategoryCreated,
}) => {
  const { success, error } = useToast();

  // Estado para crear nueva categoría
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Estado para edición inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Estado para eliminación
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Contar productos por categoría
  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  // Crear categoría
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('El nombre de la categoría es obligatorio.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      const created = await inventoryService.createCategory({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
      });

      success(`La categoría "${created.name}" fue registrada exitosamente.`, 'Categoría Creada');

      setNewName('');
      setNewDescription('');
      onCategoriesUpdated();

      if (onCategoryCreated) {
        onCategoryCreated(created);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al crear categoría.';
      setCreateError(msg);
      error(msg, 'Error al Crear');
    } finally {
      setIsCreating(false);
    }
  };

  // Iniciar edición
  const startEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  // Guardar edición
  const handleUpdateCategory = async (id: string) => {
    if (!editName.trim()) {
      error('El nombre de la categoría no puede estar vacío.', 'Nombre requerido');
      return;
    }

    setIsUpdating(true);
    try {
      await inventoryService.updateCategory(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });

      success(`Los cambios en "${editName.trim()}" fueron guardados.`, 'Categoría Actualizada');

      setEditingId(null);
      onCategoriesUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar categoría.';
      error(msg, 'Error al Actualizar');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirmar y eliminar categoría
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    const count = getProductCount(deletingCategory.id);
    if (count > 0) {
      error(`No se puede eliminar porque contiene ${count} producto(s) asignado(s).`, 'Categoría en uso');
      setDeletingCategory(null);
      return;
    }

    setIsDeleting(true);
    try {
      await inventoryService.deleteCategory(deletingCategory.id);
      success(`La categoría "${deletingCategory.name}" ha sido eliminada.`, 'Categoría Eliminada');
      setDeletingCategory(null);
      onCategoriesUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo eliminar la categoría.';
      error(msg, 'Error de Eliminación');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestión de Categorías y Departamentos"
        description="Administra los departamentos del catálogo (Bicicletas, E-Bikes, Ropa, Nutrición, Repuestos y Servicios)."
        maxWidth="lg"
        footer={
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Formulario de Creación Rápida */}
          <form
            onSubmit={handleCreateCategory}
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              Nueva Categoría de Catálogo
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre de la Categoría *"
                placeholder="Ej. Bicicletas Eléctricas, Ropa, Cascos..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />

              <Input
                label="Descripción Corta (Opcional)"
                placeholder="Ej. Modelos urbanos asistidos y accesorios"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            {createError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                isLoading={isCreating}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Agregar Categoría
              </Button>
            </div>
          </form>

          {/* Listado de Categorías Existentes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                Categorías Registradas ({categories.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                Las categorías vacías pueden eliminarse con seguridad.
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No hay categorías configuradas. Crea la primera arriba.
                </div>
              ) : (
                categories.map((cat) => {
                  const productCount = getProductCount(cat.id);
                  const isEditing = editingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {isEditing ? (
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre de categoría"
                              className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Descripción (opcional)"
                              className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCategory(cat.id)}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isUpdating}
                              className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-medium flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {cat.slug || cat.id}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              productCount > 0
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                            title={`${productCount} producto(s) asignados`}
                          >
                            <Package className="w-3 h-3" />
                            {productCount} {productCount === 1 ? 'prod.' : 'prods.'}
                          </span>

                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                            title="Editar nombre o descripción"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCategory(cat)}
                            disabled={productCount > 0}
                            className={`p-1.5 rounded transition-colors ${
                              productCount > 0
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600'
                            }`}
                            title={
                              productCount > 0
                                ? `No se puede eliminar: tiene ${productCount} productos`
                                : 'Eliminar categoría vacía'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Eliminar Categoría */}
      <ConfirmModal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteCategory}
        title="¿Eliminar Categoría?"
        message={`¿Estás seguro de que deseas eliminar permanentemente la categoría "${deletingCategory?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Categoría"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
