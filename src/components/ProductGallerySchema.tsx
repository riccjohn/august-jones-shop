interface ProductItem {
  id: number;
  title: string;
  src: string;
  alt: string;
}

interface ProductGallerySchemaProps {
  products: readonly ProductItem[];
}

export function ProductGallerySchema({ products }: ProductGallerySchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        "@id": `https://www.augustjones.shop/#product-${product.id}`,
        name: product.title,
        image: `https://www.augustjones.shop${product.src}`,
        description: product.alt,
        category: "Apparel & Accessories > Clothing",
        brand: {
          "@type": "Brand",
          name: "August Jones",
        },
        material: "Upcycled Sports Jerseys",
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "Sustainability",
            value: "Upcycled",
          },
          {
            "@type": "PropertyValue",
            name: "Production Method",
            value: "Hand-made",
          },
          {
            "@type": "PropertyValue",
            name: "Uniqueness",
            value: "One-of-a-kind",
          },
        ],
        offers: {
          "@type": "AggregateOffer",
          availability: "https://schema.org/PreOrder",
          priceCurrency: "USD",
          url: "https://www.etsy.com/shop/TheAugustJonesShop",
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
