import React from 'react';
import Layout from '@/components/Layout';
import ThemeExample from '@/components/ThemeExample';

/**
 * This page showcases the theme system and serves as documentation
 * for how to use the centralized theme colors.
 */
const ThemeExamplePage: React.FC = () => {
  return (
    <Layout title="Theme Example">
      <header className="bg-bg-secondary shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-text-primary">
            Theme System
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Centralized Theme Colors</h2>
            <p className="text-text-secondary">
              This page demonstrates the centralized theme system that allows you to define all colors in one place.
              The theme system supports both light and dark modes, and you can easily switch between them using the toggle in the top right corner.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-text-secondary mb-4">
              The theme system is built on top of Tailwind CSS and uses CSS variables to define colors.
              All colors are defined in <code className="bg-bg-tertiary px-1 py-0.5 rounded">src/theme/themeConfig.ts</code> and can be easily modified in one place.
            </p>
            <p className="text-text-secondary">
              The theme context provides access to the current theme and colors throughout the application.
              You can use the <code className="bg-bg-tertiary px-1 py-0.5 rounded">useTheme</code> hook to access the theme and colors in any component.
            </p>
          </div>

          <ThemeExample />

          <div className="mt-8 p-6 bg-bg-secondary rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Customizing Colors</h2>
            <p className="text-text-secondary mb-4">
              To customize the colors, edit the <code className="bg-bg-tertiary px-1 py-0.5 rounded">src/theme/themeConfig.ts</code> file.
              This file contains all color definitions for both light and dark modes.
            </p>
            <p className="text-text-secondary">
              After modifying the colors, the changes will be applied throughout the application automatically.
              No need to search and replace colors in multiple files!
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default ThemeExamplePage;
