/// <reference types="vite-plugin-pwa/react" />

// overwrite vite-plugin-svgr/client to include custom props
declare module "*.svg?react" {
  import * as React from "react";

  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
      customfill?: string;
    }
  >;

  export default ReactComponent;
}

/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />
