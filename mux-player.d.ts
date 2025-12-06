declare module "@mux/mux-player-react" {
  import * as React from "react";

  export interface MuxPlayerProps extends React.HTMLAttributes<HTMLElement> {
    streamType?: "on-demand" | "live";
    playbackId?: string;
    metadata?: {
      video_id?: string;
      video_title?: string;
      [key: string]: any;
    };
    autoPlay?: boolean | string;
    [key: string]: any;
  }

  const MuxPlayer: React.ForwardRefExoticComponent<
    MuxPlayerProps & React.RefAttributes<HTMLElement>
  >;
  export default MuxPlayer;
}

