import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

const defaultSEO = {
    title: "Say It English | آموزش آنلاین زبان انگلیسی",
    description: "بهترین پلتفرم آموزش زبان انگلیسی با پادکست، ویدیو و کلاس‌های آنلاین",
    keywords: "آموزش زبان, انگلیسی, آیلتس, تافل, پادکست انگلیسی, یادگیری زبان",
    image: "https://say-it-english.vercel.app/og-image.jpg", // Replace with real image later
    url: "https://say-it-english.vercel.app",
    type: "website"
};

export function SEO({
    title = defaultSEO.title,
    description = defaultSEO.description,
    keywords = defaultSEO.keywords,
    image = defaultSEO.image,
    url = defaultSEO.url,
    type = defaultSEO.type
}: SEOProps) {
    const siteTitle = title === defaultSEO.title ? title : `${title} | Say It English`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Canonical Link */}
            <link rel="canonical" href={url} />
        </Helmet>
    );
}
