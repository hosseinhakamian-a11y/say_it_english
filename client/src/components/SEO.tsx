import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    type?: "website" | "article" | "course"; // Improved type definition
    schema?: object; // Add structured data support
}

export function SEO({
    title,
    description,
    image,
    type = "website",
    schema
}: SEOProps) {
    const [path] = useLocation();

    // SEO Defaults
    const defaultTitle = "Say It English | آموزش آنلاین تخصصی زبان انگلیسی";
    const defaultDesc = "بهترین پلتفرم یادگیری زبان انگلیسی با دوره‌های ویدیویی، کلاس خصوصی و مقالات آموزشی. یادگیری مکالمه انگلیسی را با متد جدید تجربه کنید.";
    const defaultImage = "https://say-it-english.vercel.app/og-default.jpg"; // Replace with your logo/banner
    const siteUrl = "https://say-it-english.vercel.app";
    const currentUrl = `${siteUrl}${path}`;

    const finalTitle = title ? `${title} | Say It English` : defaultTitle;
    const finalDesc = description || defaultDesc;
    const finalImage = image || defaultImage;

    // Structured Data (JSON-LD)
    const baseSchema = {
        "@context": "https://schema.org",
        "@type": type === "article" ? "TechArticle" : "WebSite",
        "name": finalTitle,
        "url": currentUrl,
        "description": finalDesc,
        "image": finalImage,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": currentUrl
        },
        "publisher": {
            "@type": "Organization",
            "name": "Say It English",
            "logo": {
                "@type": "ImageObject",
                "url": "https://say-it-english.vercel.app/favicon.ico"
            }
        },
        ...(schema || {}) // Merge custom schema (e.g., Course schema)
    };

    return (
        <Helmet>
            {/* Standard Meta Tags */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDesc} />
            <link rel="canonical" href={currentUrl} />
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
            <meta name="robots" content="index, follow" />

            {/* Open Graph (Facebook/LinkedIn) */}
            <meta property="og:site_name" content="Say It English" />
            <meta property="og:type" content={type} />
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDesc} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:locale" content="fa_IR" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDesc} />
            <meta name="twitter:image" content={finalImage} />

            {/* Structured Data for Google Rich Results */}
            <script type="application/ld+json">
                {JSON.stringify(baseSchema)}
            </script>
        </Helmet>
    );
}
