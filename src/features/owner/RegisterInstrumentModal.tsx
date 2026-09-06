import React, { useState } from 'react';
import { InstrumentType } from '../../types';
import { store } from '../../services/store';
import { Button } from '../../design-system/Button';
import { useToast } from '../../design-system/Toast';
import { X, Scale, MapPin } from 'lucide-react';

export interface RegisterInstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (instrumentId: string) => void;
}

export const RegisterInstrumentModal: React.FC<RegisterInstrumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [instrumentType, setInstrumentType] = useState<InstrumentType>('weighing_scale');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('Class III (Medium)');
  const [installationSiteAddress, setInstallationSiteAddress] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !serialNumber || !capacity || !installationSiteAddress) {
      showToast('error', 'Missing fields', 'Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    const res = store.registerInstrument({
      instrumentType,
      make,
      model,
      serialNumber,
      capacity,
      accuracyClass,
      installationSiteAddress,
    });
    setLoading(false);

    if (!res.success) {
      showToast('error', 'Registration Failed', res.error);
      return;
    }

    showToast(
      'success',
      'Instrument Registered',
      `Assigned to ${store.resolveJurisdictionFromAddress(installationSiteAddress).name} based on address.`
    );
    onSuccess(res.instrument!.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0F2A4A]/50 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-[#DCE3ED] shadow-xl max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#DCE3ED] bg-[#FAFBFD] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#0F2A4A]" />
            <h2 className="text-base font-semibold text-[#0F2A4A]">
              Register Commercial Instrument
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8A93A3] hover:text-[#1A1F29] hover:bg-[#DCE3ED]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#1A1F29] mb-1">
              Instrument Category *
            </label>
            <select
              value={instrumentType}
              onChange={(e) => setInstrumentType(e.target.value as InstrumentType)}
              className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] bg-white text-sm"
            >
              <option value="weighing_scale">Weighing Scale / Electronic Balance</option>
              <option value="fuel_dispenser">Fuel Dispensing Pump (Petrol / Diesel / CNG)</option>
              <option value="taxi_meter">Taxi / Auto-Rickshaw Fare Meter</option>
              <option value="water_meter">Commercial Bulk / Domestic Water Meter</option>
              <option value="other">Other Regulated Measuring Instrument</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#1A1F29] mb-1">
                Manufacturer Make *
              </label>
              <input
                type="text"
                placeholder="e.g. Sartorius, Essae, Mettler"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-[#1A1F29] mb-1">
                Model Number *
              </label>
              <input
                type="text"
                placeholder="e.g. DS-215, Entris II"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-[#1A1F29] mb-1">
                Serial Number (Must be Unique) *
              </label>
              <input
                type="text"
                placeholder="e.g. SN-2026-9921"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] text-sm font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-[#1A1F29] mb-1">
                Capacity Range *
              </label>
              <input
                type="text"
                placeholder="e.g. 0 - 30 kg, 50 L/min"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-medium text-[#1A1F29] mb-1">
                Accuracy Class
              </label>
              <select
                value={accuracyClass}
                onChange={(e) => setAccuracyClass(e.target.value)}
                className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] bg-white text-sm"
              >
                <option value="Class I (Special)">Class I (Special Precision)</option>
                <option value="Class II (Fine)">Class II (Fine)</option>
                <option value="Class III (Medium)">Class III (Medium Commercial)</option>
                <option value="Class 0.5">Class 0.5 (Petroleum)</option>
                <option value="Class 1.0">Class 1.0 (Taxi Meter)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#1A1F29] mb-1 flex items-center justify-between">
              <span>Installation Site Address (Used to auto-derive Jurisdiction) *</span>
              <span className="text-[10px] text-[#4B7BAE]">e.g. include pincode 110006 for North Delhi</span>
            </label>
            <textarea
              rows={2}
              placeholder="Shop No. / Site address, Market, Pincode..."
              value={installationSiteAddress}
              onChange={(e) => setInstallationSiteAddress(e.target.value)}
              className="w-full px-3 py-2 border border-[#DCE3ED] rounded focus:outline-none focus:border-[#0F2A4A] text-sm"
              required
            />
          </div>

          <div className="p-3 bg-[#FAFBFD] border border-[#DCE3ED] rounded flex items-start gap-2 text-[11px] text-[#5B6472]">
            <MapPin className="w-4 h-4 text-[#4B7BAE] shrink-0 mt-0.5" />
            <span>
              <strong>Automatic Jurisdiction Mapping:</strong> MaapSetu uses the installation address and postal code to assign jurisdiction (e.g. North Delhi DL-01, South Delhi DL-02).
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE3ED]">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Register Instrument
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
