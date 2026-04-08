import { useState } from 'react';
import { KurukinPlayer } from 'kurukin-video-player';

export const DemoPage = () => {
  const [videoTime, setVideoTime] = useState(0);

  return (
    <div className="min-h-screen bg-[#0B0F19] px-4 text-slate-100">
      <div className="flex w-full max-w-4xl mx-auto flex-col items-center gap-16 py-12">
        <section className="w-full">
          <h1 className="mb-4 text-center text-3xl font-extrabold text-white">Motor Legacy (YouTube)</h1>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
            <KurukinPlayer
              provider="youtube"
              videoId="aQhTmuZiKOY"
              vslMode={true}
              resumePlayback={true}
              onTimeUpdate={(time) => setVideoTime(time)}
            />
          </div>
        </section>

        <section className="w-full">
          <h2 className="mb-4 text-center text-3xl font-extrabold text-cyan-300">Motor VSL Premium (Bunny HLS)</h2>
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
            <KurukinPlayer
              provider="bunnynet"
              videoId="https://vz-1623229a-088.b-cdn.net/050dc885-438e-4715-a1d6-6790f5afc451/playlist.m3u8"
              vslMode={true}
              resumePlayback={true}
              onTimeUpdate={(time) => setVideoTime(time)}
            />
          </div>
          <div className="mt-4 text-center font-mono text-green-400">Tiempo actual del VSL: {Math.floor(videoTime)}s</div>
        </section>
      </div>
    </div>
  );
};
