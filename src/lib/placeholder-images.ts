import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

export const defaultImage: ImagePlaceholder = {
  id: 'default',
  description: 'Default placeholder image',
  imageUrl: 'https://picsum.photos/seed/default/400/400',
  imageHint: 'placeholder',
};

export function findImage(id: string): ImagePlaceholder {
    return PlaceHolderImages.find(img => img.id === id) || defaultImage;
}
