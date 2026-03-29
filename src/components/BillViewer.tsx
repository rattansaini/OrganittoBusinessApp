import { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface BillViewerProps {
  isOpen: boolean;
  onClose: () => void;
  billUrl: string;
  expenseDetails: {
    category: string;
    amount: number;
    date: string;
  };
}

export default function BillViewer({ isOpen, onClose, billUrl, expenseDetails }: BillViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const isPDF = billUrl.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    window.open(billUrl, '_blank');
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-brown/90 backdrop-blur-md">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-soft">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-dark-brown/60">Category</p>
              <p className="font-semibold text-dark-brown">{getCategoryLabel(expenseDetails.category)}</p>
            </div>
            <div className="h-8 w-px bg-dark-brown/20" />
            <div>
              <p className="text-sm text-dark-brown/60">Amount</p>
              <p className="font-bold text-secondary">₹{expenseDetails.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="h-8 w-px bg-dark-brown/20" />
            <div>
              <p className="text-sm text-dark-brown/60">Date</p>
              <p className="font-semibold text-dark-brown">
                {new Date(expenseDetails.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPDF && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-300 disabled:opacity-50 shadow-soft"
              >
                <ZoomOut className="w-5 h-5 text-dark-brown" />
              </button>
              <div className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-soft">
                <span className="font-semibold text-dark-brown">{zoom}%</span>
              </div>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-300 disabled:opacity-50 shadow-soft"
              >
                <ZoomIn className="w-5 h-5 text-dark-brown" />
              </button>
              <button
                onClick={handleRotate}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-all duration-300 shadow-soft"
              >
                <RotateCw className="w-5 h-5 text-dark-brown" />
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="p-3 bg-primary/90 backdrop-blur-sm rounded-lg hover:bg-primary transition-all duration-300 shadow-soft"
          >
            <Download className="w-5 h-5 text-cream" />
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-soft-red/90 backdrop-blur-sm rounded-lg hover:bg-soft-red transition-all duration-300 shadow-soft"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="w-full h-full flex items-center justify-center p-24 overflow-auto">
        {isPDF ? (
          <iframe
            src={billUrl}
            className="w-full h-full bg-white rounded-xl shadow-soft-lg"
            title="Bill PDF"
          />
        ) : (
          <img
            src={billUrl}
            alt="Bill"
            className="max-w-full max-h-full object-contain rounded-xl shadow-soft-lg transition-transform duration-300"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
