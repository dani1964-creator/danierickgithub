import { Calculator } from 'lucide-react';

interface FinancingCardProps {
  price: number;
  downPaymentPercentage?: number;
  maxInstallments?: number;
  interestRate?: number;
  isDarkMode?: boolean;
}

export const FinancingCard = ({
  price,
  downPaymentPercentage = 20,
  maxInstallments = 360,
  interestRate = 9.00,
  isDarkMode = false
}: FinancingCardProps) => {
  
  // Calcular entrada
  const downPayment = (price * downPaymentPercentage) / 100;
  
  // Calcular valor financiado
  const financedAmount = price - downPayment;
  
  // Calcular parcela usando Tabela Price
  // PMT = PV * [i * (1 + i)^n] / [(1 + i)^n - 1]
  const monthlyRate = interestRate / 100 / 12; // Taxa mensal
  const installmentValue = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, maxInstallments)) / (Math.pow(1 + monthlyRate, maxInstallments) - 1);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={`rounded-xl p-4 border-2 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/30' 
        : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'
    } transition-all duration-300`}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
          Simulação de Financiamento
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* Entrada */}
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            💰 Entrada a partir de
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(downPayment)}
            <span className={`text-xs font-normal ml-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ({downPaymentPercentage}%)
            </span>
          </p>
        </div>
        
        {/* Parcelas */}
        <div>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            📅 Parcelas em até
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {maxInstallments}x de {formatCurrency(installmentValue)}
          </p>
        </div>
        
        {/* Nota */}
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} italic pt-2 border-t ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          *Valores aproximados. Taxa de {interestRate}% a.a. Consulte condições com o corretor.
        </p>
      </div>
    </div>
  );
};
