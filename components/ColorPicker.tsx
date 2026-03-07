'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  '#7C3AED', // Purple
  '#4F46E5', // Indigo
  '#3B82F6', // Blue
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#22C55E', // Green
  '#EAB308', // Yellow
  '#F97316', // Orange
  '#EF4444', // Red
  '#EC4899', // Pink
  '#6366F1', // Violet
  '#8B5CF6', // Violet
  '#1F2937', // Gray
  '#6B7280', // Gray
  '#9CA3AF', // Gray
  '#FFFFFF', // White
];

export default function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [showCustom, setShowCustom] = useState(!presetColors.includes(value));

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setShowCustom(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value.toUpperCase();
    setCustomColor(newColor);
    onChange(newColor);
    setShowCustom(true);
  };

  const isValidHex = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Current Color Display */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            if (isValidHex(val) || val === '#') {
              onChange(val);
            }
          }}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
          placeholder="#FFFFFF"
          maxLength={7}
        />
      </div>

      {/* Preset Colors */}
      <div className="grid grid-cols-8 gap-2">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
              value === color
                ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          >
            {value === color && (
              <Check className="w-4 h-4 text-white drop-shadow-md mx-auto my-1.5" />
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400">직접 입력:</label>
        <input
          type="color"
          value={value}
          onChange={handleCustomChange}
          className="w-16 h-10 rounded cursor-pointer border-2 border-gray-300 dark:border-gray-600"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          색상을 선택하거나 HEX 코드를 입력하세요
        </span>
      </div>
    </div>
  );
}
