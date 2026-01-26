import { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react';
import { ExpressionParser, EXPRESSION_TEMPLATES } from '../../services/expressionParser';

export interface Condition {
  id: string;
  type: 'expression';
  expression: string;
  description: string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

interface ConditionBuilderProps {
  value: ConditionGroup;
  onChange: (value: ConditionGroup) => void;
  title: string;
  type: 'entry' | 'exit';
}

export default function ConditionBuilder({ value, onChange, title, type }: ConditionBuilderProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const addCondition = () => {
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      type: 'expression',
      expression: '',
      description: ''
    };

    onChange({
      ...value,
      conditions: [...value.conditions, newCondition]
    });
  };

  const removeCondition = (id: string) => {
    onChange({
      ...value,
      conditions: value.conditions.filter(c => c.id !== id)
    });
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    onChange({
      ...value,
      conditions: value.conditions.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    });
  };

  const duplicateCondition = (condition: Condition) => {
    const newCondition: Condition = {
      ...condition,
      id: `cond_${Date.now()}`,
      description: `${condition.description} (Copy)`
    };

    onChange({
      ...value,
      conditions: [...value.conditions, newCondition]
    });
  };

  const addTemplateCondition = (templateKey: string) => {
    const template = EXPRESSION_TEMPLATES[templateKey as keyof typeof EXPRESSION_TEMPLATES];
    const newCondition: Condition = {
      id: `cond_${Date.now()}`,
      type: 'expression',
      expression: template.expression,
      description: template.description
    };

    onChange({
      ...value,
      conditions: [...value.conditions, newCondition]
    });
    setShowTemplates(false);
  };

  const toggleOperator = () => {
    onChange({
      ...value,
      operator: value.operator === 'AND' ? 'OR' : 'AND'
    });
  };

  // Group templates by category
  const templateCategories = {
    'RSI Conditions': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('RSI_')),
    'EMA Crossovers': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('EMA_') || key.startsWith('PRICE_')),
    'MACD Conditions': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('MACD_')),
    'Bollinger Bands': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('BB_')),
    'Volume Conditions': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('VOLUME_') || key.startsWith('ABOVE_')),
    'Price Action': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('BULLISH_') || key.startsWith('BEARISH_') || key.startsWith('HIGHER_') || key.startsWith('LOWER_')),
    'Profit/Loss': Object.entries(EXPRESSION_TEMPLATES).filter(([key]) => key.startsWith('PROFIT_') || key.startsWith('STOP_'))
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          {value.conditions.length > 1 && (
            <button
              onClick={toggleOperator}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                value.operator === 'AND'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              {value.operator}
            </button>
          )}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            Templates <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={addCondition}
            className="px-3 py-1 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Condition
          </button>
        </div>
      </div>

      {/* Template Picker */}
      {showTemplates && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Choose a Template</h4>
          {Object.entries(templateCategories).map(([category, templates]) => (
            templates.length > 0 && (
              <div key={category} className="mb-4">
                <h5 className="text-xs font-medium text-gray-600 mb-2">{category}</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {templates.map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => addTemplateCondition(key)}
                      className="text-left p-2 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                    >
                      <div className="text-xs font-medium text-gray-800">{template.description}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{template.expression}</div>
                    </button>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Conditions List */}
      <div className="space-y-3">
        {value.conditions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conditions added yet</p>
            <p className="text-xs mt-1">Click "Add Condition" or choose a template to get started</p>
          </div>
        ) : (
          value.conditions.map((condition, index) => (
            <ConditionItem
              key={condition.id}
              condition={condition}
              index={index}
              showOperator={index < value.conditions.length - 1}
              operator={value.operator}
              onUpdate={updateCondition}
              onRemove={removeCondition}
              onDuplicate={duplicateCondition}
            />
          ))
        )}
      </div>

      {/* Quick Reference Guide */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-xs font-semibold text-blue-900 mb-2">💡 Quick Reference</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-800">
          <div>
            <strong>Indicators:</strong><br />
            EMA9, EMA20, RSI, MACD
          </div>
          <div>
            <strong>Operators:</strong><br />
            {'>'},  {'<'},  {'>='},  {'<='},  ==,  !=
          </div>
          <div>
            <strong>Math:</strong><br />
            +,  -,  *,  /,  %,  ( )
          </div>
          <div>
            <strong>Logic:</strong><br />
            AND,  OR,  NOT
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-700">
          <strong>Examples:</strong> RSI {'<'} 30 • EMA9 {'>'} EMA20 • VOLUME {'>'} VOLUME_AVG * 2 • PROFIT {'>='} 5
        </div>
      </div>
    </div>
  );
}

interface ConditionItemProps {
  condition: Condition;
  index: number;
  showOperator: boolean;
  operator: 'AND' | 'OR';
  onUpdate: (id: string, updates: Partial<Condition>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (condition: Condition) => void;
}

function ConditionItem({
  condition,
  index,
  showOperator,
  operator,
  onUpdate,
  onRemove,
  onDuplicate
}: ConditionItemProps) {
  const validation = ExpressionParser.validate(condition.expression);
  const usedIndicators = condition.expression ? ExpressionParser.getUsedIndicators(condition.expression) : [];

  return (
    <div className="relative">
      <div className={`border rounded-lg p-4 ${
        validation.valid && condition.expression
          ? 'border-green-300 bg-green-50'
          : condition.expression
          ? 'border-red-300 bg-red-50'
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>

          <div className="flex-1 space-y-3">
            {/* Description */}
            <input
              type="text"
              placeholder="Description (e.g., 'RSI oversold condition')"
              value={condition.description}
              onChange={(e) => onUpdate(condition.id, { description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            {/* Expression */}
            <div className="relative">
              <input
                type="text"
                placeholder="Expression (e.g., 'RSI < 30 AND VOLUME > VOLUME_AVG * 2')"
                value={condition.expression}
                onChange={(e) => onUpdate(condition.id, { expression: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 ${
                  validation.valid && condition.expression
                    ? 'border-green-400'
                    : condition.expression
                    ? 'border-red-400'
                    : 'border-gray-300'
                }`}
              />
              <div className="absolute right-2 top-2">
                {condition.expression && (
                  validation.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )
                )}
              </div>
            </div>

            {/* Validation Error */}
            {condition.expression && !validation.valid && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {validation.error}
              </div>
            )}

            {/* Used Indicators */}
            {usedIndicators.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {usedIndicators.map(indicator => (
                  <span key={indicator} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {indicator}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex flex-col gap-1">
            <button
              onClick={() => onDuplicate(condition)}
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
              title="Duplicate"
            >
              <Copy className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onRemove(condition.id)}
              className="p-1.5 rounded hover:bg-red-100 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Operator Connector */}
      {showOperator && (
        <div className="flex items-center justify-center py-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            operator === 'AND'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {operator}
          </span>
        </div>
      )}
    </div>
  );
}
