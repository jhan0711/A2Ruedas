import React, { useRef } from 'react';
import { Printer, Share2 } from 'lucide-react';
import { Button } from '../ui';
import { printDirectHtml } from '../../utils/printUtils';

interface UnifiedTicketViewerProps {
  htmlContent: string;
  onWhatsAppShare?: () => void;
  title?: string;
  hidePrintButton?: boolean;
}

export const UnifiedTicketViewer: React.FC<UnifiedTicketViewerProps> = ({
  htmlContent,
  onWhatsAppShare,
  title = 'Comprobante T\u00e9rmico (58mm)',
  hidePrintButton = false,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    printDirectHtml(htmlContent);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Barra de Herramientas */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {title}
        </h4>
        <div className="flex gap-2">
          {onWhatsAppShare && (
            <Button
              size="sm"
              variant="outline"
              onClick={onWhatsAppShare}
              leftIcon={<Share2 className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              WhatsApp
            </Button>
          )}
          {!hidePrintButton && (
            <Button
              size="sm"
              variant="primary"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-xs"
            >
              Imprimir
            </Button>
          )}
        </div>
      </div>

      {/* Simulador de Rollo T\u00e9rmico */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-slate-100 dark:bg-slate-950">
        <div className="w-[58mm] max-w-full relative shadow-xl shrink-0 h-fit min-h-[150px]">
          {/* Diente de corte superior */}
          <div className="bg-slate-200 dark:bg-slate-800 border-b border-dashed border-slate-400 py-0.5 text-center text-[7px] font-mono text-slate-500 select-none rounded-t-sm">
            - - - CORTE - - -
          </div>
          
          <div className="w-full bg-white relative">
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title="Previsualizaci\u00f3n T\u00e9rmica"
              className="w-full border-0 pointer-events-auto"
              style={{ minHeight: '350px' }}
              onLoad={(e) => {
                const iframe = e.target as HTMLIFrameElement;
                if (iframe.contentWindow?.document.body) {
                  const bodyHeight = iframe.contentWindow.document.body.scrollHeight;
                  iframe.style.height = `${bodyHeight + 20}px`;
                }
              }}
            />
          </div>

          {/* Diente de corte inferior */}
          <div className="bg-slate-200 dark:bg-slate-800 border-t border-dashed border-slate-400 py-0.5 text-center text-[7px] font-mono text-slate-500 select-none rounded-b-sm">
            - - - CORTE - - -
          </div>
        </div>
      </div>
    </div>
  );
};
