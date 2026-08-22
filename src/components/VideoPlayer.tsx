type VideoPlayerProps = {
  url: string;
  title?: string;
};

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
  return (
    <div className="mb-8">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={url}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
