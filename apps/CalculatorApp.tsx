import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLightField } from '../hooks/useLightField';

type Operator = '+' | '-' | '×' | '÷';

const STORAGE_KEY = 'calculator_app_state';

interface CalculatorState {
  displayValue: string;
  previousValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
}

const initialState: CalculatorState = {
  displayValue: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
};


const CalculatorButton: React.FC<{
  onClick: (value: string) => void;
  value: string;
  className?: string;
  label?: string;
}> = ({ onClick, value, className = '', label }) => (
  <button
    onClick={() => onClick(value)}
    className={`light-field-button text-2xl font-medium rounded-full text-outline focus:outline-none focus:ring-2 focus:ring-gray-400 ${className}`}
    aria-label={label || value}
  >
    {value}
  </button>
);

const CalculatorApp: React.FC = () => {
  const { t } = useLanguage();
  const [state, setState] = useState<CalculatorState>(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : initialState;
    } catch (e) {
      return initialState;
    }
  });
  const lightFieldRef = useLightField<HTMLDivElement>();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save calculator state:", e);
    }
  }, [state]);
  
  const { displayValue, previousValue, operator, waitingForOperand } = state;

  const calculate = (val1: number, val2: number, op: Operator): number => {
    switch (op) {
      case '+': return val1 + val2;
      case '-': return val1 - val2;
      case '×': return val1 * val2;
      case '÷': 
        if (val2 === 0) return NaN; // Handle division by zero
        return val1 / val2;
      default: return val2;
    }
  };
  
  const formatResult = (num: number): string => {
    if (isNaN(num)) return t('calculator_error');
    if (!isFinite(num)) return t('calculator_error');
    // Limit decimal places to avoid long numbers
    return String(parseFloat(num.toPrecision(12)));
  }

  const handleInput = (value: string) => {
    if (displayValue === t('calculator_error')) {
      if (value === 'C' || value === 'AC') {
        setState(initialState);
      }
      return;
    }

    if (!isNaN(parseInt(value))) {
       if (displayValue.length >= 15 && !waitingForOperand) return;
      if (waitingForOperand) {
        setState(s => ({ ...s, displayValue: value, waitingForOperand: false }));
      } else {
        setState(s => ({ ...s, displayValue: displayValue === '0' ? value : displayValue + value }));
      }
    } else {
      switch (value) {
        case '.':
          if (waitingForOperand) {
             setState(s => ({ ...s, displayValue: '0.', waitingForOperand: false }));
             return;
          }
          if (!displayValue.includes('.')) {
            setState(s => ({ ...s, displayValue: displayValue + '.' }));
          }
          break;
        case 'C':
          setState(s => ({ ...s, displayValue: '0' }));
          break;
        case 'AC':
          setState(initialState);
          break;
        case '+/-':
          if (displayValue !== '0') {
            setState(s => ({ ...s, displayValue: String(parseFloat(displayValue) * -1) }));
          }
          break;
        case '%':
          setState(s => ({
            ...s,
            displayValue: String(parseFloat(displayValue) / 100),
            waitingForOperand: true,
          }));
          break;
        case '+':
        case '-':
        case '×':
        case '÷':
          const currentValue = parseFloat(displayValue);
          let newState = { ...state };
          if (operator && previousValue !== null && !waitingForOperand) {
            const result = calculate(previousValue, currentValue, operator);
            const formattedResult = formatResult(result);
            newState.displayValue = formattedResult;
            newState.previousValue = formattedResult === t('calculator_error') ? null : result;
          } else {
            newState.previousValue = currentValue;
          }
          newState.waitingForOperand = true;
          newState.operator = value as Operator;
          setState(newState);
          break;
        case '=':
          if (operator && previousValue !== null) {
            const currentValue = parseFloat(displayValue);
            const result = calculate(previousValue, currentValue, operator);
            const formattedResult = formatResult(result);

            setState({
              ...initialState,
              displayValue: formattedResult,
              waitingForOperand: true, // Ready for a new calculation
            });
          }
          break;
      }
    }
  };

  const clearButtonValue = displayValue === '0' && previousValue === null ? 'AC' : 'C';

  return (
    <div className="h-full w-full flex flex-col bg-transparent text-outline -m-4 p-2 space-y-2 select-none">
      <div className="flex-grow flex items-end justify-end p-4 bg-transparent rounded-lg mb-2 overflow-hidden">
        <span
            className="text-7xl font-light text-right break-all transition-all duration-200"
            style={{ fontSize: displayValue.length > 8 ? '3rem' : (displayValue.length > 6 ? '3.75rem' : '4.5rem') }}
        >
            {displayValue}
        </span>
      </div>
      <div
        ref={lightFieldRef}
        className="grid grid-cols-4 grid-rows-5 gap-3 flex-shrink-0 h-[75%] p-1 light-field-container rounded-3xl"
      >
        <CalculatorButton onClick={handleInput} value={clearButtonValue} label={clearButtonValue === 'AC' ? t('calculator_clear_all') : t('calculator_clear')} className="bg-gray-400/50 dark:bg-gray-400/80 !text-black" />
        <CalculatorButton onClick={handleInput} value="+/-" className="bg-gray-400/50 dark:bg-gray-400/80 !text-black" />
        <CalculatorButton onClick={handleInput} value="%" className="bg-gray-400/50 dark:bg-gray-400/80 !text-black" />
        <CalculatorButton onClick={handleInput} value="÷" label={t('calculator_divide')} className="bg-orange-500/90" />

        <CalculatorButton onClick={handleInput} value="7" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="8" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="9" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="×" label={t('calculator_multiply')} className="bg-orange-500/90" />

        <CalculatorButton onClick={handleInput} value="4" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="5" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="6" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="-" label={t('calculator_subtract')} className="bg-orange-500/90" />

        <CalculatorButton onClick={handleInput} value="1" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="2" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="3" className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="+" label={t('calculator_add')} className="bg-orange-500/90" />

        <CalculatorButton onClick={handleInput} value="0" className="col-span-2 bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="." label={t('calculator_decimal')} className="bg-gray-600/20 dark:bg-gray-700/50" />
        <CalculatorButton onClick={handleInput} value="=" label={t('calculator_equals')} className="bg-orange-500/90" />
      </div>
    </div>
  );
};

export default CalculatorApp;