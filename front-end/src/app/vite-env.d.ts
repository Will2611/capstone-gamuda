/// <reference types="vite-plugin-pwa/react" />

// first come first serve, overwrite vite-plugin-svgr/client to include custom props
declare module "*.svg?react" {
  import * as React from "react";

  const ReactComponent: React.FunctionComponent<
    React.ComponentProps<"svg"> & {
      title?: string;
      titleId?: string;
      desc?: string;
      descId?: string;
      //certain pins may have custom colours, defined in vite.config
      customfill?: string;
      size?: number;
    }
  >;

  export default ReactComponent;
}

/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite/client" />
