import React from "react";

export default function lazyImportComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>
) {
  return async () => {
    const { default: Component } = await importFn();
    return { element: React.createElement(Component) };
  };
}
