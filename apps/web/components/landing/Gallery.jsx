import { galleryContent } from '@/data/landing/galleryContent';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function Gallery({ content = galleryContent }) {
  const data = content || galleryContent;
  return (
    <div className="gallery-strip">
      {(data.images || []).map((image) => (
        <img key={image.id} src={resolveAssetUrl(image.image, '')} alt={image.alt} />
      ))}
    </div>
  );
}
