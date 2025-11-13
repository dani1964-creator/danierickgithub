import { CreditCard, Check } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';

interface PaymentMethodsProps {
  type: 'none' | 'text' | 'banner';
  methods?: string[];
  bannerUrl?: string;
  isDarkMode?: boolean;
  primaryColor?: string;
}

export const PaymentMethods = ({
  type,
  methods = [],
  bannerUrl,
  isDarkMode = false,
  primaryColor = '#2563eb'
}: PaymentMethodsProps) => {
  
  if (type === 'none') return null;

  return (
    <div className={`rounded-xl p-6 ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    } shadow-sm transition-colors duration-300`}>
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Formas de Pagamento
        </h3>
      </div>
      
      {type === 'text' && methods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {methods.map((method, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              } transition-all duration-200 hover:scale-105`}
            >
              <div 
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {method}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {type === 'banner' && bannerUrl && (
        <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden shadow-lg">
          <SafeImage
            src={bannerUrl}
            alt="Formas de Pagamento"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            fallbackColor={primaryColor}
          />
        </div>
      )}
    </div>
  );
};
