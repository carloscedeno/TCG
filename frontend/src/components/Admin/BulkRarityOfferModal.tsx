import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { adminApplyDiscountByRarity, adminClearDiscountByRarity, fetchDistinctRarities, fetchDistinctCardTypes } from '../../utils/api';

interface BulkRarityOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gameCode?: string;
}

export const BulkRarityOfferModal: React.FC<BulkRarityOfferModalProps> = ({ isOpen, onClose, onSuccess, gameCode }) => {
  const [selectedGameCode, setSelectedGameCode] = useState<string>('MTG');
  const [rarity, setRarity] = useState<string>('ALL');
  const [rarityOptions, setRarityOptions] = useState<string[]>([]);
  const [cardType, setCardType] = useState<string>('ALL');
  const [cardTypeOptions, setCardTypeOptions] = useState<string[]>([]);
  
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [endDate, setEndDate] = useState<string>('');
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [includeFoil, setIncludeFoil] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync selectedGameCode with prop when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialGame = gameCode || 'MTG';
      setSelectedGameCode(initialGame);
    }
  }, [isOpen, gameCode]);

  // Load distinct rarities and card types for the selected game
  useEffect(() => {
    if (!isOpen) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      setError(null);
      try {
        const [rarities, types] = await Promise.all([
          fetchDistinctRarities(selectedGameCode),
          fetchDistinctCardTypes(selectedGameCode)
        ]);
        setRarityOptions(rarities);
        setCardTypeOptions(types);
        
        // Reset selections to ALL by default
        setRarity('ALL');
        setCardType('ALL');
      } catch (err: any) {
        console.error('Failed to load options:', err);
        setError('No se pudieron cargar las opciones para este juego.');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [isOpen, selectedGameCode]);

  if (!isOpen) return null;

  const isFilterValid = (rarity && rarity !== 'ALL') || (cardType && cardType !== 'ALL');

  const getTargetDescription = () => {
    const parts = [];
    if (rarity && rarity !== 'ALL') parts.push(`rareza "${rarity}"`);
    if (cardType && cardType !== 'ALL') parts.push(`tipo "${cardType}"`);
    if (parts.length === 0) return 'todas las cartas';
    return parts.join(' y ');
  };

  const handleApply = async () => {
    if (discountPercentage <= 0 || discountPercentage > 100) {
      setError("El porcentaje de descuento debe ser mayor a 0 y menor o igual a 100.");
      return;
    }
    if (!isFilterValid) {
      setError("Debe seleccionar al menos una Rareza o un Tipo de Carta específico.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Construct UTC-4 date if selected, otherwise null for permanent discount
      const fullEndDate = endDate ? `${endDate}T23:59:59.999-04:00` : null;
      
      const res = await adminApplyDiscountByRarity(
        rarity === 'ALL' ? null : rarity, 
        discountPercentage, 
        fullEndDate, 
        overwriteExisting, 
        includeFoil, 
        selectedGameCode,
        cardType === 'ALL' ? null : cardType
      );

      if (!res.success) throw new Error(res.message);
      
      alert(`¡Éxito! Se actualizaron ${res.updated_count} cartas con ${getTargetDescription()}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error aplicando el descuento masivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    if (!isFilterValid) {
      setError("Debe seleccionar al menos una Rareza o un Tipo de Carta específico para remover descuentos.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR TODOS los descuentos para las cartas de ${getTargetDescription()} en ${selectedGameCode}?`)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await adminClearDiscountByRarity(
        rarity === 'ALL' ? null : rarity, 
        selectedGameCode,
        cardType === 'ALL' ? null : cardType
      );
      if (!res.success) throw new Error(res.message);
      
      alert(`¡Éxito! Se eliminaron los descuentos de ${res.updated_count} cartas (${getTargetDescription()}).`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error eliminando el descuento masivo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-geeko-dark rounded-xl max-w-lg w-full border border-purple-500/30 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-geeko-darker relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-50"></div>
          <h2 className="text-xl font-black text-white flex items-center relative z-10">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Ofertas por Rareza / Tipo (Masivo)
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-md flex items-start text-sm">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 mb-6">
            <p className="text-gray-300 text-sm">
              Aplica un descuento simultáneo a las cartas filtrando por <strong>rareza</strong>, <strong>tipo de carta</strong> o una combinación de ambos.
            </p>
          </div>

          <div className="space-y-5">
            {/* Game Selector */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-1">
                Selecciona el Juego
              </label>
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-purple-500"
                value={selectedGameCode}
                onChange={(e) => setSelectedGameCode(e.target.value)}
              >
                <option value="MTG">Magic: The Gathering (MTG)</option>
                <option value="POKEMON">Pokémon (PKM)</option>
                <option value="OPC">One Piece (OPC)</option>
              </select>
            </div>

            {/* Rarity & Card Type Selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Rareza</span>
                  {loadingOptions && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                </label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 text-sm"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="ALL">-- Todas las rarezas --</option>
                  {rarityOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Tipo de Carta</span>
                  {loadingOptions && <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />}
                </label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50 text-sm"
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  disabled={loadingOptions}
                >
                  <option value="ALL">-- Todos los tipos --</option>
                  {cardTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  % Descuento
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">
                  Fecha Finalización (Opcional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="bg-purple-900/10 border border-purple-500/20 rounded-md p-3 space-y-3">
              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-gray-900 checked:bg-purple-600 checked:border-purple-600 focus:outline-none transition-colors"
                  />
                  <svg className={`absolute w-3 h-3 text-white pointer-events-none transition-opacity ${overwriteExisting ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="block text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                    Sobreescribir Ofertas Individuales
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    Si se marca, eliminará las ofertas manuales que ya tengan cartas seleccionadas.
                  </span>
                </div>
              </label>

              <label className="flex items-start cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={includeFoil}
                    onChange={(e) => setIncludeFoil(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-gray-600 rounded bg-gray-900 checked:bg-purple-600 checked:border-purple-600 focus:outline-none transition-colors"
                  />
                  <svg className={`absolute w-3 h-3 text-white pointer-events-none transition-opacity ${includeFoil ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="block text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                    Incluir Cartas Foil / Etched
                  </span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    Por seguridad, solo se aplica a versiones Non-Foil por defecto. Marca esto para incluir TODAS las versiones.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center gap-3">
          <button
            onClick={handleClear}
            disabled={isSubmitting || !isFilterValid || loadingOptions}
            className="flex-1 py-2 bg-red-500/10 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-500 rounded-md font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Quitar Descuentos
          </button>
          
          <button
            onClick={handleApply}
            disabled={isSubmitting || discountPercentage <= 0 || !isFilterValid || loadingOptions}
            className="flex-1 flex justify-center items-center py-2 bg-geeko-cyan text-geeko-dark font-black rounded-md hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Aplicar {discountPercentage > 0 ? `${discountPercentage}%` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

