import React from 'react';
import { useTheme } from '@/context/ThemeContext';

/**
 * This component demonstrates how to use the theme colors in a component.
 * It serves as an example for how to use the theme system in other components.
 */
const ThemeExample: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div className="p-6 bg-bg-secondary rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Theme Example</h2>
      
      <div className="mb-6">
        <p className="mb-2">Current theme: <span className="font-semibold">{theme}</span></p>
        <button 
          onClick={toggleTheme} 
          className="btn-primary"
        >
          Toggle Theme
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Text Colors</h3>
        <p className="text-text-primary mb-2">This text uses the primary text color</p>
        <p className="text-text-secondary mb-2">This text uses the secondary text color</p>
        <p className="text-text-muted">This text uses the muted text color</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Background Colors</h3>
        <div className="flex flex-col gap-2">
          <div className="p-4 bg-bg-primary border border-gray-200 dark:border-secondary-300 rounded">
            Primary Background
          </div>
          <div className="p-4 bg-bg-secondary border border-gray-200 dark:border-secondary-300 rounded">
            Secondary Background
          </div>
          <div className="p-4 bg-bg-tertiary border border-gray-200 dark:border-secondary-300 rounded">
            Tertiary Background
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">UI Element Colors</h3>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">Primary Button</button>
          <button className="btn-secondary">Secondary Button</button>
          <button className="btn-success">Success Button</button>
          <button className="btn-danger">Danger Button</button>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Color Palette</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(colors.primary).map(([shade, color]) => (
            <div key={`primary-${shade}`} className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full mb-1" 
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs">{shade}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 p-4 border border-gray-200 dark:border-secondary-300 rounded bg-bg-tertiary">
        <h3 className="text-lg font-semibold mb-2">Using Theme Colors in Components</h3>
        <p className="text-sm mb-2">
          1. Use Tailwind classes with semantic color names:
          <code className="block bg-bg-primary p-2 rounded mt-1 text-xs">
            {'<div className="text-text-primary bg-bg-secondary">Content</div>'}
          </code>
        </p>
        <p className="text-sm mb-2">
          2. Use the colors object from useTheme for dynamic styles:
          <code className="block bg-bg-primary p-2 rounded mt-1 text-xs">
            {'const { colors } = useTheme();'}<br />
            {'<div style={{ borderColor: colors.primary[300] }}>Content</div>'}
          </code>
        </p>
      </div>
    </div>
  );
};

export default ThemeExample;
