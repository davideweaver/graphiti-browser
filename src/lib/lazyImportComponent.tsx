import React from "react";

export default function lazyImportComponent(
  importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>
) {
  return async () => {
    const { default: Component } = await importFn();
    return { element: React.createElement(Component) };
  };
}
